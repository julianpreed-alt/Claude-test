import { sharedStyles, navHTML, supabaseAuthScript } from './serve.js';

export function questionnairePage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Personality Questionnaire — 8epochs</title>
  <style>${sharedStyles()}

    .q-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 48px 24px 80px;
      min-height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
    }

    .progress-bar-wrap {
      width: 100%;
      height: 3px;
      background: var(--border-light);
      border-radius: 2px;
      margin-bottom: 48px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 2px;
      transition: width 0.4s ease;
    }

    .progress-text {
      font-size: 0.8rem;
      color: var(--text-light);
      margin-bottom: 12px;
    }

    .question-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-bottom: 40px;
    }

    .question-text {
      font-family: var(--font-serif);
      font-size: 1.35rem;
      line-height: 1.6;
      color: var(--text);
      font-weight: 400;
      margin-bottom: 48px;
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .question-text.exiting {
      opacity: 0;
      transform: translateY(-12px);
    }

    .question-text.entering {
      opacity: 0;
      transform: translateY(12px);
    }

    .scale-wrap {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .scale-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .scale-labels span {
      font-size: 0.78rem;
      color: var(--text-light);
    }

    .scale-buttons {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .scale-btn {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px solid var(--border);
      background: var(--bg-card);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0;
      position: relative;
    }

    .scale-btn:hover {
      border-color: var(--accent);
      background: var(--accent-light);
      transform: scale(1.08);
    }

    .scale-btn.selected {
      border-color: var(--accent);
      background: var(--accent);
    }

    .scale-btn.selected::after {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
    }

    /* Size the buttons to reflect the scale — middle ones bigger */
    .scale-btn:nth-child(1), .scale-btn:nth-child(7) { width: 36px; height: 36px; }
    .scale-btn:nth-child(2), .scale-btn:nth-child(6) { width: 42px; height: 42px; }
    .scale-btn:nth-child(3), .scale-btn:nth-child(5) { width: 48px; height: 48px; }
    .scale-btn:nth-child(4) { width: 52px; height: 52px; }

    .scale-btn:nth-child(1):hover, .scale-btn:nth-child(7):hover { transform: scale(1.12); }
    .scale-btn:nth-child(4):hover { transform: scale(1.06); }

    .nav-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 48px;
    }

    .back-btn {
      font-size: 0.9rem;
      color: var(--text-muted);
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px 0;
      transition: color 0.15s;
    }

    .back-btn:hover { color: var(--text); }
    .back-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .loading-state {
      text-align: center;
      padding: 120px 24px;
      color: var(--text-muted);
    }

    @media (max-width: 480px) {
      .scale-buttons { gap: 6px; }
      .scale-btn:nth-child(1), .scale-btn:nth-child(7) { width: 32px; height: 32px; }
      .scale-btn:nth-child(2), .scale-btn:nth-child(6) { width: 36px; height: 36px; }
      .scale-btn:nth-child(3), .scale-btn:nth-child(5) { width: 40px; height: 40px; }
      .scale-btn:nth-child(4) { width: 44px; height: 44px; }
      .question-text { font-size: 1.15rem; }
    }
  </style>
</head>
<body>
  ${navHTML({ authenticated: true })}

  <div class="q-container" id="main">
    <div class="loading-state">
      <div class="spinner" style="width:28px; height:28px; border-color: var(--border); border-top-color: var(--accent); margin: 0 auto 12px;"></div>
      <p>Loading questionnaire...</p>
    </div>
  </div>

  ${supabaseAuthScript(env)}
  <script>
    const assessmentId = new URLSearchParams(window.location.search).get('id');
    if (!assessmentId) {
      window.location.href = '/career-assessment/dashboard';
    }

    // Item bank — embedded at serve time from questionnaire/items.json
    const ITEMS = ${getItemsJSON()};

    const SCALE_LABELS = ITEMS.scale.labels;
    let items = [...ITEMS.items];
    let responses = {};
    let currentIndex = 0;
    let shuffleOrder = [];

    // Shuffle items (deterministic per assessment to allow back-navigation)
    function shuffleWithSeed(arr, seed) {
      const shuffled = [...arr];
      let s = hashString(seed);
      for (let i = shuffled.length - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const j = s % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    function hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    }

    function init() {
      shuffleOrder = shuffleWithSeed(
        items.map((_, i) => i),
        assessmentId
      );

      renderQuestion();
    }

    function getItem(displayIndex) {
      return items[shuffleOrder[displayIndex]];
    }

    function renderQuestion() {
      const totalItems = items.length;
      const item = getItem(currentIndex);
      const existing = responses[item.id];
      const pct = Math.round((currentIndex / totalItems) * 100);

      document.getElementById('main').innerHTML = \`
        <div class="progress-text">\${currentIndex + 1} of \${totalItems}</div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: \${pct}%"></div>
        </div>

        <div class="question-area">
          <div class="question-text" id="question-text">
            "\${item.text}"
          </div>

          <div class="scale-wrap">
            <div class="scale-labels">
              <span>\${SCALE_LABELS[0]}</span>
              <span>\${SCALE_LABELS[6]}</span>
            </div>
            <div class="scale-buttons" id="scale-buttons">
              \${[1,2,3,4,5,6,7].map(v => \`
                <button class="scale-btn \${existing === v ? 'selected' : ''}"
                        data-value="\${v}"
                        aria-label="\${SCALE_LABELS[v-1]}"
                        title="\${SCALE_LABELS[v-1]}">
                </button>
              \`).join('')}
            </div>
          </div>
        </div>

        <div class="nav-buttons">
          <button class="back-btn" id="back-btn" \${currentIndex === 0 ? 'disabled' : ''}>
            ← Back
          </button>
          <span style="font-size: 0.8rem; color: var(--text-light);">
            Use keyboard: 1–7 to answer, ← to go back
          </span>
        </div>
      \`;

      // Wire up event listeners
      document.querySelectorAll('.scale-btn').forEach(btn => {
        btn.addEventListener('click', () => selectValue(parseInt(btn.dataset.value)));
      });

      document.getElementById('back-btn').addEventListener('click', goBack);
    }

    function selectValue(value) {
      const item = getItem(currentIndex);
      responses[item.id] = value;

      // Brief visual feedback
      document.querySelectorAll('.scale-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.value) === value);
      });

      // Auto-advance after a short delay
      setTimeout(() => {
        if (currentIndex < items.length - 1) {
          const qText = document.getElementById('question-text');
          if (qText) qText.classList.add('exiting');

          setTimeout(() => {
            currentIndex++;
            renderQuestion();
          }, 200);
        } else {
          // Last item — submit
          submitQuestionnaire();
        }
      }, 250);
    }

    function goBack() {
      if (currentIndex > 0) {
        const qText = document.getElementById('question-text');
        if (qText) qText.classList.add('entering');

        setTimeout(() => {
          currentIndex--;
          renderQuestion();
        }, 150);
      }
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key >= '1' && e.key <= '7') {
        selectValue(parseInt(e.key));
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        goBack();
      }
    });

    async function submitQuestionnaire() {
      document.getElementById('main').innerHTML = \`
        <div class="loading-state">
          <div class="spinner" style="width:28px; height:28px; border-color: var(--border); border-top-color: var(--accent); margin: 0 auto 12px;"></div>
          <p>Processing your responses...</p>
        </div>
      \`;

      // Score the questionnaire
      const scores = scoreQuestionnaire(items, responses);

      // Load intake data for formatting
      const assessRes = await apiFetch('/api/assessment/' + assessmentId);
      if (!assessRes) return;
      const assessData = await assessRes.json();
      const intake = assessData.assessment.intake_data;

      // Format the data for the system prompt
      const formattedData = formatQuestionnaireData(intake, scores, items, responses);

      // Save to backend
      const res = await apiFetch('/api/assessment/' + assessmentId + '/questionnaire', {
        method: 'PUT',
        body: JSON.stringify({
          responses,
          scores,
          formattedData,
        }),
      });

      if (!res) return;
      const result = await res.json();

      if (result.error) {
        document.getElementById('main').innerHTML = \`
          <div class="loading-state">
            <div class="alert alert-error">\${result.error}</div>
            <button class="btn" onclick="window.location.reload()">Try Again</button>
          </div>
        \`;
        return;
      }

      // Go to chat
      window.location.href = '/career-assessment/chat?id=' + assessmentId;
    }

    // ============================================================
    // SCORING FUNCTIONS (inline for the browser)
    // ============================================================

    function scoreQuestionnaire(items, responses) {
      return {
        big5: scoreBigFive(items, responses),
        mbti: scoreMBTI(items, responses),
      };
    }

    function scoreBigFive(items, responses) {
      const dims = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
      const result = {};
      for (const dim of dims) {
        const dimItems = items.filter(i => i.framework === 'big5' && i.dimension === dim);
        const scores = [];
        for (const item of dimItems) {
          const raw = responses[item.id];
          if (raw == null) continue;
          scores.push(item.reverse ? (8 - raw) : raw);
        }
        if (scores.length === 0) { result[dim] = { score: 50, confidence: 'low', itemCount: 0 }; continue; }
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const pct = Math.round(((avg - 1) / 6) * 100);
        const variance = computeVariance(scores);
        result[dim] = {
          score: Math.max(0, Math.min(100, pct)),
          confidence: varianceToConfidence(variance, scores.length),
          itemCount: scores.length,
          variance: Math.round(variance * 100) / 100,
        };
      }
      return result;
    }

    function scoreMBTI(items, responses) {
      const dims = [
        { id: 'EI', poles: ['E', 'I'] },
        { id: 'SN', poles: ['S', 'N'] },
        { id: 'TF', poles: ['T', 'F'] },
        { id: 'JP', poles: ['J', 'P'] },
      ];
      const result = {};
      for (const dim of dims) {
        const dimItems = items.filter(i => i.framework === 'mbti' && i.dimension === dim.id);
        const poleScores = {};
        dim.poles.forEach(p => poleScores[p] = []);
        for (const item of dimItems) {
          const raw = responses[item.id];
          if (raw == null) continue;
          poleScores[item.pole].push((raw - 1) / 6);
        }
        const poleAvg = {};
        dim.poles.forEach(p => {
          const arr = poleScores[p];
          poleAvg[p] = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0.5;
        });
        const [pA, pB] = dim.poles;
        const total = poleAvg[pA] + poleAvg[pB];
        const aPct = total > 0 ? Math.round((poleAvg[pA] / total) * 100) : 50;
        const bPct = 100 - aPct;
        const sep = Math.abs(aPct - bPct);
        let confidence = sep < 10 ? 'low' : sep < 25 ? 'moderate' : 'high';
        let strength = sep < 10 ? 'Slight' : sep < 25 ? 'Moderate' : sep < 40 ? 'Clear' : 'Strong';
        result[dim.id] = { [pA]: aPct, [pB]: bPct, dominant: aPct >= bPct ? pA : pB, confidence, strength, itemCount: dimItems.length };
      }
      result.type = [result.EI.dominant, result.SN.dominant, result.TF.dominant, result.JP.dominant].join('');
      return result;
    }

    function computeVariance(values) {
      if (values.length < 2) return 0;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return values.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / values.length;
    }

    function varianceToConfidence(variance, count) {
      if (count < 2) return 'low';
      if (variance < 1.5) return 'high';
      if (variance < 3.0) return 'moderate';
      return 'low';
    }

    function formatQuestionnaireData(intake, scores, items, responses) {
      const { big5, mbti } = scores;
      const confLabel = (c) => c === 'low' ? ' — contradictory responses' : c === 'moderate' ? ' — some inconsistency' : ' — consistent responses';
      let t = 'USER INTAKE CONTEXT:\\n';
      t += 'Name: ' + intake.name + '\\n';
      t += 'Role: ' + (intake.role || 'Not specified') + '\\n';
      t += 'Career stage: ' + (intake.careerStage || 'Not specified') + '\\n';
      t += 'What brought them here: "' + (intake.motivation || 'Not specified') + '"\\n\\n';
      t += 'PRELIMINARY QUESTIONNAIRE SCORES:\\n';
      t += 'Big Five:\\n';
      for (const dim of ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']) {
        const d = big5[dim];
        const label = dim.charAt(0).toUpperCase() + dim.slice(1);
        t += '  ' + label + ': '.padEnd(20 - label.length) + d.score + '% (' + d.confidence + ' confidence' + confLabel(d.confidence) + ')\\n';
      }
      t += '\\nMBTI Indicators:\\n';
      t += '  E/I:  ' + mbti.EI.E + '% E / ' + mbti.EI.I + '% I (' + mbti.EI.confidence + ' confidence)\\n';
      t += '  S/N:  ' + mbti.SN.S + '% S / ' + mbti.SN.N + '% N (' + mbti.SN.confidence + ' confidence)\\n';
      t += '  T/F:  ' + mbti.TF.T + '% T / ' + mbti.TF.F + '% F (' + mbti.TF.confidence + ' confidence)\\n';
      t += '  J/P:  ' + mbti.JP.J + '% J / ' + mbti.JP.P + '% P (' + mbti.JP.confidence + ' confidence)\\n';
      t += '  Preliminary type: ' + mbti.type + '\\n\\n';
      t += 'RAW ITEM RESPONSES:\\n';
      const respLabels = ['', 'Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'];
      for (const item of items) {
        const v = responses[item.id];
        if (v == null) continue;
        t += '  ' + item.id + ': "' + item.text + '" → ' + v + ' (' + respLabels[v] + ')' + (item.reverse ? ' [reverse-scored]' : '') + '\\n';
      }
      t += '\\nASSESSMENT INSTRUCTIONS:\\n';
      t += 'These are self-reported preliminary scores from a 30-item questionnaire.\\n';
      t += 'Use them as starting hypotheses — NOT as conclusions. Your primary role is to:\\n';
      t += '1. VALIDATE high-confidence scores through behavioural observation\\n';
      t += '2. RESOLVE low-confidence scores by exploring the specific areas of contradiction\\n';
      t += '3. PROBE interesting patterns (e.g., near-even splits)\\n';
      t += '4. ASSESS work values, which the questionnaire does not measure\\n';
      t += '5. IDENTIFY the cognitive function stack, which requires conversational depth\\n\\n';
      t += 'Weight your own behavioural observations MORE heavily than the questionnaire self-report in your final scores.';
      return t;
    }

    // ============================================================
    // INIT
    // ============================================================

    // Check assessment status first
    async function checkAndInit() {
      if (window.waitForAuth) await window.waitForAuth();
      const res = await apiFetch('/api/assessment/' + assessmentId);
      if (!res) return;
      const data = await res.json();
      if (data.assessment) {
        const s = data.assessment.status;
        if (s === 'intake') {
          window.location.href = '/career-assessment/intake?id=' + assessmentId;
          return;
        }
        if (s === 'phase1_active') {
          window.location.href = '/career-assessment/chat?id=' + assessmentId;
          return;
        }
        if (s === 'phase1_complete') {
          window.location.href = '/career-assessment/dashboard';
          return;
        }
        // Restore any previously saved responses
        if (data.assessment.questionnaire_responses) {
          responses = data.assessment.questionnaire_responses;
        }
      }
      init();
    }

    checkAndInit();
  </script>
</body>
</html>`;
}

function getItemsJSON() {
  // Inline the items.json content for the browser
  return JSON.stringify({
    "scale": {
      "labels": [
        "Strongly Disagree", "Disagree", "Slightly Disagree",
        "Neutral",
        "Slightly Agree", "Agree", "Strongly Agree"
      ]
    },
    "items": [
      { "id": "O1", "text": "I enjoy thinking about abstract ideas and theories, even when they don\\u2019t have an obvious practical use.", "dimension": "openness", "framework": "big5", "reverse": false },
      { "id": "O2", "text": "I tend to notice beauty in things that other people might overlook \\u2014 a well-designed object, an interesting turn of phrase, a striking visual.", "dimension": "openness", "framework": "big5", "reverse": false },
      { "id": "O3", "text": "I generally prefer to stick with approaches that have worked before rather than trying unfamiliar methods.", "dimension": "openness", "framework": "big5", "reverse": true },
      { "id": "O4", "text": "I often find myself lost in thought, exploring ideas just for the pleasure of it.", "dimension": "openness", "framework": "big5", "reverse": false },
      { "id": "C1", "text": "I like to have a clear plan before I start a task \\u2014 jumping in without one makes me uncomfortable.", "dimension": "conscientiousness", "framework": "big5", "reverse": false },
      { "id": "C2", "text": "I sometimes let things slide when I should be more disciplined about following through.", "dimension": "conscientiousness", "framework": "big5", "reverse": true },
      { "id": "C3", "text": "I pay close attention to details and find it hard to let small errors go uncorrected.", "dimension": "conscientiousness", "framework": "big5", "reverse": false },
      { "id": "C4", "text": "I tend to do things in a methodical, step-by-step way rather than improvising as I go.", "dimension": "conscientiousness", "framework": "big5", "reverse": false },
      { "id": "E1", "text": "After an intense day of meetings and social interaction, I need quiet time alone to recharge.", "dimension": "extraversion", "framework": "big5", "reverse": true },
      { "id": "E2", "text": "In group settings, I naturally take on an active role \\u2014 I find it easy to speak up and engage.", "dimension": "extraversion", "framework": "big5", "reverse": false },
      { "id": "E3", "text": "I find being around people energising rather than draining, even after a long day.", "dimension": "extraversion", "framework": "big5", "reverse": false },
      { "id": "E4", "text": "I prefer one-on-one conversations to large group discussions.", "dimension": "extraversion", "framework": "big5", "reverse": true },
      { "id": "A1", "text": "I tend to trust that people generally have good intentions until shown otherwise.", "dimension": "agreeableness", "framework": "big5", "reverse": false },
      { "id": "A2", "text": "In a disagreement, I\\u2019d rather be straightforwardly honest than carefully diplomatic.", "dimension": "agreeableness", "framework": "big5", "reverse": true },
      { "id": "A3", "text": "It genuinely upsets me when I see someone being treated unfairly, even if it doesn\\u2019t affect me personally.", "dimension": "agreeableness", "framework": "big5", "reverse": false },
      { "id": "A4", "text": "I find it difficult to say no when someone asks for my help, even when I\\u2019m overloaded.", "dimension": "agreeableness", "framework": "big5", "reverse": false },
      { "id": "N1", "text": "I tend to worry about things that might go wrong, even when everything seems fine.", "dimension": "neuroticism", "framework": "big5", "reverse": false },
      { "id": "N2", "text": "I recover quickly from setbacks \\u2014 when something goes wrong, I don\\u2019t dwell on it for long.", "dimension": "neuroticism", "framework": "big5", "reverse": true },
      { "id": "N3", "text": "Criticism stings more than I\\u2019d like to admit, and I sometimes replay critical feedback in my mind.", "dimension": "neuroticism", "framework": "big5", "reverse": false },
      { "id": "N4", "text": "I often feel calm and steady under pressure, even when things around me are chaotic.", "dimension": "neuroticism", "framework": "big5", "reverse": true },
      { "id": "EI1", "text": "I think best when I can talk things through with someone else rather than working them out on my own.", "dimension": "EI", "framework": "mbti", "reverse": false, "pole": "E" },
      { "id": "EI2", "text": "I tend to reflect carefully before sharing my thoughts, rather than thinking out loud.", "dimension": "EI", "framework": "mbti", "reverse": false, "pole": "I" },
      { "id": "SN1", "text": "I often notice patterns and connections between things that don\\u2019t seem obviously related.", "dimension": "SN", "framework": "mbti", "reverse": false, "pole": "N" },
      { "id": "SN2", "text": "I\\u2019d rather work with concrete facts and real-world data than hypothetical possibilities.", "dimension": "SN", "framework": "mbti", "reverse": false, "pole": "S" },
      { "id": "SN3", "text": "When someone explains something to me, I\\u2019m more interested in the big picture and implications than the specific details.", "dimension": "SN", "framework": "mbti", "reverse": false, "pole": "N" },
      { "id": "TF1", "text": "When making a difficult decision, I tend to weigh the logical pros and cons more than how it will affect people\\u2019s feelings.", "dimension": "TF", "framework": "mbti", "reverse": false, "pole": "T" },
      { "id": "TF2", "text": "When a friend is upset, my instinct is to listen and empathise rather than to offer solutions.", "dimension": "TF", "framework": "mbti", "reverse": false, "pole": "F" },
      { "id": "TF3", "text": "I find it more important for a decision to be fair and consistent than for everyone involved to be happy with the outcome.", "dimension": "TF", "framework": "mbti", "reverse": false, "pole": "T" },
      { "id": "JP1", "text": "I feel more comfortable when things are decided and settled rather than left open-ended.", "dimension": "JP", "framework": "mbti", "reverse": false, "pole": "J" },
      { "id": "JP2", "text": "I prefer to keep my options open as long as possible rather than committing to a plan early.", "dimension": "JP", "framework": "mbti", "reverse": false, "pole": "P" }
    ]
  });
}
