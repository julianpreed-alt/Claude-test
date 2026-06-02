import { sharedStyles, navHTML, footerHTML, supabaseAuthScript } from './serve.js';

export function cvUploadPage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Career experience — 8epochs</title>
  <meta name="robots" content="noindex">
  <style>${sharedStyles()}

    .cv-wrap {
      max-width: 640px;
      margin: 0 auto;
      padding: 64px 32px 96px;
    }

    .cv-header {
      margin-bottom: 48px;
    }

    .cv-header .eyebrow {
      color: var(--accent);
      margin-bottom: 24px;
    }

    .cv-header h1 {
      font-size: clamp(2rem, 3.5vw, 2.5rem);
      font-weight: 400;
      letter-spacing: -0.025em;
      margin-bottom: 20px;
      line-height: 1.15;
    }

    .cv-header .lede {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 300;
      line-height: 1.55;
      color: var(--text-secondary);
    }

    .cv-section {
      margin-bottom: 40px;
    }

    .cv-section h2 {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
      text-transform: none;
    }

    .cv-section p {
      font-size: 0.9375rem;
      line-height: 1.65;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }

    .cv-section ul {
      padding-left: 24px;
      margin-bottom: 16px;
    }

    .cv-section li {
      font-size: 0.9375rem;
      line-height: 1.65;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    /* Consent box */
    .consent-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px 28px;
      margin-bottom: 24px;
    }

    .consent-check {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .consent-check input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-top: 3px;
      flex-shrink: 0;
      accent-color: var(--accent);
      cursor: pointer;
    }

    .consent-check label {
      font-size: 0.9375rem;
      line-height: 1.55;
      color: var(--text);
      cursor: pointer;
    }

    /* PII notice */
    .pii-notice {
      background: var(--accent-soft);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px 22px;
      margin-bottom: 28px;
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    .pii-notice strong {
      color: var(--text);
    }

    /* Upload area */
    .upload-area {
      border: 2px dashed var(--border-dark);
      border-radius: var(--radius-lg);
      padding: 48px 32px;
      text-align: center;
      background: var(--bg-tint);
      transition: border-color 0.15s ease, background 0.15s ease;
      cursor: pointer;
    }

    .upload-area:hover, .upload-area.dragover {
      border-color: var(--accent);
      background: var(--accent-soft);
    }

    .upload-area.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .upload-icon {
      font-size: 2rem;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .upload-prompt {
      font-family: var(--font-display);
      font-size: 1rem;
      color: var(--text);
      margin-bottom: 6px;
    }

    .upload-hint {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    input[type="file"] {
      display: none;
    }

    /* Selected file display */
    .selected-file {
      display: none;
      padding: 16px 20px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-top: 16px;
      align-items: center;
      gap: 12px;
    }

    .selected-file.show { display: flex; }

    .file-icon {
      color: var(--accent);
      font-size: 1.25rem;
    }

    .file-name {
      flex: 1;
      font-size: 0.9rem;
      color: var(--text);
      word-break: break-all;
    }

    .file-remove {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px 8px;
    }

    .file-remove:hover { color: var(--error); }

    /* Action buttons */
    .cv-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 32px;
    }

    .cv-actions .btn {
      width: 100%;
      padding: 16px 24px;
      font-size: 1rem;
      justify-content: center;
    }

    .cv-actions .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-skip {
      background: none;
      color: var(--text-secondary);
      border: 1px solid var(--border-dark);
    }

    .btn-skip:hover {
      background: var(--bg-tint);
      color: var(--text);
      border-color: var(--border-dark);
    }

    .upload-status {
      margin-top: 16px;
      padding: 14px 18px;
      border-radius: var(--radius);
      font-size: 0.9rem;
      display: none;
    }

    .upload-status.show { display: block; }

    .upload-status.success {
      background: var(--success-bg);
      color: var(--success);
    }

    .upload-status.error {
      background: var(--error-bg);
      color: var(--error);
    }

    .upload-progress {
      margin-top: 12px;
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
      display: none;
    }

    .upload-progress.show { display: block; }

    @media (max-width: 640px) {
      .cv-wrap { padding: 48px 24px 80px; }
      .upload-area { padding: 36px 20px; }
    }
  </style>
</head>
<body>
  ${navHTML({ authenticated: true })}

  <main class="cv-wrap">
    <header class="cv-header">
      <span class="eyebrow">Career Interest Assessment — Optional Step</span>
      <h1>Share your career experience.</h1>
      <p class="lede">Uploading your CV is optional, but it materially improves the quality of the final report. The difference is between generic role suggestions and recommendations grounded in your actual experience and the realistic next moves available from where you stand.</p>
    </header>

    <section class="cv-section">
      <h2>Before you upload</h2>
      <p>For the best results — and to keep this service running efficiently for everyone — please make sure your CV meets the following requirements:</p>
      <ul>
        <li><strong>English-language CV only</strong> — the assessment is currently optimised for English</li>
        <li><strong>Roughly 4–5 pages or fewer</strong> — around 2,500 words. If your CV is longer, please trim it to your most relevant recent experience</li>
        <li><strong>PDF format, maximum 5 MB</strong></li>
      </ul>
    </section>

    <section class="cv-section">
      <h2>Anonymise your CV before uploading</h2>
      <p>Before you upload, please remove the following from your CV manually:</p>
      <ul>
        <li>Your name (the AI will address you as "you")</li>
        <li>Your photo, if there is one</li>
        <li>Contact details (email, phone, full address)</li>
        <li>Date of birth (but keep dates of roles and education — those matter for career stage)</li>
      </ul>
      <p>Removing identifying information actually improves the assessment by reducing the chance of unconscious bias in the recommendations.</p>
    </section>

    <section class="cv-section">
      <h2>We also strip personal data automatically</h2>
      <div class="pii-notice">
        <p>As a safety net, our system will automatically detect and remove the following from your CV before sending it to the AI:</p>
        <p><strong>Email addresses, phone numbers, postal addresses, postcodes, and URLs</strong> commonly used in CVs (LinkedIn profiles, personal websites).</p>
        <p>Only the substance of your career — roles, responsibilities, tenure, industries, education, qualifications — is used.</p>
      </div>
    </section>

    <section class="cv-section">
      <h2>What we do with your CV</h2>
      <p>The cleaned text from your CV is stored in our database and persists across sessions, so if you pause and return, you don't need to re-upload. It is sent to Anthropic's AI for processing alongside your conversation, as described in the privacy policy.</p>
      <p>When you delete your assessment data or your account, the CV text is permanently deleted along with the rest of your data. We do not retain the original PDF file — only the cleaned text.</p>
    </section>

    <div class="consent-box">
      <div class="consent-check">
        <input type="checkbox" id="cv-consent">
        <label for="cv-consent">I have manually removed identifying information from my CV. I consent to 8epochs processing the cleaned text of my CV as described above and in the <a href="/career-assessment/privacy" target="_blank">Privacy Policy</a>.</label>
      </div>
    </div>

    <label for="cv-file" class="upload-area" id="upload-area">
      <div class="upload-icon">↑</div>
      <div class="upload-prompt">Click to choose a PDF, or drag and drop one here</div>
      <div class="upload-hint">PDF only · Maximum 5 MB · English only · Roughly 4–5 pages (≤ 2,500 words)</div>
    </label>
    <input type="file" id="cv-file" accept="application/pdf,.pdf">

    <div class="selected-file" id="selected-file">
      <span class="file-icon">📄</span>
      <span class="file-name" id="file-name"></span>
      <button class="file-remove" id="file-remove" title="Remove">×</button>
    </div>

    <div class="upload-status" id="upload-status"></div>

    <div class="cv-actions">
      <button class="btn" id="upload-btn" disabled>Upload CV and continue</button>
      <button class="btn btn-skip" id="skip-btn">Skip — continue without CV</button>
    </div>

    <div class="upload-progress" id="upload-progress">Processing your CV...</div>
  </main>

  ${footerHTML()}

  ${supabaseAuthScript(env)}
  <script>
    var assessmentId = new URLSearchParams(window.location.search).get('id');
    if (!assessmentId) {
      window.location.href = '/career-assessment/dashboard';
    }

    var consentBox = document.getElementById('cv-consent');
    var fileInput = document.getElementById('cv-file');
    var uploadArea = document.getElementById('upload-area');
    var selectedFileDiv = document.getElementById('selected-file');
    var fileNameSpan = document.getElementById('file-name');
    var fileRemoveBtn = document.getElementById('file-remove');
    var uploadBtn = document.getElementById('upload-btn');
    var skipBtn = document.getElementById('skip-btn');
    var statusDiv = document.getElementById('upload-status');
    var progressDiv = document.getElementById('upload-progress');

    var selectedFile = null;

    function updateButtonState() {
      uploadBtn.disabled = !(consentBox.checked && selectedFile);
    }

    consentBox.addEventListener('change', updateButtonState);

    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      handleFile(file);
    });

    function handleFile(file) {
      // Validation
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showStatus('error', 'Please upload a PDF file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showStatus('error', 'File is too large. Maximum size is 5 MB.');
        return;
      }
      selectedFile = file;
      fileNameSpan.textContent = file.name;
      selectedFileDiv.classList.add('show');
      uploadArea.style.display = 'none';
      hideStatus();
      updateButtonState();
    }

    fileRemoveBtn.addEventListener('click', function() {
      selectedFile = null;
      fileInput.value = '';
      selectedFileDiv.classList.remove('show');
      uploadArea.style.display = 'block';
      updateButtonState();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', function() {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      var file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    function showStatus(type, msg) {
      statusDiv.className = 'upload-status show ' + type;
      statusDiv.textContent = msg;
    }

    function hideStatus() {
      statusDiv.classList.remove('show');
    }

    function setUploadingState(isUploading) {
      uploadBtn.disabled = isUploading || !(consentBox.checked && selectedFile);
      skipBtn.disabled = isUploading;
      consentBox.disabled = isUploading;
      fileRemoveBtn.style.display = isUploading ? 'none' : 'inline-block';
      progressDiv.classList.toggle('show', isUploading);
    }

    uploadBtn.addEventListener('click', async function() {
      if (!selectedFile || !consentBox.checked) return;
      hideStatus();
      setUploadingState(true);
      uploadBtn.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,0.3); border-top-color:white;"></span>&nbsp;&nbsp;Uploading…';

      try {
        // Read file as base64
        var fileData = await readFileAsBase64(selectedFile);

        var token = await window.ensureValidToken();
        if (!token) return;

        var res = await fetch('/api/assessment/' + assessmentId + '/cv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({
            filename: selectedFile.name,
            file_data: fileData,
            consent_given: true,
          }),
        });

        var data = await res.json();
        if (!res.ok) {
          showStatus('error', data.error || 'Something went wrong. Please try again.');
          setUploadingState(false);
          uploadBtn.textContent = 'Upload CV and continue';
          return;
        }

        // Show success briefly, then redirect to chat
        showStatus('success', 'CV processed. Starting your career interest conversation...');
        setTimeout(function() {
          window.location.href = '/career-assessment/chat?id=' + assessmentId;
        }, 1200);
      } catch (err) {
        console.error('Upload error:', err);
        showStatus('error', 'Connection problem. Please try again.');
        setUploadingState(false);
        uploadBtn.textContent = 'Upload CV and continue';
      }
    });

    skipBtn.addEventListener('click', async function() {
      if (skipBtn.disabled) return;
      skipBtn.disabled = true;
      uploadBtn.disabled = true;
      skipBtn.innerHTML = '<span class="spinner"></span>&nbsp;&nbsp;Continuing…';

      try {
        var res = await window.apiFetch('/api/assessment/' + assessmentId + '/cv-skip', {
          method: 'POST',
        });
        if (!res) return;
        var data = await res.json();
        if (!res.ok) {
          showStatus('error', data.error || 'Something went wrong. Please try again.');
          skipBtn.disabled = false;
          skipBtn.textContent = 'Skip — continue without CV';
          updateButtonState();
          return;
        }
        window.location.href = '/career-assessment/chat?id=' + assessmentId;
      } catch (err) {
        console.error('Skip error:', err);
        showStatus('error', 'Connection problem. Please try again.');
        skipBtn.disabled = false;
        skipBtn.textContent = 'Skip — continue without CV';
        updateButtonState();
      }
    });

    function readFileAsBase64(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() {
          // Strip the "data:application/pdf;base64," prefix
          var result = reader.result;
          var commaIdx = result.indexOf(',');
          resolve(commaIdx !== -1 ? result.substring(commaIdx + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  </script>
</body>
</html>`;
}
