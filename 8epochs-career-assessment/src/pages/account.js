import { sharedStyles, navHTML, supabaseAuthScript } from './serve.js';

export function accountPage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Settings — 8epochs</title>
  <style>${sharedStyles()}
    .account-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 48px 24px 100px;
    }
    .account-container h1 { margin-bottom: 32px; }
    .settings-section {
      margin-bottom: 40px;
    }
    .settings-section h2 {
      font-size: 1rem;
      text-transform: none;
      letter-spacing: normal;
      margin-bottom: 8px;
      color: var(--text);
    }
    .settings-section p {
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .danger-zone {
      border: 1px solid var(--error);
      border-radius: var(--radius);
      padding: 24px;
    }
    .danger-zone h2 {
      color: var(--error);
    }
    .btn-danger {
      background: var(--error);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 0.9rem;
      transition: opacity 0.15s;
    }
    .btn-danger:hover { opacity: 0.85; }
    .btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline-danger {
      background: none;
      color: var(--error);
      border: 1px solid var(--error);
      padding: 10px 20px;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.15s;
    }
    .btn-outline-danger:hover { background: var(--error); color: white; }
    .action-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .info-card {
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius);
      padding: 20px;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      padding: 6px 0;
    }
    .info-label { color: var(--text-light); }
    .info-value { color: var(--text); font-weight: 500; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: var(--bg);
      border-radius: var(--radius);
      padding: 32px;
      max-width: 480px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal h3 {
      font-size: 1.1rem;
      text-transform: none;
      letter-spacing: normal;
      color: var(--error);
      margin-bottom: 16px;
    }
    .modal p {
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--text);
      margin-bottom: 12px;
    }
    .modal-warning {
      background: #fef3cd;
      border: 1px solid #ffc107;
      border-radius: var(--radius);
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 0.88rem;
      line-height: 1.5;
      color: #856404;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }
    .modal-confirm-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.9rem;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  ${navHTML({ authenticated: true })}
  <div class="account-container" id="account-content">
    <div style="text-align:center; padding:80px 0; color:var(--text-muted);">
      <div class="spinner" style="width:28px; height:28px; border-color: var(--border); border-top-color: var(--accent); margin: 0 auto 12px;"></div>
      <p>Loading account settings...</p>
    </div>
  </div>

  ${supabaseAuthScript(env)}
  <script>
    async function loadAccount() {
      if (window.waitForAuth) await window.waitForAuth();
      var res = await apiFetch('/api/dashboard');
      if (!res) return;
      var data = await res.json();

      var consentRes = await apiFetch('/api/consent/status');
      var consentData = consentRes ? await consentRes.json() : {};

      var html = '<h1>Account Settings</h1>';

      // Account info
      html += '<div class="settings-section">';
      html += '<h2>Your Account</h2>';
      html += '<div class="info-card">';
      html += '<div class="info-row"><span class="info-label">Email</span><span class="info-value">' + escapeHtml(data.user?.email || '') + '</span></div>';
      html += '<div class="info-row"><span class="info-label">Phase 1 credits</span><span class="info-value">' + (data.credits?.phase1?.available || 0) + ' available</span></div>';
      html += '<div class="info-row"><span class="info-label">Phase 2 credits</span><span class="info-value">' + (data.credits?.phase2?.available || 0) + ' available</span></div>';
      html += '<div class="info-row"><span class="info-label">Assessments</span><span class="info-value">' + (data.assessments?.length || 0) + '</span></div>';
      if (consentData.consent_given_at) {
        html += '<div class="info-row"><span class="info-label">Consent given</span><span class="info-value">' + new Date(consentData.consent_given_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</span></div>';
      }
      html += '</div>';
      html += '</div>';

      // Legal links
      html += '<div class="settings-section">';
      html += '<h2>Legal</h2>';
      html += '<p><a href="/career-assessment/terms">Terms and Conditions</a></p>';
      html += '<p><a href="/career-assessment/privacy">Privacy Policy</a></p>';
      html += '</div>';

      // Data management
      html += '<div class="settings-section">';
      html += '<h2>Your Data</h2>';
      html += '<p>You can download your reports from the dashboard. If you want to delete your assessment data, you can do so below. This will permanently remove all your conversations, questionnaire responses, and generated reports.</p>';

      var hasAssessments = data.assessments && data.assessments.length > 0;
      var hasReports = data.assessments && data.assessments.some(function(a) { return a.status === 'phase1_complete' || a.status === 'phase2_complete'; });

      if (hasAssessments) {
        if (hasReports) {
          html += '<p style="color:var(--text);font-weight:500;">We recommend downloading your reports from the dashboard before deleting your data.</p>';
        }
        html += '<div class="action-row">';
        html += '<button class="btn-outline-danger" onclick="showDeleteDataModal()">Delete Assessment Data</button>';
        html += '</div>';
      } else {
        html += '<p style="font-style:italic;">You have no assessment data to delete.</p>';
      }
      html += '</div>';

      // Danger zone - account deletion
      html += '<div class="settings-section danger-zone">';
      html += '<h2>Delete Account</h2>';
      html += '<p>Permanently delete your account, all assessment data, and all associated records. This action cannot be undone.</p>';

      var totalCredits = (data.credits?.phase1?.available || 0) + (data.credits?.phase2?.available || 0);
      if (totalCredits > 0) {
        html += '<div class="modal-warning">You have ' + totalCredits + ' unused credit' + (totalCredits !== 1 ? 's' : '') + ' that will be permanently forfeited if you delete your account.</div>';
      }

      html += '<div class="action-row">';
      html += '<button class="btn-danger" onclick="showDeleteAccountModal(' + totalCredits + ')">Delete My Account</button>';
      html += '</div>';
      html += '</div>';

      // Back link
      html += '<div style="margin-top:32px;"><a href="/career-assessment/dashboard" style="font-size:0.9rem; color:var(--text-muted);">← Back to Dashboard</a></div>';

      document.getElementById('account-content').innerHTML = html;
    }

    function showDeleteDataModal() {
      var overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = 'modal-overlay';
      overlay.innerHTML = '<div class="modal">' +
        '<h3>Delete Assessment Data</h3>' +
        '<p>This will permanently delete:</p>' +
        '<p>• All conversation transcripts<br>• All questionnaire responses and scores<br>• All uploaded CV content (if any)<br>• All generated personality and career reports<br>• All in-progress assessments</p>' +
        '<div class="modal-warning">This action is irreversible. Please download any reports you want to keep before proceeding.</div>' +
        '<p>Your account will remain active and you can start new assessments with available credits.</p>' +
        '<p style="font-size:0.85rem; color:var(--text-light);">A record of this deletion will be retained for legal compliance purposes.</p>' +
        '<div class="modal-actions">' +
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn-danger" id="confirm-delete-data" onclick="deleteData()">Delete All Assessment Data</button>' +
        '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
    }

    function showDeleteAccountModal(credits) {
      var creditsWarning = credits > 0
        ? '<div class="modal-warning">You have ' + credits + ' unused credit' + (credits !== 1 ? 's' : '') + ' that will be permanently forfeited.</div>'
        : '';

      var overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = 'modal-overlay';
      overlay.innerHTML = '<div class="modal">' +
        '<h3>Delete Your Account</h3>' +
        '<p>This will permanently delete:</p>' +
        '<p>• Your account and email from our system<br>• All assessment data, conversations, and reports<br>• All unused credits</p>' +
        creditsWarning +
        '<div class="modal-warning">This action is irreversible. You will be logged out immediately and will not be able to recover your account or data.</div>' +
        '<p>Please download any reports you want to keep before proceeding.</p>' +
        '<p style="margin-top:16px; font-size:0.9rem;">To confirm, type <strong>DELETE</strong> below:</p>' +
        '<input type="text" class="modal-confirm-input" id="delete-confirm-input" placeholder="Type DELETE to confirm">' +
        '<p style="font-size:0.85rem; color:var(--text-light); margin-top:8px;">A minimal record of this deletion and your original consent will be retained for 6 years for legal compliance.</p>' +
        '<div class="modal-actions">' +
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn-danger" id="confirm-delete-account" onclick="deleteAccount()" disabled>Delete My Account</button>' +
        '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });

      var input = document.getElementById('delete-confirm-input');
      var btn = document.getElementById('confirm-delete-account');
      input.addEventListener('input', function() {
        btn.disabled = input.value.trim() !== 'DELETE';
      });
    }

    function closeModal() {
      var overlay = document.getElementById('modal-overlay');
      if (overlay) overlay.remove();
    }

    async function deleteData() {
      var btn = document.getElementById('confirm-delete-data');
      btn.disabled = true;
      btn.textContent = 'Deleting...';

      var res = await apiFetch('/api/account/delete-data', { method: 'POST' });
      if (!res) return;
      var data = await res.json();

      if (data.error) {
        alert(data.error);
        btn.disabled = false;
        btn.textContent = 'Delete All Assessment Data';
        return;
      }

      closeModal();
      loadAccount(); // Refresh
    }

    async function deleteAccount() {
      var btn = document.getElementById('confirm-delete-account');
      btn.disabled = true;
      btn.textContent = 'Deleting...';

      var res = await apiFetch('/api/account/delete', { method: 'POST' });
      if (!res) return;
      var data = await res.json();

      if (data.error) {
        alert(data.error);
        btn.disabled = false;
        btn.textContent = 'Delete My Account';
        return;
      }

      // Clear session and redirect
      clearSession();
      window.location.href = '/career-assessment';
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    loadAccount();
  </script>
</body>
</html>`;
}
