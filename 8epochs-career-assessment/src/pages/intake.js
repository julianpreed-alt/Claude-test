import { sharedStyles, navHTML, supabaseAuthScript } from './serve.js';

export function intakePage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Getting Started — 8epochs</title>
  <style>${sharedStyles()}

    .intake-container {
      max-width: 560px;
      margin: 0 auto;
      padding: 60px 24px 80px;
    }

    .intake-header {
      margin-bottom: 40px;
    }

    .intake-header h1 {
      margin-bottom: 8px;
    }

    .intake-header p {
      font-size: 1.05rem;
      line-height: 1.7;
    }

    .field {
      margin-bottom: 28px;
    }

    .field label {
      display: block;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 6px;
    }

    .field .hint {
      font-size: 0.85rem;
      color: var(--text-light);
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .field select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B6B6B' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      padding-right: 36px;
    }

    textarea {
      min-height: 100px;
      resize: vertical;
      line-height: 1.6;
    }

    .submit-area {
      margin-top: 36px;
    }

    .submit-area .btn {
      width: 100%;
      padding: 14px 24px;
      font-size: 1rem;
    }

    .error-msg {
      color: var(--error);
      font-size: 0.9rem;
      margin-top: 8px;
      display: none;
    }
  </style>
</head>
<body>
  ${navHTML({ authenticated: true })}

  <div class="intake-container">
    <div class="intake-header">
      <h1>Before we begin</h1>
      <p>A few quick details to help make the most of your time. This takes about a minute.</p>
    </div>

    <form id="intake-form">
      <div class="field">
        <label for="name">What should I call you?</label>
        <input type="text" id="name" name="name" placeholder="Your first name" required autocomplete="given-name">
      </div>

      <div class="field">
        <label for="role">What do you do?</label>
        <div class="hint">Your current role and industry, in a few words.</div>
        <input type="text" id="role" name="role" placeholder="e.g. Product manager at a fintech startup">
      </div>

      <div class="field">
        <label for="career-stage">Where are you in your career?</label>
        <select id="career-stage" name="careerStage">
          <option value="Early career">Early career (0–5 years)</option>
          <option value="Mid-career" selected>Mid-career (5–15 years)</option>
          <option value="Senior">Senior (15+ years)</option>
          <option value="Career changer">Career changer</option>
          <option value="Exploring">Exploring / between things</option>
        </select>
      </div>

      <div class="field">
        <label for="motivation">What brought you here?</label>
        <div class="hint">Just a sentence or two — what prompted you to try this?</div>
        <textarea id="motivation" name="motivation" placeholder="e.g. Feeling stuck in my current role and want clarity on what I should be doing"></textarea>
      </div>

      <div class="submit-area">
        <button type="submit" class="btn" id="submit-btn">Continue to questionnaire</button>
        <div class="error-msg" id="error-msg"></div>
      </div>
    </form>
  </div>

  ${supabaseAuthScript(env)}
  <script>
    const assessmentId = new URLSearchParams(window.location.search).get('id');
    if (!assessmentId) {
      window.location.href = '/career-assessment/dashboard';
    }

    const form = document.getElementById('intake-form');
    const submitBtn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-msg');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span>';

      const data = {
        name: document.getElementById('name').value.trim(),
        role: document.getElementById('role').value.trim(),
        careerStage: document.getElementById('career-stage').value,
        motivation: document.getElementById('motivation').value.trim(),
      };

      if (!data.name) {
        errorMsg.textContent = 'Please enter your name.';
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continue to questionnaire';
        return;
      }

      const res = await apiFetch('/api/assessment/' + assessmentId + '/intake', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!res) return;
      const result = await res.json();

      if (result.error) {
        // If intake already done, go to questionnaire
        if (result.status === 'questionnaire' || result.status === 'phase1_active') {
          window.location.href = result.status === 'phase1_active'
            ? '/career-assessment/chat?id=' + assessmentId
            : '/career-assessment/questionnaire?id=' + assessmentId;
          return;
        }
        errorMsg.textContent = result.error;
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continue to questionnaire';
        return;
      }

      // Success — go to questionnaire
      window.location.href = '/career-assessment/questionnaire?id=' + assessmentId;
    });

    // Check assessment status on load
    async function checkStatus() {
      if (window.waitForAuth) await window.waitForAuth();
      const res = await apiFetch('/api/assessment/' + assessmentId);
      if (!res) return;
      const data = await res.json();
      if (data.assessment) {
        const s = data.assessment.status;
        if (s === 'questionnaire') {
          window.location.href = '/career-assessment/questionnaire?id=' + assessmentId;
        } else if (s === 'phase1_active') {
          window.location.href = '/career-assessment/chat?id=' + assessmentId;
        } else if (s === 'phase1_complete') {
          window.location.href = '/career-assessment/dashboard';
        }
        // If 'intake', stay on this page
        if (data.assessment.intake_data?.name) {
          document.getElementById('name').value = data.assessment.intake_data.name;
          document.getElementById('role').value = data.assessment.intake_data.role || '';
          if (data.assessment.intake_data.careerStage) {
            document.getElementById('career-stage').value = data.assessment.intake_data.careerStage;
          }
          document.getElementById('motivation').value = data.assessment.intake_data.motivation || '';
        }
      }
    }
    checkStatus();
  </script>
</body>
</html>`;
}
