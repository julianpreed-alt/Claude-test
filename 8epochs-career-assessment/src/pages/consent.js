import { sharedStyles, navHTML, supabaseAuthScript } from './serve.js';

export function consentPage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Before We Begin — 8epochs</title>
  <style>${sharedStyles()}
    .consent-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 48px 24px 100px;
    }
    .consent-header { margin-bottom: 32px; }
    .consent-header h1 { margin-bottom: 8px; }
    .consent-header p {
      font-size: 1rem;
      line-height: 1.7;
      color: var(--text-muted);
    }
    .consent-section {
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 20px;
    }
    .consent-section h3 {
      font-size: 0.95rem;
      margin-bottom: 8px;
      text-transform: none;
      letter-spacing: normal;
      color: var(--text);
    }
    .consent-section p {
      font-size: 0.9rem;
      line-height: 1.65;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .consent-section p:last-of-type { margin-bottom: 12px; }
    .consent-check {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .consent-check input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      flex-shrink: 0;
      accent-color: var(--accent);
    }
    .consent-check label {
      font-size: 0.9rem;
      line-height: 1.5;
      color: var(--text);
      cursor: pointer;
    }
    .consent-check label a {
      color: var(--accent);
    }
    .consent-actions {
      margin-top: 32px;
    }
    .consent-actions .btn {
      width: 100%;
      padding: 14px 24px;
      font-size: 1rem;
    }
    .consent-actions .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .consent-note {
      font-size: 0.82rem;
      color: var(--text-light);
      text-align: center;
      margin-top: 16px;
      line-height: 1.5;
    }
    .error-msg {
      color: var(--error);
      font-size: 0.9rem;
      margin-top: 12px;
      text-align: center;
      display: none;
    }
  </style>
</head>
<body>
  ${navHTML({ authenticated: true })}
  <div class="consent-container">
    <div class="consent-header">
      <h1>Before we begin</h1>
      <p>This assessment involves a conversation with an AI that will explore your personality, values, and career interests. We need your explicit consent before proceeding.</p>
    </div>

    <div class="consent-section">
      <h3>Age Confirmation</h3>
      <p>This service is only available to individuals aged 18 or over.</p>
      <div class="consent-check">
        <input type="checkbox" id="consent-age">
        <label for="consent-age">I confirm that I am 18 years of age or older</label>
      </div>
    </div>

    <div class="consent-section">
      <h3>Terms and Conditions</h3>
      <p>This service uses AI to generate personality and career insights for your self-reflection. It is not professional career counselling, psychological assessment, or medical advice. AI outputs may contain errors or biases. Please review the full terms before proceeding.</p>
      <div class="consent-check">
        <input type="checkbox" id="consent-terms">
        <label for="consent-terms">I have read and agree to the <a href="/career-assessment/terms" target="_blank">Terms and Conditions</a></label>
      </div>
    </div>

    <div class="consent-section">
      <h3>Privacy and Data Processing</h3>
      <p>Your conversation content and questionnaire responses will be processed by an AI system (Claude, by Anthropic) hosted in the United States. Your data is stored in a secure database. We do not sell your data or use it for marketing.</p>
      <div class="consent-check">
        <input type="checkbox" id="consent-privacy">
        <label for="consent-privacy">I have read and agree to the <a href="/career-assessment/privacy" target="_blank">Privacy Policy</a></label>
      </div>
    </div>

    <div class="consent-section">
      <h3>Sensitive Data Processing</h3>
      <p>The assessment will generate insights about your personality traits, psychological preferences, values, and motivations. Under UK data protection law, this may constitute special category data. Your explicit consent is required to process this data.</p>
      <div class="consent-check">
        <input type="checkbox" id="consent-data">
        <label for="consent-data">I give my explicit consent for 8epochs to process my personality assessment data, including sending my conversation content to Anthropic's AI for analysis, as described in the Privacy Policy</label>
      </div>
    </div>

    <div class="consent-actions">
      <button class="btn" id="proceed-btn" disabled>Continue to Assessment</button>
      <div class="error-msg" id="error-msg"></div>
      <div class="consent-note">
        You can withdraw your consent and delete your data at any time from your account settings.
      </div>
    </div>
  </div>

  ${supabaseAuthScript(env)}
  <script>
    var ageBox = document.getElementById('consent-age');
    var termsBox = document.getElementById('consent-terms');
    var privacyBox = document.getElementById('consent-privacy');
    var dataBox = document.getElementById('consent-data');
    var proceedBtn = document.getElementById('proceed-btn');
    var errorMsg = document.getElementById('error-msg');

    function checkAll() {
      proceedBtn.disabled = !(ageBox.checked && termsBox.checked && privacyBox.checked && dataBox.checked);
    }

    ageBox.addEventListener('change', checkAll);
    termsBox.addEventListener('change', checkAll);
    privacyBox.addEventListener('change', checkAll);
    dataBox.addEventListener('change', checkAll);

    proceedBtn.addEventListener('click', async function() {
      if (!ageBox.checked || !termsBox.checked || !privacyBox.checked || !dataBox.checked) return;

      proceedBtn.disabled = true;
      proceedBtn.innerHTML = '<span class="spinner"></span>';
      errorMsg.style.display = 'none';

      var res = await apiFetch('/api/consent', {
        method: 'POST',
        body: JSON.stringify({
          terms_version: '1.0',
          privacy_version: '1.0',
          consents: ['age_confirmed', 'terms', 'privacy', 'data_processing', 'special_category'],
        }),
      });

      if (!res) return;
      var data = await res.json();

      if (data.error) {
        errorMsg.textContent = data.error;
        errorMsg.style.display = 'block';
        proceedBtn.disabled = false;
        proceedBtn.textContent = 'Continue to Assessment';
        return;
      }

      // Consent recorded — redirect to dashboard to start assessment
      window.location.href = '/career-assessment/dashboard';
    });

    // Check if user already has valid consent
    async function checkConsent() {
      if (window.waitForAuth) await window.waitForAuth();
      var res = await apiFetch('/api/consent/status');
      if (!res) return;
      var data = await res.json();
      if (data.has_valid_consent) {
        window.location.href = '/career-assessment/dashboard';
      }
    }
    checkConsent();
  </script>
</body>
</html>`;
}
