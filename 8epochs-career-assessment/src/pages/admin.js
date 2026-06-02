import { sharedStyles, navHTML, supabaseAuthScript } from './serve.js';

export function adminPage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — 8epochs</title>
  <style>${sharedStyles()}

    .admin-header {
      padding: 48px 0 32px;
    }

    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid var(--border);
      margin-bottom: 24px;
    }

    .tab {
      padding: 10px 20px;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      background: none;
      border-top: none;
      border-left: none;
      border-right: none;
      font-family: var(--font-sans);
    }

    .tab:hover { color: var(--text); }
    .tab.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      padding: 20px;
      text-align: center;
    }

    .stat-card .stat-number {
      font-size: 1.8rem;
      font-weight: 300;
      font-family: var(--font-serif);
      color: var(--text);
    }

    .stat-card .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }

    .action-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      align-items: end;
    }

    .action-bar .field {
      flex: 1;
    }

    .action-bar label {
      display: block;
      font-size: 0.8rem;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .action-bar input, .action-bar select {
      padding: 8px 12px;
      font-size: 0.9rem;
    }

    .action-bar .btn {
      white-space: nowrap;
    }

    .table-container {
      overflow-x: auto;
    }

    td .actions {
      display: flex;
      gap: 6px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }

    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: var(--radius);
      font-size: 0.9rem;
      color: white;
      background: var(--accent);
      box-shadow: var(--shadow-md);
      display: none;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }

    @media (max-width: 768px) {
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .action-bar { flex-direction: column; }
    }
  </style>
</head>
<body>
  ${navHTML()}

  <div class="container-wide">
    <div class="admin-header">
      <h1>Admin panel</h1>
      <p>Manage users, credits, and monitor assessments.</p>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('overview')">Overview</button>
      <button class="tab" onclick="showTab('users')">Users</button>
      <button class="tab" onclick="showTab('assessments')">Assessments</button>
    </div>

    <!-- OVERVIEW TAB -->
    <div id="tab-overview" class="tab-content active">
      <div id="stats-grid" class="stat-grid">
        <div class="card stat-card"><div class="stat-number">—</div><div class="stat-label">Users</div></div>
        <div class="card stat-card"><div class="stat-number">—</div><div class="stat-label">Credits Used</div></div>
        <div class="card stat-card"><div class="stat-number">—</div><div class="stat-label">Assessments</div></div>
        <div class="card stat-card"><div class="stat-number">—</div><div class="stat-label">Est. API Cost</div></div>
      </div>
    </div>

    <!-- USERS TAB -->
    <div id="tab-users" class="tab-content">
      <div class="card" style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 12px;">Add users</h3>
        <div class="action-bar">
          <div class="field">
            <label for="add-emails">Email addresses (one per line or comma-separated)</label>
            <textarea id="add-emails" rows="2" style="width:100%; padding:8px 12px; font-size:0.9rem; font-family:var(--font-sans); border:1px solid var(--border); border-radius:var(--radius);" placeholder="user@example.com"></textarea>
          </div>
          <button class="btn btn-sm" onclick="addUsers()" style="align-self:end;">Add to allowlist</button>
        </div>
      </div>

      <div class="card" style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 12px;">Grant credits</h3>
        <div class="action-bar">
          <div class="field">
            <label for="credit-user">User</label>
            <select id="credit-user" style="width:100%;"></select>
          </div>
          <div class="field" style="flex:0; min-width:100px;">
            <label for="credit-phase">Phase</label>
            <select id="credit-phase">
              <option value="1">Phase 1</option>
              <option value="2">Phase 2</option>
            </select>
          </div>
          <div class="field" style="flex:0; min-width:80px;">
            <label for="credit-count">Count</label>
            <input type="number" id="credit-count" value="1" min="1" max="10" />
          </div>
          <button class="btn btn-sm" onclick="grantCredits()" style="align-self:end;">Grant</button>
        </div>
      </div>

      <div class="table-container" id="users-table">
        <div class="loading">Loading users...</div>
      </div>
    </div>

    <!-- ASSESSMENTS TAB -->
    <div id="tab-assessments" class="tab-content">
      <div class="table-container" id="assessments-table">
        <div class="loading">Loading assessments...</div>
      </div>
    </div>
  </div>

  <div id="toast"></div>

  ${supabaseAuthScript(env)}
  <script>
    let usersData = [];

    // Check admin access
    async function init() {
      const token = await ensureValidToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      loadStats();
      loadUsers();
      loadAssessments();
    }

    function showTab(name) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
      event.target.classList.add('active');
    }

    function toast(message, isError = false) {
      const t = document.getElementById('toast');
      t.textContent = message;
      t.style.background = isError ? 'var(--error)' : 'var(--accent)';
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3000);
    }

    // ---- Stats ----
    async function loadStats() {
      const res = await apiFetch('/api/admin/stats');
      if (!res) return;
      const data = await res.json();
      if (data.error) { toast(data.error, true); return; }

      document.getElementById('stats-grid').innerHTML = \`
        <div class="card stat-card"><div class="stat-number">\${data.users.total_allowlisted}</div><div class="stat-label">Users</div></div>
        <div class="card stat-card"><div class="stat-number">\${data.credits.total_consumed}</div><div class="stat-label">Credits Used</div></div>
        <div class="card stat-card"><div class="stat-number">\${data.assessments.total}</div><div class="stat-label">Assessments</div></div>
        <div class="card stat-card"><div class="stat-number">\${data.estimated_api_cost}</div><div class="stat-label">Est. API Cost</div></div>
      \`;
    }

    // ---- Users ----
    async function loadUsers() {
      const res = await apiFetch('/api/admin/users');
      if (!res) return;
      const data = await res.json();
      if (data.error) { toast(data.error, true); return; }

      usersData = data.users;
      renderUsers();
      updateUserDropdown();
    }

    function renderUsers() {
      if (usersData.length === 0) {
        document.getElementById('users-table').innerHTML = '<p style="color:var(--text-muted); padding:20px;">No users yet.</p>';
        return;
      }

      let html = '<table><thead><tr>';
      html += '<th>Email</th><th>Ph1 Credits</th><th>Ph2 Credits</th><th>Assessments</th><th>Joined</th><th>Actions</th>';
      html += '</tr></thead><tbody>';

      for (const u of usersData) {
        const date = new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        html += '<tr>';
        html += '<td>' + u.email + (u.is_admin ? ' <span class="badge badge-blue">admin</span>' : '') + '</td>';
        html += '<td>' + u.credits.phase1_available + ' avail / ' + u.credits.phase1_consumed + ' used</td>';
        html += '<td>' + u.credits.phase2_available + ' avail / ' + u.credits.phase2_consumed + ' used</td>';
        html += '<td>' + u.assessment_count + '</td>';
        html += '<td>' + date + '</td>';
        html += '<td><div class="actions">';
        html += '<button class="btn btn-secondary btn-sm" onclick="removeUser(\\'' + u.id + '\\', \\'' + u.email + '\\')">Remove</button>';
        html += '</div></td>';
        html += '</tr>';
      }

      html += '</tbody></table>';
      document.getElementById('users-table').innerHTML = html;
    }

    function updateUserDropdown() {
      const select = document.getElementById('credit-user');
      select.innerHTML = usersData.map(u =>
        '<option value="' + u.id + '">' + u.email + '</option>'
      ).join('');
    }

    async function addUsers() {
      const raw = document.getElementById('add-emails').value;
      const emails = raw.split(/[,\\n]/).map(e => e.trim()).filter(e => e);

      if (emails.length === 0) { toast('Enter at least one email', true); return; }

      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ emails }),
      });

      if (!res) return;
      const data = await res.json();

      const created = data.results.filter(r => r.status === 'created' || r.status === 'allowlisted').length;
      const skipped = data.results.filter(r => r.status === 'skipped').length;
      const errors = data.results.filter(r => r.status === 'error').length;

      let msg = created + ' added';
      if (skipped) msg += ', ' + skipped + ' already existed';
      if (errors) msg += ', ' + errors + ' failed';
      toast(msg, errors > 0);

      document.getElementById('add-emails').value = '';
      loadUsers();
      loadStats();
    }

    async function removeUser(userId, email) {
      if (!confirm('Remove ' + email + ' from the allowlist?')) return;

      const res = await apiFetch('/api/admin/users/' + userId, { method: 'DELETE' });
      if (!res) return;

      toast(email + ' removed');
      loadUsers();
      loadStats();
    }

    async function grantCredits() {
      const userId = document.getElementById('credit-user').value;
      const phase = parseInt(document.getElementById('credit-phase').value);
      const count = parseInt(document.getElementById('credit-count').value);

      if (!userId) { toast('Select a user', true); return; }

      const res = await apiFetch('/api/admin/credits', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, phase, count }),
      });

      if (!res) return;
      const data = await res.json();

      if (data.error) { toast(data.error, true); return; }

      toast('Granted ' + count + ' Phase ' + phase + ' credit(s)');
      loadUsers();
      loadStats();
    }

    // ---- Assessments ----
    async function loadAssessments() {
      const res = await apiFetch('/api/admin/assessments');
      if (!res) return;
      const data = await res.json();
      if (data.error) { toast(data.error, true); return; }

      if (data.assessments.length === 0) {
        document.getElementById('assessments-table').innerHTML = '<p style="color:var(--text-muted); padding:20px;">No assessments yet.</p>';
        return;
      }

      const statusLabels = {
        'intake': 'Starting',
        'questionnaire': 'Questionnaire',
        'phase1_active': 'Phase 1 Active',
        'phase1_complete': 'Phase 1 Done',
        'phase2_active': 'Phase 2 Active',
        'phase2_complete': 'Complete',
      };

      let html = '<table><thead><tr>';
      html += '<th>User</th><th>Status</th><th>Messages</th><th>Started</th><th>Updated</th>';
      html += '</tr></thead><tbody>';

      for (const a of data.assessments) {
        const started = new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const updated = new Date(a.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        html += '<tr>';
        html += '<td>' + a.email + '</td>';
        html += '<td><span class="badge badge-blue">' + (statusLabels[a.status] || a.status) + '</span></td>';
        html += '<td>' + a.message_count + '</td>';
        html += '<td>' + started + '</td>';
        html += '<td>' + updated + '</td>';
        html += '</tr>';
      }

      html += '</tbody></table>';
      document.getElementById('assessments-table').innerHTML = html;
    }

    init();
  </script>
</body>
</html>`;
}
