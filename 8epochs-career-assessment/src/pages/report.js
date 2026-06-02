import { sharedStyles, navHTML, supabaseAuthScript } from './serve.js';

export function reportPage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Personality Profile — 8epochs</title>
  <style>${sharedStyles()}

    .report-container {
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 24px 100px;
    }

    .report-header {
      text-align: center;
      margin-bottom: 56px;
      padding-bottom: 40px;
      border-bottom: 1px solid var(--border-light);
    }

    .report-header h1 {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }

    .report-date {
      font-size: 0.85rem;
      color: var(--text-light);
      margin-bottom: 24px;
    }

    .report-name {
      font-family: var(--font-serif);
      font-size: 1.1rem;
      color: var(--text-muted);
    }

    .report-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
    }

    /* ---- Sections ---- */

    .report-section {
      margin-bottom: 56px;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
      margin-bottom: 16px;
    }

    .section-title {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      font-weight: 400;
      color: var(--text);
      margin-bottom: 24px;
    }

    /* ---- Big Five Scores ---- */

    .score-item {
      margin-bottom: 24px;
    }

    .score-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }

    .score-trait {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text);
    }

    .score-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--accent);
    }

    .score-bar-bg {
      height: 6px;
      background: var(--border-light);
      border-radius: 3px;
      overflow: hidden;
    }

    .score-bar-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 3px;
      transition: width 0.8s ease;
    }

    .score-level {
      font-size: 0.78rem;
      color: var(--text-light);
      margin-top: 4px;
    }

    .score-description {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.65;
      margin-top: 8px;
    }

    /* ---- MBTI Section ---- */

    .mbti-type-display {
      text-align: center;
      padding: 32px 24px;
      background: var(--accent-light);
      border-radius: var(--radius);
      margin-bottom: 32px;
    }

    .mbti-code {
      font-family: var(--font-serif);
      font-size: 2.8rem;
      font-weight: 400;
      color: var(--accent);
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }

    .mbti-nickname {
      font-family: var(--font-serif);
      font-size: 1.1rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .mbti-dimension {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .mbti-pole {
      font-size: 0.85rem;
      font-weight: 500;
      width: 60px;
      text-align: right;
      color: var(--text-muted);
    }

    .mbti-pole.active {
      color: var(--accent);
      font-weight: 600;
    }

    .mbti-bar-wrap {
      flex: 1;
      display: flex;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      background: var(--border-light);
    }

    .mbti-bar-left {
      height: 100%;
      background: var(--accent);
      border-radius: 4px 0 0 4px;
      transition: width 0.8s ease;
    }

    .mbti-bar-right {
      height: 100%;
      background: var(--border);
      border-radius: 0 4px 4px 0;
      flex: 1;
    }

    .mbti-pole-right {
      width: 60px;
      text-align: left;
    }

    .mbti-strength {
      font-size: 0.78rem;
      color: var(--text-light);
      text-align: center;
      margin-top: -4px;
      margin-bottom: 16px;
    }

    /* ---- Cognitive Function Stack ---- */

    .function-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .function-item {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .function-position {
      width: 80px;
      flex-shrink: 0;
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-light);
      padding-top: 2px;
    }

    .function-detail {
      flex: 1;
    }

    .function-name {
      font-weight: 500;
      font-size: 0.95rem;
      color: var(--text);
      margin-bottom: 4px;
    }

    .function-evidence {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* ---- Narrative Sections ---- */

    .narrative {
      font-family: var(--font-serif);
      font-size: 1.05rem;
      line-height: 1.75;
      color: var(--text);
    }

    .narrative p {
      color: var(--text);
      margin-bottom: 16px;
    }

    .narrative p:last-child {
      margin-bottom: 0;
    }

    /* ---- Strengths & Growth ---- */

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }

    .col-items .col-title {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--accent);
      margin-bottom: 16px;
    }

    .col-item {
      font-size: 0.92rem;
      line-height: 1.6;
      color: var(--text);
      margin-bottom: 12px;
      padding-left: 16px;
      position: relative;
    }

    .col-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 9px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--accent);
    }

    .growth-item::before {
      background: var(--text-light);
    }

    /* ---- Phase 2 CTA ---- */

    .phase2-cta {
      text-align: center;
      padding: 40px 24px;
      background: var(--accent-light);
      border-radius: var(--radius);
      margin-top: 56px;
    }

    .phase2-cta h3 {
      font-family: var(--font-serif);
      font-size: 1.3rem;
      font-weight: 400;
      color: var(--text);
      text-transform: none;
      letter-spacing: normal;
      margin-bottom: 8px;
    }

    .phase2-cta p {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-bottom: 20px;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }

    /* ---- Transcript Link ---- */

    .transcript-link {
      text-align: center;
      margin-top: 32px;
    }

    .transcript-link a {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    /* ---- Divider ---- */

    .report-divider {
      border: none;
      border-top: 1px solid var(--border-light);
      margin: 48px 0;
    }

    /* ---- Loading ---- */

    .loading-state {
      text-align: center;
      padding: 120px 24px;
      color: var(--text-muted);
    }

    .error-state {
      text-align: center;
      padding: 80px 24px;
    }

    /* ---- Responsive ---- */

    @media (max-width: 600px) {
      .two-col {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .report-header h1 {
        font-size: 1.8rem;
      }

      .mbti-code {
        font-size: 2.2rem;
      }

      .function-item {
        flex-direction: column;
        gap: 4px;
      }

      .function-position {
        width: auto;
      }
    }

    @media print {
      .nav, .report-actions, .phase2-cta, .transcript-link { display: none; }
      .report-container { padding-top: 24px; }
    }
  </style>
</head>
<body>
  ${navHTML({ authenticated: true })}

  <div class="report-container" id="report-container">
    <div class="loading-state">
      <div class="spinner" style="width:28px; height:28px; border-color: var(--border); border-top-color: var(--accent); margin: 0 auto 12px;"></div>
      <p>Loading your report...</p>
    </div>
  </div>

  ${supabaseAuthScript(env)}
  <script>
    const params = new URLSearchParams(window.location.search);
    const assessmentId = params.get('id');
    const phase = parseInt(params.get('phase') || '1');

    if (!assessmentId) {
      window.location.href = '/career-assessment/dashboard';
    }

    async function loadReport() {
      if (window.waitForAuth) await window.waitForAuth();
      const res = await apiFetch('/api/assessment/' + assessmentId + '/report/phase' + phase);
      if (!res) return;

      if (res.status === 404) {
        document.getElementById('report-container').innerHTML = '<div class="error-state"><h2>Report not available yet</h2><p style="margin-top:12px;">Complete the assessment conversation first.</p><a href="/career-assessment/dashboard" class="btn" style="margin-top:24px; display:inline-block;">Back to Dashboard</a></div>';
        return;
      }

      const data = await res.json();
      if (data.error) {
        document.getElementById('report-container').innerHTML = '<div class="error-state"><h2>Error loading report</h2><p style="margin-top:12px;">' + data.error + '</p><a href="/career-assessment/dashboard" class="btn" style="margin-top:24px; display:inline-block;">Back to Dashboard</a></div>';
        return;
      }

      renderReport(data);
    }

    function renderReport(data) {
      var report = data.report;
      var intake = data.intake || {};
      var completedDate = new Date(data.updated_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      if (phase === 2) {
        renderPhase2Report(report, intake, completedDate);
      } else {
        renderPhase1Report(report, intake, completedDate);
      }
    }

    function renderPhase1Report(report, intake, completedDate) {
      // Parse the markdown report into sections
      var parsed = parseReport(report);

      var html = '';

      // Header
      html += '<div class="report-header">';
      html += '<div class="section-label">Personality Profile</div>';
      html += '<h1>Your Results</h1>';
      html += '<div class="report-date">Completed ' + completedDate + '</div>';
      if (intake.name) {
        html += '<div class="report-name">' + escapeHtml(intake.name) + '</div>';
      }
      html += '<div class="report-actions">';
      html += '<a href="/career-assessment/chat?id=' + assessmentId + '" class="btn btn-secondary btn-sm">View Conversation</a>';
      html += '</div>';
      html += '</div>';

      // Big Five Section
      if (parsed.bigFive.length > 0) {
        html += '<div class="report-section">';
        html += '<div class="section-label">Big Five (OCEAN)</div>';
        for (var i = 0; i < parsed.bigFive.length; i++) {
          var trait = parsed.bigFive[i];
          html += '<div class="score-item">';
          html += '<div class="score-header">';
          html += '<span class="score-trait">' + escapeHtml(trait.name) + '</span>';
          html += '<span class="score-value">' + trait.score + '%</span>';
          html += '</div>';
          html += '<div class="score-bar-bg"><div class="score-bar-fill" style="width:' + trait.score + '%"></div></div>';
          if (trait.level) {
            html += '<div class="score-level">' + escapeHtml(trait.level) + '</div>';
          }
          if (trait.description) {
            html += '<div class="score-description">' + escapeHtml(trait.description) + '</div>';
          }
          html += '</div>';
        }
        html += '</div>';
      }

      // MBTI Section
      if (parsed.mbtiType) {
        html += '<div class="report-section">';
        html += '<div class="section-label">Myers-Briggs Type</div>';
        html += '<div class="mbti-type-display">';
        html += '<div class="mbti-code">' + escapeHtml(parsed.mbtiType) + '</div>';
        if (parsed.mbtiNickname) {
          html += '<div class="mbti-nickname">' + escapeHtml(parsed.mbtiNickname) + '</div>';
        }
        html += '</div>';

        // Dimension bars
        for (var j = 0; j < parsed.mbtiDimensions.length; j++) {
          var dim = parsed.mbtiDimensions[j];
          html += '<div class="mbti-dimension">';
          html += '<div class="mbti-pole' + (dim.leftPct >= dim.rightPct ? ' active' : '') + '">' + escapeHtml(dim.leftLabel) + ' ' + dim.leftPct + '%</div>';
          html += '<div class="mbti-bar-wrap">';
          html += '<div class="mbti-bar-left" style="width:' + dim.leftPct + '%"></div>';
          html += '<div class="mbti-bar-right"></div>';
          html += '</div>';
          html += '<div class="mbti-pole mbti-pole-right' + (dim.rightPct > dim.leftPct ? ' active' : '') + '">' + dim.rightPct + '% ' + escapeHtml(dim.rightLabel) + '</div>';
          html += '</div>';
          if (dim.strength) {
            html += '<div class="mbti-strength">' + escapeHtml(dim.strength) + '</div>';
          }
        }
        html += '</div>';
      }

      // Cognitive Function Stack
      if (parsed.functions.length > 0) {
        html += '<div class="report-section">';
        html += '<div class="section-label">Cognitive Function Stack</div>';
        html += '<div class="function-stack">';
        for (var k = 0; k < parsed.functions.length; k++) {
          var fn = parsed.functions[k];
          html += '<div class="function-item">';
          html += '<div class="function-position">' + escapeHtml(fn.position) + '</div>';
          html += '<div class="function-detail">';
          html += '<div class="function-name">' + escapeHtml(fn.name) + '</div>';
          if (fn.evidence) {
            html += '<div class="function-evidence">' + escapeHtml(fn.evidence) + '</div>';
          }
          html += '</div>';
          html += '</div>';
        }
        html += '</div>';
        html += '</div>';
      }

      // Core Values
      if (parsed.values) {
        html += '<hr class="report-divider">';
        html += '<div class="report-section">';
        html += '<div class="section-label">Your Core Values</div>';
        html += '<div class="narrative">' + markdownToHtml(parsed.values) + '</div>';
        html += '</div>';
      }

      // Cross-Framework Insights
      if (parsed.insights) {
        html += '<div class="report-section">';
        html += '<div class="section-label">Cross-Framework Insights</div>';
        html += '<div class="narrative">' + markdownToHtml(parsed.insights) + '</div>';
        html += '</div>';
      }

      // Strengths & Growth Areas
      if (parsed.strengths.length > 0 || parsed.growth.length > 0) {
        html += '<hr class="report-divider">';
        html += '<div class="report-section">';
        html += '<div class="two-col">';

        if (parsed.strengths.length > 0) {
          html += '<div class="col-items">';
          html += '<div class="col-title">Your Core Strengths</div>';
          for (var s = 0; s < parsed.strengths.length; s++) {
            html += '<div class="col-item">' + escapeHtml(parsed.strengths[s]) + '</div>';
          }
          html += '</div>';
        }

        if (parsed.growth.length > 0) {
          html += '<div class="col-items">';
          html += '<div class="col-title">Growth Areas</div>';
          for (var g = 0; g < parsed.growth.length; g++) {
            html += '<div class="col-item growth-item">' + escapeHtml(parsed.growth[g]) + '</div>';
          }
          html += '</div>';
        }

        html += '</div>';
        html += '</div>';
      }

      // Phase 2 CTA
      html += '<div class="phase2-cta">';
      html += '<h3>Ready to go deeper?</h3>';
      html += '<p>The career interest assessment explores what kind of work genuinely energises you, and synthesises everything into a unified career profile.</p>';
      html += '<a href="/career-assessment/dashboard" class="btn" style="background:var(--accent-soft); border-color:#1B2A4A; color:#1B2A4A;">Back to Dashboard</a>';
      html += '</div>';

      // Transcript link
      html += '<div class="transcript-link">';
      html += '<a href="/career-assessment/chat?id=' + assessmentId + '">View conversation transcript</a>';
      html += '</div>';

      document.getElementById('report-container').innerHTML = html;
    }

    function renderPhase2Report(report, intake, completedDate) {
      var parsed = parsePhase2Report(report);
      var html = '';

      // Header
      html += '<div class="report-header">';
      html += '<div class="section-label">Career Profile</div>';
      html += '<h1>Your Unified Career Profile</h1>';
      html += '<div class="report-date">Completed ' + completedDate + '</div>';
      if (intake.name) {
        html += '<div class="report-name">' + escapeHtml(intake.name) + '</div>';
      }
      html += '<div class="report-actions">';
      html += '<a href="/career-assessment/report?id=' + assessmentId + '&phase=1" class="btn btn-secondary btn-sm">View Personality Report</a>';
      html += '<a href="/career-assessment/chat?id=' + assessmentId + '" class="btn btn-secondary btn-sm">View Conversation</a>';
      html += '</div>';
      html += '</div>';

      // RIASEC Scores
      if (parsed.riasec.length > 0) {
        html += '<div class="report-section">';
        html += '<div class="section-label">Holland Code (RIASEC)</div>';
        if (parsed.hollandCode) {
          html += '<div class="mbti-type-display">';
          html += '<div class="mbti-code">' + escapeHtml(parsed.hollandCode) + '</div>';
          html += '<div class="mbti-nickname">Your Holland Code</div>';
          html += '</div>';
        }
        for (var i = 0; i < parsed.riasec.length; i++) {
          var type = parsed.riasec[i];
          html += '<div class="score-item">';
          html += '<div class="score-header">';
          html += '<span class="score-trait">' + escapeHtml(type.name) + '</span>';
          html += '<span class="score-value">' + type.score + '%</span>';
          html += '</div>';
          html += '<div class="score-bar-bg"><div class="score-bar-fill" style="width:' + type.score + '%"></div></div>';
          if (type.level) {
            html += '<div class="score-level">' + escapeHtml(type.level) + '</div>';
          }
          if (type.description) {
            html += '<div class="score-description">' + escapeHtml(type.description) + '</div>';
          }
          html += '</div>';
        }
        html += '</div>';
      }

      // Holland Code Explained
      if (parsed.hollandExplained) {
        html += '<div class="report-section">';
        html += '<div class="section-label">Your Holland Code Explained</div>';
        html += '<div class="narrative">' + markdownToHtml(parsed.hollandExplained) + '</div>';
        html += '</div>';
      }

      html += '<hr class="report-divider">';

      // Unified Career Profile sections
      var sections = [
        { key: 'personality', label: 'Who You Are' },
        { key: 'values', label: 'What Drives You' },
        { key: 'vocational', label: 'What Interests You' },
        { key: 'sweetSpot', label: 'Your Career Sweet Spot' },
        { key: 'divergences', label: 'Hidden Opportunities' },
        { key: 'caution', label: 'Approach with Caution' },
        { key: 'aiEra', label: 'Your AI-Era Positioning' },
        { key: 'nextSteps', label: 'Recommended Next Steps' },
      ];

      for (var s = 0; s < sections.length; s++) {
        var sec = sections[s];
        if (parsed.unified[sec.key]) {
          html += '<div class="report-section">';
          html += '<div class="section-label">' + escapeHtml(sec.label) + '</div>';
          html += '<div class="narrative">' + markdownToHtml(parsed.unified[sec.key]) + '</div>';
          html += '</div>';
        }
      }

      // Back to dashboard
      html += '<div class="transcript-link" style="margin-top:56px;">';
      html += '<a href="/career-assessment/dashboard" class="btn" style="background:var(--accent-soft); border-color:#1B2A4A; color:#1B2A4A;">Back to Dashboard</a>';
      html += '</div>';

      html += '<div class="transcript-link">';
      html += '<a href="/career-assessment/chat?id=' + assessmentId + '">View conversation transcript</a>';
      html += '</div>';

      document.getElementById('report-container').innerHTML = html;
    }

    function parsePhase2Report(md) {
      var result = {
        hollandCode: null,
        riasec: [],
        hollandExplained: '',
        unified: {},
      };

      if (!md) return result;

      // Extract Holland Code
      var codeMatch = md.match(/Holland Code:\\s*([A-Z]{3})/i);
      if (codeMatch) {
        result.hollandCode = codeMatch[1];
      }

      // Extract RIASEC scores from table
      var riasecMatch = md.match(/\\|\\s*Type\\s*\\|[\\s\\S]*?(?=\\n###|\\n---)/i);
      if (riasecMatch) {
        var rows = riasecMatch[0].split(String.fromCharCode(10));
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i].trim();
          if (!row.startsWith('|')) continue;
          if (row.match(/^\\|[\\s-:|]+\\|$/)) continue;
          var cells = row.split('|').filter(function(c) { return c.trim() !== ''; });
          if (cells.length >= 3) {
            var name = cells[0].trim();
            if (name === 'Type' || name === '---') continue;
            var scoreStr = cells[1].trim().replace('%', '');
            var scoreNum = parseInt(scoreStr);
            if (isNaN(scoreNum)) continue;
            var level = cells.length >= 3 ? cells[2].trim() : '';
            var desc = cells.length >= 4 ? cells[3].trim() : '';
            result.riasec.push({ name: name, score: scoreNum, level: level, description: desc });
          }
        }
      }

      // Extract Holland Code Explained
      var explMatch = md.match(/Holland Code Explained\\s*\\n\\n([\\s\\S]*?)(?=\\n---)/i);
      if (explMatch) {
        result.hollandExplained = explMatch[1].trim();
      }

      // Extract Unified Career Profile sections
      var sectionMap = {
        'Who You Are': 'personality',
        'What Drives You': 'values',
        'What Interests You': 'vocational',
        'Where All Three Converge': 'sweetSpot',
        'Career Sweet Spot': 'sweetSpot',
        'Where Personality and Interest Diverge': 'divergences',
        'Hidden Opportunities': 'divergences',
        'Career Directions to Approach with Caution': 'caution',
        'Approach with Caution': 'caution',
        'AI-Era Positioning': 'aiEra',
        'Positioning Statement': 'aiEra',
        'Recommended Next Steps': 'nextSteps',
        'Next Steps': 'nextSteps',
      };

      // Split on ### headers within the unified profile section
      var unifiedStart = md.indexOf('UNIFIED CAREER PROFILE');
      if (unifiedStart !== -1) {
        var unifiedContent = md.substring(unifiedStart);
        var headerRegex = /###\\s+(.+)/g;
        var headers = [];
        var match;
        while ((match = headerRegex.exec(unifiedContent)) !== null) {
          headers.push({ title: match[1].trim(), index: match.index, fullMatch: match[0] });
        }

        for (var h = 0; h < headers.length; h++) {
          var startIdx = headers[h].index + headers[h].fullMatch.length;
          var endIdx = h + 1 < headers.length ? headers[h + 1].index : unifiedContent.length;
          var content = unifiedContent.substring(startIdx, endIdx).trim();

          // Match against known section names
          for (var key in sectionMap) {
            if (headers[h].title.indexOf(key) !== -1) {
              result.unified[sectionMap[key]] = content;
              break;
            }
          }
        }
      }

      return result;
    }

    // ============================================================
    // REPORT PARSER — extracts structured data from Claude's markdown
    // ============================================================

    function parseReport(md) {
      var result = {
        bigFive: [],
        mbtiType: null,
        mbtiNickname: null,
        mbtiDimensions: [],
        functions: [],
        values: '',
        insights: '',
        strengths: [],
        growth: [],
      };

      if (!md) return result;

      // Extract Big Five from table
      var big5Match = md.match(/Big Five[^|]*\\n(\\|[\\s\\S]*?)(?=\\n###|\\n---)/i);
      if (big5Match) {
        var rows = big5Match[1].split(String.fromCharCode(10));
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i].trim();
          if (!row.startsWith('|')) continue;
          if (row.match(/^\\|[\\s-:|]+\\|$/)) continue; // separator row
          var cells = row.split('|').filter(function(c) { return c.trim() !== ''; });
          if (cells.length >= 3) {
            var traitName = cells[0].trim();
            if (traitName === 'Trait' || traitName === '---') continue;
            var scoreStr = cells[1].trim().replace('%', '');
            var scoreNum = parseInt(scoreStr);
            if (isNaN(scoreNum)) continue;
            var level = cells.length >= 3 ? cells[2].trim() : '';
            var description = cells.length >= 4 ? cells[3].trim() : '';
            result.bigFive.push({ name: traitName, score: scoreNum, level: level, description: description });
          }
        }
      }

      // Extract MBTI type
      var mbtiMatch = md.match(/MBTI Type:\\s*([A-Z]{4})\\s*(?:[—–-]\\s*["""]?(.+?)["""]?)?$/im);
      if (mbtiMatch) {
        result.mbtiType = mbtiMatch[1];
        result.mbtiNickname = mbtiMatch[2] ? mbtiMatch[2].replace(/["""]/g, '').trim() : null;
      }

      // Extract MBTI dimensions from table
      var mbtiTableMatch = md.match(/(?:MBTI Type[\\s\\S]*?)(\\|\\s*Dimension[\\s\\S]*?)(?=\\n###|\\n---)/i);
      if (!mbtiTableMatch) {
        mbtiTableMatch = md.match(/(\\|\\s*Dimension\\s*\\|[\\s\\S]*?)(?=\\n###|\\n---)/i);
      }
      if (mbtiTableMatch) {
        var mRows = mbtiTableMatch[1].split(String.fromCharCode(10));
        for (var m = 0; m < mRows.length; m++) {
          var mRow = mRows[m].trim();
          if (!mRow.startsWith('|')) continue;
          if (mRow.match(/^\\|[\\s-:|]+\\|$/)) continue;
          var mCells = mRow.split('|').filter(function(c) { return c.trim() !== ''; });
          if (mCells.length >= 2) {
            var dimStr = mCells[0].trim();
            if (dimStr === 'Dimension' || dimStr === '---') continue;
            var scoreField = mCells[1].trim();
            var strengthField = mCells.length >= 3 ? mCells[2].trim() : '';
            // Parse "X% / Y%" pattern
            var pctMatch = scoreField.match(/(\\d+)%\\s*\\/\\s*(\\d+)%/);
            if (pctMatch) {
              // Figure out labels from dimension string
              var dimParts = dimStr.match(/([A-Z])\\/([A-Z])/);
              var labels = { E: 'Extraversion', I: 'Introversion', S: 'Sensing', N: 'Intuition', T: 'Thinking', F: 'Feeling', J: 'Judging', P: 'Perceiving' };
              var leftLabel = dimParts ? (labels[dimParts[1]] || dimParts[1]) : '';
              var rightLabel = dimParts ? (labels[dimParts[2]] || dimParts[2]) : '';
              result.mbtiDimensions.push({
                leftLabel: leftLabel,
                rightLabel: rightLabel,
                leftPct: parseInt(pctMatch[1]),
                rightPct: parseInt(pctMatch[2]),
                strength: strengthField,
              });
            }
          }
        }
      }

      // Extract Cognitive Function Stack from table
      var funcMatch = md.match(/Cognitive Function[\\s\\S]*?(\\|\\s*Position[\\s\\S]*?)(?=\\n###|\\n---)/i);
      if (funcMatch) {
        var fRows = funcMatch[1].split(String.fromCharCode(10));
        for (var f = 0; f < fRows.length; f++) {
          var fRow = fRows[f].trim();
          if (!fRow.startsWith('|')) continue;
          if (fRow.match(/^\\|[\\s-:|]+\\|$/)) continue;
          var fCells = fRow.split('|').filter(function(c) { return c.trim() !== ''; });
          if (fCells.length >= 2) {
            var position = fCells[0].trim();
            if (position === 'Position' || position === '---') continue;
            var funcName = fCells[1].trim();
            var evidence = fCells.length >= 3 ? fCells[2].trim() : '';
            result.functions.push({ position: position, name: funcName, evidence: evidence });
          }
        }
      }

      // Extract Core Values section
      var valuesMatch = md.match(/(?:Your )?Core Values\\s*\\n\\n([\\s\\S]*?)(?=\\n###|\\n---)/i);
      if (valuesMatch) {
        result.values = valuesMatch[1].trim();
      }

      // Extract Cross-Framework Insights
      var insightsMatch = md.match(/Cross-Framework Insights\\s*\\n\\n([\\s\\S]*?)(?=\\n###|\\n---)/i);
      if (insightsMatch) {
        result.insights = insightsMatch[1].trim();
      }

      // Extract Strengths
      var strengthsMatch = md.match(/(?:Your )?Core Strengths\\s*\\n\\n([\\s\\S]*?)(?=\\n###|\\n---)/i);
      if (strengthsMatch) {
        var sLines = strengthsMatch[1].split(String.fromCharCode(10));
        for (var sl = 0; sl < sLines.length; sl++) {
          var sLine = sLines[sl].trim();
          if (sLine.startsWith('- ') || sLine.startsWith('* ')) {
            result.strengths.push(sLine.slice(2).replace(/\\*\\*/g, ''));
          } else if (sLine.match(/^\\d+\\./)) {
            result.strengths.push(sLine.replace(/^\\d+\\.\\s*/, '').replace(/\\*\\*/g, ''));
          }
        }
      }

      // Extract Growth Areas
      var growthMatch = md.match(/(?:Your )?Growth Areas\\s*\\n\\n([\\s\\S]*?)(?=\\n###|\\n---|\\/PERSONALITY|$)/i);
      if (growthMatch) {
        var gLines = growthMatch[1].split(String.fromCharCode(10));
        for (var gl = 0; gl < gLines.length; gl++) {
          var gLine = gLines[gl].trim();
          if (gLine.startsWith('- ') || gLine.startsWith('* ')) {
            result.growth.push(gLine.slice(2).replace(/\\*\\*/g, ''));
          } else if (gLine.match(/^\\d+\\./)) {
            result.growth.push(gLine.replace(/^\\d+\\.\\s*/, '').replace(/\\*\\*/g, ''));
          }
        }
      }

      return result;
    }

    // ============================================================
    // HELPERS
    // ============================================================

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function markdownToHtml(md) {
      if (!md) return '';
      var lines = md.split(String.fromCharCode(10));
      var html = '';
      var inParagraph = false;

      for (var i = 0; i < lines.length; i++) {
        var trimmed = lines[i].trim();
        if (!trimmed) {
          if (inParagraph) { html += '</p>'; inParagraph = false; }
          continue;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          if (inParagraph) { html += '</p>'; inParagraph = false; }
          html += '<p style="padding-left:16px; margin-bottom:8px;">' + inlineFormat(trimmed.slice(2)) + '</p>';
          continue;
        }
        if (!inParagraph) {
          html += '<p>';
          inParagraph = true;
        } else {
          html += ' ';
        }
        html += inlineFormat(trimmed);
      }
      if (inParagraph) html += '</p>';
      return html;
    }

    function inlineFormat(text) {
      text = text.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
      text = text.replace(/\\*(.+?)\\*/g, '<em>$1</em>');
      return text;
    }

    // ============================================================
    // INIT
    // ============================================================

    loadReport();
  </script>
</body>
</html>`;
}
