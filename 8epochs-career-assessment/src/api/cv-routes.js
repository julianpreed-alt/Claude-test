import { supabaseAdmin } from '../lib/supabase.js';
import { getFullUser } from '../lib/auth.js';
import { resolvePDFJS } from 'pdfjs-serverless';

/**
 * POST /api/assessment/:id/cv
 * Accepts a PDF, extracts text, strips PII, stores it, consumes a Phase 2 credit,
 * and starts the Phase 2 conversation with the CV included.
 */
export async function handleCvUpload(request, env, assessmentId) {
  const { user, dbUser, error } = await getFullUser(request, env);
  if (error) return Response.json({ error }, { status: 401 });

  const body = await request.json();
  const { filename, file_data, consent_given } = body;

  if (!consent_given) {
    return Response.json({ error: 'Consent is required to upload a CV.' }, { status: 400 });
  }
  if (!file_data || typeof file_data !== 'string') {
    return Response.json({ error: 'No file provided.' }, { status: 400 });
  }

  const sb = supabaseAdmin(env);
  const now = new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || '';

  // Verify ownership and current status
  const { data: assessment, error: fetchErr } = await sb
    .from('assessments')
    .select('id, user_id, status, phase1_handoff')
    .eq('id', assessmentId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !assessment) {
    return Response.json({ error: 'Assessment not found' }, { status: 404 });
  }

  if (assessment.status !== 'phase1_complete') {
    return Response.json({ error: 'Phase 1 must be complete before starting Phase 2.', status: assessment.status }, { status: 409 });
  }

  // Decode base64
  let pdfBytes;
  try {
    const binaryString = atob(file_data);
    pdfBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      pdfBytes[i] = binaryString.charCodeAt(i);
    }
  } catch (e) {
    return Response.json({ error: 'Invalid file data.' }, { status: 400 });
  }

  // Size check (5 MB)
  if (pdfBytes.length > 5 * 1024 * 1024) {
    return Response.json({ error: 'File is too large. Maximum size is 5 MB.' }, { status: 400 });
  }

  // Extract text using pdfjs-serverless (purpose-built for Cloudflare Workers)
  let extractedText;
  try {
    const { getDocument } = await resolvePDFJS();
    const doc = await getDocument({ data: pdfBytes, useSystemFonts: true }).promise;
    const pageTexts = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      pageTexts.push(pageText);
    }
    extractedText = pageTexts.join('\n\n');
  } catch (e) {
    console.error('PDF extraction error:', e);
    return Response.json({ error: 'Could not read this PDF. Please try a different file.' }, { status: 400 });
  }

  if (!extractedText || extractedText.trim().length < 50) {
    return Response.json({ error: 'Could not extract enough text from this PDF. It may be a scanned image or empty.' }, { status: 400 });
  }

  // Strip PII
  const cleanedText = stripPII(extractedText);

  // Reject CVs that exceed 15,000 characters (~2,500 words / 4-5 pages)
  if (cleanedText.length > 15000) {
    return Response.json({
      error: 'Your CV is too long. Please trim it to roughly 4-5 pages (around 2,500 words) and try again. Focus on your most relevant recent experience.',
    }, { status: 400 });
  }

  // Detect English — reject if too low a proportion of common English words appear
  if (!isLikelyEnglish(cleanedText)) {
    return Response.json({
      error: 'This service currently supports English-language CVs only. Please upload an English-language version of your CV.',
    }, { status: 400 });
  }

  const finalText = cleanedText;

  // Check for Phase 2 credit
  const { data: credits } = await sb
    .from('credits')
    .select('id')
    .eq('user_id', user.id)
    .eq('phase', 2)
    .eq('status', 'available')
    .limit(1);

  if (!credits || credits.length === 0) {
    return Response.json({ error: 'No Phase 2 credits available.' }, { status: 403 });
  }
  const creditId = credits[0].id;

  // Build Phase 2 system prompt with CV
  const { buildPhase2SystemPrompt } = await import('./assessment-routes.js');
  const systemPrompt = buildPhase2SystemPrompt(assessment.phase1_handoff, finalText);

  // Save CV and start Phase 2
  const { error: updateErr } = await sb
    .from('assessments')
    .eq('id', assessmentId)
    .update({
      cv_text: finalText,
      cv_uploaded_at: now,
      cv_consent_given_at: now,
      phase2_system_prompt: systemPrompt,
      phase2_credit_id: creditId,
      status: 'phase2_active',
      updated_at: now,
    });

  if (updateErr) {
    console.error('CV save error:', updateErr);
    return Response.json({ error: 'Failed to save CV.' }, { status: 500 });
  }

  // Consume the Phase 2 credit
  await sb
    .from('credits')
    .eq('id', creditId)
    .eq('status', 'available')
    .update({
      status: 'consumed',
      assessment_id: assessmentId,
      consumed_at: now,
    });

  // Audit log
  await sb.from('audit_log').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    user_email: dbUser.email,
    action: 'cv_uploaded',
    details: {
      assessment_id: assessmentId,
      filename: filename,
      original_size_bytes: pdfBytes.length,
      cleaned_text_length: finalText.length,
    },
    ip_address: ip,
    created_at: now,
  });

  return Response.json({ success: true, status: 'phase2_active' });
}

/**
 * POST /api/assessment/:id/cv-skip
 * User chose to skip CV upload. Consumes Phase 2 credit and starts Phase 2 without CV.
 */
export async function handleCvSkip(request, env, assessmentId) {
  const { user, dbUser, error } = await getFullUser(request, env);
  if (error) return Response.json({ error }, { status: 401 });

  const sb = supabaseAdmin(env);
  const now = new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || '';

  // Verify ownership
  const { data: assessment, error: fetchErr } = await sb
    .from('assessments')
    .select('id, user_id, status, phase1_handoff')
    .eq('id', assessmentId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !assessment) {
    return Response.json({ error: 'Assessment not found' }, { status: 404 });
  }

  if (assessment.status !== 'phase1_complete') {
    return Response.json({ error: 'Phase 1 must be complete before starting Phase 2.', status: assessment.status }, { status: 409 });
  }

  // Check for Phase 2 credit
  const { data: credits } = await sb
    .from('credits')
    .select('id')
    .eq('user_id', user.id)
    .eq('phase', 2)
    .eq('status', 'available')
    .limit(1);

  if (!credits || credits.length === 0) {
    return Response.json({ error: 'No Phase 2 credits available.' }, { status: 403 });
  }
  const creditId = credits[0].id;

  // Build Phase 2 system prompt without CV
  const { buildPhase2SystemPrompt } = await import('./assessment-routes.js');
  const systemPrompt = buildPhase2SystemPrompt(assessment.phase1_handoff, null);

  // Update assessment
  const { error: updateErr } = await sb
    .from('assessments')
    .eq('id', assessmentId)
    .update({
      phase2_system_prompt: systemPrompt,
      phase2_credit_id: creditId,
      status: 'phase2_active',
      updated_at: now,
    });

  if (updateErr) {
    console.error('CV skip error:', updateErr);
    return Response.json({ error: 'Failed to start Phase 2.' }, { status: 500 });
  }

  // Consume Phase 2 credit
  await sb
    .from('credits')
    .eq('id', creditId)
    .eq('status', 'available')
    .update({
      status: 'consumed',
      assessment_id: assessmentId,
      consumed_at: now,
    });

  // Audit log
  await sb.from('audit_log').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    user_email: dbUser.email,
    action: 'cv_skipped',
    details: { assessment_id: assessmentId },
    ip_address: ip,
    created_at: now,
  });

  return Response.json({ success: true, status: 'phase2_active' });
}

/**
 * Strip personally identifying information from CV text.
 * This is a safety net — users are also asked to anonymise manually.
 */
function stripPII(text) {
  if (!text) return '';

  let cleaned = text;

  // Email addresses
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email removed]');

  // Phone numbers — international and UK formats
  // Matches: +44 7700 900000, 07700 900000, (020) 7946 0958, +1 (555) 123-4567, etc.
  cleaned = cleaned.replace(/(\+\d{1,3}[\s.-]?)?(\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}(?!\d)/g, function(match) {
    // Heuristic: phone numbers have 7+ digits total
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      return '[phone removed]';
    }
    return match;
  });

  // UK postcodes (e.g. SW1A 1AA, EC1V 2NX, M1 1AE)
  cleaned = cleaned.replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi, '[postcode removed]');

  // US ZIP codes (5 digit or 5+4)
  cleaned = cleaned.replace(/\b\d{5}(?:-\d{4})?\b(?=\s*(?:USA|US|United States|$|\n))/g, '[zip removed]');

  // URLs — strip but keep the fact that one was there
  cleaned = cleaned.replace(/https?:\/\/[^\s<>"']+/gi, '[url removed]');
  cleaned = cleaned.replace(/\bwww\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s<>"']*/gi, '[url removed]');

  // LinkedIn-style URLs without protocol
  cleaned = cleaned.replace(/\b(linkedin\.com|github\.com|twitter\.com|x\.com|facebook\.com|instagram\.com)\/[^\s]+/gi, '[social profile removed]');

  // Common UK street address patterns (number + street name + street type)
  // e.g. "12 High Street", "47 Park Road"
  cleaned = cleaned.replace(/\b\d+[a-z]?\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(Street|Road|Avenue|Lane|Drive|Close|Crescent|Place|Court|Way|Gardens|Square|Terrace|Mews|Park|Rise|Walk|St|Rd|Ave|Ln|Dr|Cl|Cres|Pl|Ct|Wy|Gdns|Sq|Ter|Mws)\b\.?/g, '[street address removed]');

  // Multiple consecutive "removed" markers collapsed
  cleaned = cleaned.replace(/(\[(?:email|phone|postcode|zip|url|street address|social profile) removed\][\s,]*){2,}/g, '[contact details removed] ');

  // Collapse excessive whitespace from stripping
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Simple English language detection.
 * Checks whether at least 5% of the words in the text are among the most common
 * English words. Non-English CVs (even with some English loanwords like
 * "Microsoft" or "manager") will fall well below this threshold.
 */
function isLikelyEnglish(text) {
  if (!text || text.length < 100) return true; // Too short to detect, allow

  const commonEnglish = new Set([
    'the', 'and', 'of', 'to', 'a', 'in', 'is', 'for', 'on', 'with',
    'at', 'as', 'by', 'an', 'be', 'this', 'that', 'from', 'or', 'are',
    'was', 'were', 'have', 'has', 'had', 'will', 'would', 'can', 'could',
    'should', 'about', 'into', 'through', 'over', 'under', 'between',
    'experience', 'work', 'team', 'project', 'projects', 'role', 'roles',
    'company', 'companies', 'business', 'management', 'manager', 'managed',
    'managing', 'developed', 'developing', 'lead', 'led', 'leading',
    'responsible', 'responsibility', 'including', 'across', 'within',
    'their', 'this', 'these', 'those', 'which', 'who', 'where', 'when',
    'how', 'what', 'while', 'also', 'but', 'not', 'all', 'any', 'each',
    'years', 'year', 'months', 'university', 'degree', 'bachelor',
    'master', 'education', 'skills', 'professional',
  ]);

  // Extract words (alphabetic only, lowercase, 2+ chars)
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
  if (words.length < 50) return true; // Not enough words to judge

  let matches = 0;
  for (const w of words) {
    if (commonEnglish.has(w)) matches++;
  }

  const ratio = matches / words.length;
  return ratio >= 0.05; // At least 5% common English words
}
