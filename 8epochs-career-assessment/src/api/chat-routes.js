import { supabaseAdmin } from '../lib/supabase.js';
import { getFullUser } from '../lib/auth.js';
import { checkRateLimit, rateLimitResponse } from '../lib/ratelimit.js';

/**
 * POST /api/chat
 * Body: { assessment_id, message_text, is_resume? }
 *
 * Sends user message to Claude with full conversation history,
 * streams the response back via SSE.
 *
 * If message_text is null/empty and there are no existing messages,
 * this triggers Claude's opening message (no user message needed).
 */
export async function handleChat(request, env) {
  const { user, error } = await getFullUser(request, env);
  if (error) {
    return Response.json({ error }, { status: 401 });
  }

  // Rate limit
  const { allowed } = await checkRateLimit(env, user.id, 'chat_message');
  if (!allowed) return rateLimitResponse();

  const body = await request.json();
  const { assessment_id, message_text, is_resume } = body;

  if (!assessment_id) {
    return Response.json({ error: 'assessment_id is required' }, { status: 400 });
  }

  const sb = supabaseAdmin(env);

  // Load the assessment
  const { data: assessment, error: assessErr } = await sb
    .from('assessments')
    .select('*')
    .eq('id', assessment_id)
    .eq('user_id', user.id)
    .single();

  if (assessErr || !assessment) {
    return Response.json({ error: 'Assessment not found' }, { status: 404 });
  }

  // Determine which phase we're in
  const phase = ['phase1_active', 'phase1_complete'].includes(assessment.status) ? 1
    : ['phase2_active', 'phase2_complete'].includes(assessment.status) ? 2
    : 1; // Default to phase 1

  if (!['phase1_active', 'phase2_active'].includes(assessment.status)) {
    return Response.json({ error: 'Assessment is not in an active conversation phase', status: assessment.status }, { status: 409 });
  }

  // Get system prompt
  const systemPrompt = phase === 1 ? assessment.phase1_system_prompt : assessment.phase2_system_prompt;
  if (!systemPrompt) {
    return Response.json({ error: 'System prompt not configured for this phase' }, { status: 500 });
  }

  // Load existing messages
  const { data: existingMessages, error: msgErr } = await sb
    .from('messages')
    .select('role, content, sequence_number')
    .eq('assessment_id', assessment_id)
    .eq('phase', phase)
    .order('sequence_number', { ascending: true });

  if (msgErr) {
    console.error('Messages load error:', msgErr);
    return Response.json({ error: 'Failed to load conversation history' }, { status: 500 });
  }

  const messages = (existingMessages || []).map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Determine next sequence number
  const nextSeq = (existingMessages || []).length > 0
    ? Math.max(...existingMessages.map(m => m.sequence_number)) + 1
    : 1;

  // The Anthropic API requires messages to start with a user message and alternate.
  // For the opening, we use a system-level user prompt that's not saved to the DB.
  // On subsequent calls, we need to prepend the same opening prompt since it wasn't persisted.
  if (messages.length > 0 && messages[0].role === 'assistant') {
    // Prepend the opening prompt so the history starts with user
    messages.unshift({
      role: 'user',
      content: '[The person has just completed the intake form and questionnaire and is now entering the conversation. Send your personalised opening message.]',
    });
  }

  // Add the user's message if provided
  const isOpeningRequest = !message_text && (existingMessages || []).length === 0;

  if (message_text && message_text.trim()) {
    const userContent = message_text.trim();

    // If this is a resume (user returning after a break), prepend context
    // We add it as a system-level note in the user message
    let finalUserContent = userContent;

    messages.push({ role: 'user', content: finalUserContent });

    // Save user message to DB
    await sb.from('messages').insert({
      id: crypto.randomUUID(),
      assessment_id,
      phase,
      role: 'user',
      content: finalUserContent,
      sequence_number: nextSeq,
      created_at: new Date().toISOString(),
    });
  } else if (isOpeningRequest) {
    // No user message needed for the opening — Claude speaks first.
    // We add a minimal user prompt to trigger Claude's response.
    messages.push({
      role: 'user',
      content: '[The person has just completed the intake form and questionnaire and is now entering the conversation. Send your personalised opening message.]',
    });
  } else if (is_resume && messages.length > 0) {
    // Resume without a new message — trigger a welcome-back from Claude
    messages.push({
      role: 'user',
      content: '[The person has returned after a break in the conversation. Send a brief, warm message acknowledging the pause and continue the assessment naturally.]',
    });
  } else {
    return Response.json({ error: 'message_text is required' }, { status: 400 });
  }

  // Build the Anthropic API request
  // Add cache_control to the second-to-last message to cache conversation history
  // This means only the new user message is uncached input on each call
  if (messages.length >= 3) {
    const cacheIdx = messages.length - 2;
    // Messages need to be content blocks (not plain strings) to support cache_control
    if (typeof messages[cacheIdx].content === 'string') {
      messages[cacheIdx].content = [
        {
          type: 'text',
          text: messages[cacheIdx].content,
          cache_control: { type: 'ephemeral' },
        },
      ];
    }
  }

  const anthropicRequest = {
    model: 'claude-opus-4-20250514',
    max_tokens: 16384,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
    stream: true,
  };

  // Call Anthropic API with streaming
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicRequest),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errBody);
      return Response.json({
        error: 'Something went wrong. You can try again now or come back later — your conversation is saved.',
      }, { status: 502 });
    }

    // Stream the response through to the client via SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process the stream in the background
    const streamPromise = processStream(
      anthropicRes.body,
      writer,
      encoder,
      sb,
      assessment_id,
      phase,
      isOpeningRequest ? nextSeq : nextSeq + 1, // Opening request doesn't save a user message
      assessment,
      env
    );

    // Don't await the stream — let it run in background via waitUntil
    // But we still need to handle errors
    streamPromise.catch(err => {
      console.error('Stream processing error:', err);
      try {
        writer.write(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`));
        writer.close();
      } catch { /* ignore */ }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err) {
    console.error('Anthropic request failed:', err);
    return Response.json({
      error: 'Something went wrong. You can try again now or come back later — your conversation is saved.',
    }, { status: 502 });
  }
}

/**
 * Processes the Anthropic SSE stream:
 * - Strips [PROGRESS:xxx] tags and sends them as separate SSE events
 * - Forwards text deltas to the client
 * - Accumulates the full response
 * - Saves the assistant message to DB when complete
 * - Checks for completion markers
 */
async function processStream(body, writer, encoder, sb, assessmentId, phase, assistantSeq, assessment, env) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';
  let progressSent = false;

  function send(event, data) {
    writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from the buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);

        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            let text = event.delta.text;

            // Progress tag handling — buffer text until we're sure whether a tag is present
            // The tag format is [PROGRESS:word] at the very start of the response.
            // We must not forward any text to the client until we can resolve this,
            // otherwise the user sees "[" appear at the start of the message.
            if (!progressSent) {
              fullResponse += text;

              // Has the response committed to NOT having a progress tag?
              // - If the first character isn't '[', no tag is possible.
              // - If we've seen the closing ']' of a [PROGRESS:xxx] tag, we can resolve it.
              // - If we've accumulated enough characters without seeing the closing ']',
              //   it's not a valid tag.
              const first = fullResponse.charAt(0);

              if (first !== '[') {
                // Definitely no tag. Send everything accumulated so far.
                progressSent = true;
                send('text', { text: fullResponse });
                // Don't reset fullResponse — it's the canonical record
                continue;
              }

              // First char IS '[' — keep buffering until we find ']' or give up
              const closeIdx = fullResponse.indexOf(']');
              if (closeIdx === -1) {
                // Still waiting for the closing bracket
                if (fullResponse.length > 25) {
                  // Too long to be a [PROGRESS:xxx] tag — flush as plain text
                  progressSent = true;
                  send('text', { text: fullResponse });
                }
                continue;
              }

              // We have a closing bracket — try to parse a tag
              const candidate = fullResponse.slice(0, closeIdx + 1);
              const tagMatch = candidate.match(/^\[PROGRESS:(\w+)\]$/);
              progressSent = true;

              if (tagMatch) {
                // Valid tag found — send progress event and strip tag from fullResponse
                send('progress', { phase: tagMatch[1] });
                // Strip the tag and any trailing whitespace/newlines
                fullResponse = fullResponse.slice(closeIdx + 1).replace(/^\s+/, '');
                if (fullResponse) {
                  send('text', { text: fullResponse });
                }
              } else {
                // Started with '[' but wasn't a valid progress tag — send as plain text
                send('text', { text: fullResponse });
              }
              continue;
            }

            fullResponse += text;
            send('text', { text });
          }

          if (event.type === 'message_stop') {
            // Stream is complete
            send('done', { message_length: fullResponse.length });
          }

          if (event.type === 'error') {
            console.error('Anthropic stream error:', event.error);
            send('error', { error: event.error?.message || 'Stream error' });
          }

        } catch (parseErr) {
          // Skip unparseable lines
        }
      }
    }

    // Save assistant message to DB
    if (fullResponse) {
      await sb.from('messages').insert({
        id: crypto.randomUUID(),
        assessment_id: assessmentId,
        phase,
        role: 'assistant',
        content: fullResponse,
        sequence_number: assistantSeq,
        created_at: new Date().toISOString(),
      });

      // Update assessment timestamp
      await sb.from('assessments').eq('id', assessmentId).update({
        updated_at: new Date().toISOString(),
      });

      // Check for completion markers (Phase 1: ---HANDOFF_START--- / ---HANDOFF_END---)
      if (phase === 1 && fullResponse.includes('---HANDOFF_START---') && fullResponse.includes('---HANDOFF_END---')) {
        await handlePhase1Completion(sb, assessmentId, fullResponse);
        send('phase_complete', { phase: 1 });
      }

      // Phase 2 completion detection (look for the unified career profile markers)
      if (phase === 2 && fullResponse.includes('## UNIFIED CAREER PROFILE')) {
        await handlePhase2Completion(sb, assessmentId, fullResponse);
        send('phase_complete', { phase: 2 });
      }
    }

  } catch (err) {
    console.error('Stream processing error:', err);
    send('error', { error: 'Stream processing failed' });
  } finally {
    writer.close();
  }
}

/**
 * Extracts report and handoff from Phase 1 completion response.
 */
async function handlePhase1Completion(sb, assessmentId, fullResponse) {
  try {
    const handoffStart = fullResponse.indexOf('---HANDOFF_START---');
    const handoffEnd = fullResponse.indexOf('---HANDOFF_END---');

    if (handoffStart === -1 || handoffEnd === -1) return;

    const report = fullResponse.substring(0, handoffStart).trim();
    const handoff = fullResponse.substring(
      handoffStart + '---HANDOFF_START---'.length,
      handoffEnd
    ).trim();

    // Validate handoff has expected sections
    const requiredSections = ['Dimension Scores', 'Values Profile'];
    const hasRequired = requiredSections.every(s => handoff.includes(s));

    if (!hasRequired) {
      console.warn('Handoff document missing required sections for assessment:', assessmentId);
      // Still save it, but log the warning
    }

    await sb.from('assessments').eq('id', assessmentId).update({
      phase1_report: report,
      phase1_handoff: handoff,
      status: 'phase1_complete',
      updated_at: new Date().toISOString(),
    });

    console.log('Phase 1 completed for assessment:', assessmentId);
  } catch (err) {
    console.error('Phase 1 completion handling error:', err);
  }
}

/**
 * Extracts and stores Phase 2 report.
 */
async function handlePhase2Completion(sb, assessmentId, fullResponse) {
  try {
    await sb.from('assessments').eq('id', assessmentId).update({
      phase2_report: fullResponse,
      status: 'phase2_complete',
      updated_at: new Date().toISOString(),
    });

    console.log('Phase 2 completed for assessment:', assessmentId);
  } catch (err) {
    console.error('Phase 2 completion handling error:', err);
  }
}
