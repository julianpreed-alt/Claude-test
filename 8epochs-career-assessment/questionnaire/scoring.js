/**
 * Questionnaire scoring logic.
 * Runs client-side after questionnaire completion.
 * Computes Big Five and MBTI dimension scores with confidence levels.
 */

/**
 * Score all responses into dimension scores.
 * @param {Array} items - The item bank (from items.json)
 * @param {Object} responses - Map of item_id -> response_value (1-7)
 * @returns {Object} { big5, mbti, raw }
 */
export function scoreQuestionnaire(items, responses) {
  const big5 = scoreBigFive(items, responses);
  const mbti = scoreMBTI(items, responses);

  return { big5, mbti };
}

function scoreBigFive(items, responses) {
  const dimensions = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  const result = {};

  for (const dim of dimensions) {
    const dimItems = items.filter(i => i.framework === 'big5' && i.dimension === dim);
    const scores = [];

    for (const item of dimItems) {
      const raw = responses[item.id];
      if (raw == null) continue;
      // Reverse-scored items: flip the scale (1->7, 2->6, etc.)
      const scored = item.reverse ? (8 - raw) : raw;
      scores.push(scored);
    }

    if (scores.length === 0) {
      result[dim] = { score: 50, confidence: 'low', itemCount: 0 };
      continue;
    }

    // Average scored values, then scale 1-7 to 0-100%
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const percentage = Math.round(((avg - 1) / 6) * 100);

    // Confidence based on item variance
    const variance = computeVariance(scores);
    const confidence = varianceToConfidence(variance, scores.length);

    result[dim] = {
      score: clamp(percentage, 0, 100),
      confidence,
      itemCount: scores.length,
      variance: Math.round(variance * 100) / 100,
    };
  }

  return result;
}

function scoreMBTI(items, responses) {
  const dimensions = [
    { id: 'EI', poles: ['E', 'I'] },
    { id: 'SN', poles: ['S', 'N'] },
    { id: 'TF', poles: ['T', 'F'] },
    { id: 'JP', poles: ['J', 'P'] },
  ];

  const result = {};

  for (const dim of dimensions) {
    const dimItems = items.filter(i => i.framework === 'mbti' && i.dimension === dim.id);

    // For MBTI items, each item has a "pole" it measures toward.
    // High agreement = strong signal for that pole.
    // We compute a score for each pole, then derive the percentage split.
    const poleScores = {};
    for (const pole of dim.poles) {
      poleScores[pole] = [];
    }

    for (const item of dimItems) {
      const raw = responses[item.id];
      if (raw == null) continue;
      // The item measures toward item.pole. Score of 7 = strong agreement with that pole.
      // Convert to 0-1 scale for that pole
      const normalized = (raw - 1) / 6; // 0 to 1
      poleScores[item.pole].push(normalized);
    }

    // Average scores per pole
    const poleAvg = {};
    for (const pole of dim.poles) {
      const arr = poleScores[pole];
      poleAvg[pole] = arr.length > 0
        ? arr.reduce((a, b) => a + b, 0) / arr.length
        : 0.5; // neutral if no items
    }

    // Compute the split: each pole's percentage
    // For E/I: if E items average high and I items average low, person is more E
    // We combine by: poleA strength vs poleB strength
    const [poleA, poleB] = dim.poles;
    const aStrength = poleAvg[poleA];
    const bStrength = poleAvg[poleB];

    // Normalize so they sum to 100%
    const total = aStrength + bStrength;
    const aPercent = total > 0 ? Math.round((aStrength / total) * 100) : 50;
    const bPercent = 100 - aPercent;

    // Confidence based on how clearly separated the poles are
    const allScores = [];
    for (const item of dimItems) {
      const raw = responses[item.id];
      if (raw != null) allScores.push(raw);
    }
    const variance = computeVariance(allScores);
    // Also factor in how close to 50/50 the split is
    const separation = Math.abs(aPercent - bPercent);
    let confidence;
    if (separation < 10) {
      confidence = 'low'; // Very close split — genuinely ambiguous
    } else if (separation < 25) {
      confidence = 'moderate';
    } else {
      confidence = 'high';
    }

    // Determine the strength label
    let strength;
    if (separation < 10) strength = 'Slight';
    else if (separation < 25) strength = 'Moderate';
    else if (separation < 40) strength = 'Clear';
    else strength = 'Strong';

    result[dim.id] = {
      [poleA]: aPercent,
      [poleB]: bPercent,
      dominant: aPercent >= bPercent ? poleA : poleB,
      confidence,
      strength,
      itemCount: allScores.length,
    };
  }

  // Derive the MBTI type
  result.type = [
    result.EI.dominant,
    result.SN.dominant,
    result.TF.dominant,
    result.JP.dominant,
  ].join('');

  return result;
}

function computeVariance(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function varianceToConfidence(variance, itemCount) {
  // On a 1-7 scale, max possible variance is ~9 (all 1s and 7s).
  // Typical thresholds:
  // variance < 1.5 → high confidence (items agree)
  // variance 1.5-3.0 → moderate confidence
  // variance > 3.0 → low confidence (items contradict)
  if (itemCount < 2) return 'low';
  if (variance < 1.5) return 'high';
  if (variance < 3.0) return 'moderate';
  return 'low';
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Format scores into the text block that gets injected into the system prompt.
 * @param {Object} intake - { name, role, careerStage, motivation }
 * @param {Object} scores - Output of scoreQuestionnaire()
 * @param {Array} items - The item bank
 * @param {Object} responses - Raw item responses
 * @returns {string} The formatted questionnaire data block
 */
export function formatQuestionnaireData(intake, scores, items, responses) {
  const { big5, mbti } = scores;

  let text = `USER INTAKE CONTEXT:\n`;
  text += `Name: ${intake.name}\n`;
  text += `Role: ${intake.role}\n`;
  text += `Career stage: ${intake.careerStage}\n`;
  text += `What brought them here: "${intake.motivation}"\n\n`;

  text += `PRELIMINARY QUESTIONNAIRE SCORES:\n`;
  text += `Big Five:\n`;
  text += `  Openness:           ${big5.openness.score}% (${big5.openness.confidence} confidence${big5.openness.confidence === 'low' ? ' — contradictory responses' : big5.openness.confidence === 'moderate' ? ' — some inconsistency' : ' — consistent responses'})\n`;
  text += `  Conscientiousness:  ${big5.conscientiousness.score}% (${big5.conscientiousness.confidence} confidence${big5.conscientiousness.confidence === 'low' ? ' — contradictory responses' : big5.conscientiousness.confidence === 'moderate' ? ' — some inconsistency' : ' — consistent responses'})\n`;
  text += `  Extraversion:       ${big5.extraversion.score}% (${big5.extraversion.confidence} confidence${big5.extraversion.confidence === 'low' ? ' — contradictory responses' : big5.extraversion.confidence === 'moderate' ? ' — some inconsistency' : ' — consistent responses'})\n`;
  text += `  Agreeableness:      ${big5.agreeableness.score}% (${big5.agreeableness.confidence} confidence${big5.agreeableness.confidence === 'low' ? ' — contradictory responses' : big5.agreeableness.confidence === 'moderate' ? ' — some inconsistency' : ' — consistent responses'})\n`;
  text += `  Neuroticism:        ${big5.neuroticism.score}% (${big5.neuroticism.confidence} confidence${big5.neuroticism.confidence === 'low' ? ' — contradictory responses' : big5.neuroticism.confidence === 'moderate' ? ' — some inconsistency' : ' — consistent responses'})\n\n`;

  text += `MBTI Indicators:\n`;
  text += `  E/I:  ${mbti.EI.E}% E / ${mbti.EI.I}% I (${mbti.EI.confidence} confidence)\n`;
  text += `  S/N:  ${mbti.SN.S}% S / ${mbti.SN.N}% N (${mbti.SN.confidence} confidence)\n`;
  text += `  T/F:  ${mbti.TF.T}% T / ${mbti.TF.F}% F (${mbti.TF.confidence} confidence)\n`;
  text += `  J/P:  ${mbti.JP.J}% J / ${mbti.JP.P}% P (${mbti.JP.confidence} confidence)\n`;
  text += `  Preliminary type: ${mbti.type}\n\n`;

  text += `RAW ITEM RESPONSES:\n`;
  for (const item of items) {
    const val = responses[item.id];
    if (val == null) continue;
    const reverseTag = item.reverse ? ' [reverse-scored]' : '';
    text += `  ${item.id}: "${item.text}" → ${val} (${describeResponse(val)})${reverseTag}\n`;
  }

  text += `\nASSESSMENT INSTRUCTIONS:\n`;
  text += `These are self-reported preliminary scores from a 30-item questionnaire.\n`;
  text += `Use them as starting hypotheses — NOT as conclusions. Your primary role is to:\n`;
  text += `1. VALIDATE high-confidence scores through behavioural observation\n`;
  text += `2. RESOLVE low-confidence scores by exploring the specific areas of contradiction\n`;
  text += `3. PROBE interesting patterns (e.g., near-even splits)\n`;
  text += `4. ASSESS work values, which the questionnaire does not measure\n`;
  text += `5. IDENTIFY the cognitive function stack, which requires conversational depth\n\n`;
  text += `Weight your own behavioural observations MORE heavily than the questionnaire self-report in your final scores.`;

  return text;
}

function describeResponse(val) {
  const labels = ['', 'Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'];
  return labels[val] || 'Unknown';
}
