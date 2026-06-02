import { sharedStyles, navHTML, supabaseAuthScript } from './serve.js';

export function chatPage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Conversation — 8epochs</title>
  <style>${sharedStyles()}

    html, body {
      height: 100%;
    }

    body {
      display: flex;
      flex-direction: column;
    }

    .chat-layout {
      flex: 1;
      display: flex;
      flex-direction: column;
      max-width: 720px;
      width: 100%;
      margin: 0 auto;
      padding: 0 24px;
      overflow: hidden;
    }

    .progress-strip {
      padding: 16px 0 12px;
      text-align: center;
      flex-shrink: 0;
    }

    .progress-label {
      font-size: 0.8rem;
      color: var(--text-light);
      letter-spacing: 0.03em;
      transition: opacity 0.3s;
    }

    .progress-dots {
      display: flex;
      gap: 6px;
      justify-content: center;
      margin-top: 8px;
    }

    .progress-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--border);
      transition: background 0.3s, transform 0.3s;
    }

    .progress-dot.active {
      background: var(--accent);
      transform: scale(1.3);
    }

    .progress-dot.done {
      background: var(--accent);
    }

    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px 0 24px;
      scroll-behavior: smooth;
    }

    .message {
      margin-bottom: 28px;
      animation: fadeIn 0.3s ease;
    }

    .message-assistant {
      padding-right: 48px;
    }

    .message-assistant .message-content {
      font-family: var(--font-serif);
      font-size: 1.05rem;
      line-height: 1.75;
      color: var(--text);
    }

    .message-user {
      padding-left: 48px;
    }

    .message-user .message-content {
      background: var(--accent-light);
      border-radius: var(--radius);
      padding: 14px 18px;
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text);
      margin-left: auto;
      max-width: fit-content;
    }

    .message-content p { margin-bottom: 12px; color: inherit; }
    .message-content p:last-child { margin-bottom: 0; }

    .typing-indicator {
      display: inline-flex;
      gap: 4px;
      padding: 8px 0;
    }

    .typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
      animation: typingPulse 1.2s infinite;
    }

    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typingPulse {
      0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
      30% { opacity: 1; transform: scale(1.2); }
    }

    .streaming-cursor {
      display: inline-block;
      width: 2px;
      height: 1.1em;
      background: var(--accent);
      margin-left: 2px;
      vertical-align: text-bottom;
      animation: blink 0.8s infinite;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .input-area {
      flex-shrink: 0;
      border-top: 1px solid var(--border-light);
      padding: 16px 0 24px;
    }

    .input-wrap {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .input-wrap textarea {
      flex: 1;
      min-height: 44px;
      max-height: 160px;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      line-height: 1.5;
      resize: none;
      background: var(--bg-card);
      color: var(--text);
      transition: border-color 0.15s;
    }

    .input-wrap textarea:focus {
      outline: none;
      border-color: var(--accent);
    }

    .input-wrap textarea:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .send-btn {
      width: 44px;
      height: 44px;
      border-radius: var(--radius);
      background: var(--accent);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, opacity 0.15s;
      flex-shrink: 0;
    }

    .send-btn:hover { background: var(--accent-hover); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .send-btn svg {
      width: 18px;
      height: 18px;
    }

    .loading-state {
      text-align: center;
      padding: 80px 24px;
      color: var(--text-muted);
    }

    .completion-banner {
      text-align: center;
      padding: 24px;
      background: var(--success-bg);
      border-radius: var(--radius);
      margin-bottom: 16px;
    }

    .completion-banner p {
      color: var(--success);
      font-weight: 500;
      margin-bottom: 12px;
    }

    @media (max-width: 640px) {
      .message-assistant { padding-right: 12px; }
      .message-user { padding-left: 12px; }
      .message-assistant .message-content { font-size: 1rem; }
    }
  </style>
</head>
<body>
  ${navHTML({ authenticated: true })}

  <div class="chat-layout" id="chat-layout">
    <div class="loading-state">
      <div class="spinner" style="width:28px; height:28px; border-color: var(--border); border-top-color: var(--accent); margin: 0 auto 12px;"></div>
      <p>Loading conversation...</p>
    </div>
  </div>

  ${supabaseAuthScript(env)}
  <script>
    const assessmentId = new URLSearchParams(window.location.search).get('id');
    if (!assessmentId) {
      window.location.href = '/career-assessment/dashboard';
    }

    let isStreaming = false;
    let phase = 1;
    let isComplete = false;

    const progressPhases = ['opening', 'exploring', 'probing', 'reflecting', 'complete'];
    const progressLabels = {
      opening: 'Reviewing your responses',
      exploring: 'Exploring how you think',
      probing: 'Digging deeper',
      reflecting: 'Reflecting together',
      complete: 'Your report is ready',
    };
    let currentProgress = 'opening';

    async function init() {
      if (window.waitForAuth) await window.waitForAuth();
      // Check assessment status
      const res = await apiFetch('/api/assessment/' + assessmentId);
      if (!res) return;
      const data = await res.json();

      if (!data.assessment) {
        window.location.href = '/career-assessment/dashboard';
        return;
      }

      const status = data.assessment.status;
      if (status === 'intake') {
        window.location.href = '/career-assessment/intake?id=' + assessmentId;
        return;
      }
      if (status === 'questionnaire') {
        window.location.href = '/career-assessment/questionnaire?id=' + assessmentId;
        return;
      }

      if (status === 'phase2_active' || status === 'phase2_complete') phase = 2;
      if (status === 'phase1_complete' || status === 'phase2_complete') {
        isComplete = true;
      }

      // Render the chat layout
      renderChatLayout();

      // Load existing messages
      const msgRes = await apiFetch('/api/assessment/' + assessmentId + '/messages?phase=' + phase);
      if (!msgRes) return;
      const msgData = await msgRes.json();

      const messagesArea = document.getElementById('messages-area');

      if (msgData.messages && msgData.messages.length > 0) {
        for (const msg of msgData.messages) {
          if (msg.role === 'user' && msg.content.startsWith('[')) continue; // Skip system prompts
          appendMessage(msg.role, msg.content);
        }
        scrollToBottom();

        if (isComplete) {
          showCompletionBanner();
        }
      } else {
        // No messages yet — trigger Claude's opening message
        triggerOpening();
      }
    }

    function renderChatLayout() {
      document.getElementById('chat-layout').innerHTML = \`
        <div class="progress-strip" id="progress-strip">
          <div class="progress-label" id="progress-label">\${progressLabels[currentProgress]}</div>
          <div class="progress-dots">
            \${progressPhases.map((p, i) => \`<div class="progress-dot \${i === 0 ? 'active' : ''}" data-phase="\${p}"></div>\`).join('')}
          </div>
        </div>

        <div class="messages-area" id="messages-area"></div>

        \${isComplete ? '' : \`
        <div class="input-area" id="input-area">
          <div class="input-wrap">
            <textarea id="message-input"
                      placeholder="Type your response..."
                      rows="1"
                      \${isStreaming ? 'disabled' : ''}></textarea>
            <button class="send-btn" id="send-btn" \${isStreaming ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>\`}
      \`;

      if (!isComplete) {
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        // Auto-resize textarea
        input.addEventListener('input', () => {
          input.style.height = 'auto';
          input.style.height = Math.min(input.scrollHeight, 160) + 'px';
        });

        // Send on Enter (Shift+Enter for newline)
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });

        sendBtn.addEventListener('click', sendMessage);
      }
    }

    function appendMessage(role, content) {
      const messagesArea = document.getElementById('messages-area');
      const div = document.createElement('div');
      div.className = 'message message-' + role;

      // Strip progress tags and handoff delimiters from display
      let displayContent = content;
      displayContent = displayContent.replace(/^\\[PROGRESS:\\w+\\]\\s*/m, '');

      // If the message contains handoff markers, only show the part before them
      const handoffIdx = displayContent.indexOf('---HANDOFF_START---');
      if (handoffIdx !== -1) {
        displayContent = displayContent.substring(0, handoffIdx).trim();
      }

      // Simple markdown-to-HTML (basic: paragraphs, bold, italic, tables, headers)
      const html = markdownToHtml(displayContent);

      div.innerHTML = '<div class="message-content">' + html + '</div>';
      messagesArea.appendChild(div);
    }

    function appendStreamingMessage() {
      const messagesArea = document.getElementById('messages-area');
      const div = document.createElement('div');
      div.className = 'message message-assistant';
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
      div.appendChild(contentDiv);
      messagesArea.appendChild(div);
      scrollToBottom();
      return contentDiv;
    }

    function scrollToBottom() {
      requestAnimationFrame(function() {
        const area = document.getElementById('messages-area');
        if (area) {
          area.scrollTop = area.scrollHeight;
        }
      });
    }

    async function triggerOpening() {
      isStreaming = true;
      setInputState(false);
      const streamEl = appendStreamingMessage();

      try {
        const token = await ensureValidToken();
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({
            assessment_id: assessmentId,
            message_text: null,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          streamEl.innerHTML = '<p style="color:var(--error);">' + (err.error || 'Something went wrong.') + '</p>';
          isStreaming = false;
          setInputState(true);
          return;
        }

        await processSSEStream(res.body, streamEl);
      } catch (err) {
        console.error('Opening message error:', err);
        streamEl.innerHTML = '<p style="color:var(--error);">Failed to connect. Please refresh the page.</p>';
      }

      isStreaming = false;
      setInputState(true);
      document.getElementById('message-input')?.focus();
    }

    async function sendMessage() {
      if (isStreaming || isComplete) return;

      const input = document.getElementById('message-input');
      const text = input.value.trim();
      if (!text) return;

      // Show user message
      appendMessage('user', text);
      input.value = '';
      input.style.height = 'auto';
      scrollToBottom();

      // Start streaming
      isStreaming = true;
      setInputState(false);
      const streamEl = appendStreamingMessage();

      try {
        const token = await ensureValidToken();
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({
            assessment_id: assessmentId,
            message_text: text,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Something went wrong' }));
          streamEl.innerHTML = '<p style="color:var(--error);">' + (err.error || 'Something went wrong. Your conversation is saved.') + '</p>';
          isStreaming = false;
          setInputState(true);
          return;
        }

        await processSSEStream(res.body, streamEl);
      } catch (err) {
        console.error('Send message error:', err);
        streamEl.innerHTML = '<p style="color:var(--error);">Connection lost. Your conversation is saved — refresh to continue.</p>';
      }

      isStreaming = false;
      setInputState(true);
      document.getElementById('message-input')?.focus();
    }

    async function processSSEStream(body, streamEl) {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let typingRemoved = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process all complete "data: ...\\n" lines in the buffer
          var idx;
          while ((idx = buffer.indexOf('data: ')) !== -1) {
            // Find the end of this data line (a real newline character)
            var endIdx = buffer.indexOf(String.fromCharCode(10), idx);
            if (endIdx === -1) break; // incomplete line, wait for more data

            var dataLine = buffer.substring(idx + 6, endIdx).trim();
            buffer = buffer.substring(endIdx + 1);

            if (!dataLine) continue;

            var eventData;
            try {
              eventData = JSON.parse(dataLine);
            } catch (e) {
              continue;
            }

            if (eventData.text) {
              if (!typingRemoved) {
                streamEl.innerHTML = '';
                typingRemoved = true;
              }
              fullText += eventData.text;

              // Hide handoff content if it appears
              var displayText = fullText;
              var hi = displayText.indexOf('---HANDOFF_START---');
              if (hi !== -1) displayText = displayText.substring(0, hi).trim();

              streamEl.innerHTML = markdownToHtml(displayText) + '<span class="streaming-cursor"></span>';
              scrollToBottom();
            }

            if (eventData.phase && typeof eventData.phase === 'string') {
              updateProgress(eventData.phase);
            }

            if (eventData.message_length !== undefined) {
              // Stream complete — remove cursor
              var dt = fullText;
              var hi2 = dt.indexOf('---HANDOFF_START---');
              if (hi2 !== -1) dt = dt.substring(0, hi2).trim();
              streamEl.innerHTML = markdownToHtml(dt);
              scrollToBottom();
            }

            if (eventData.phase && typeof eventData.phase === 'number') {
              isComplete = true;
              showCompletionBanner();
            }

            if (eventData.error) {
              if (!typingRemoved) { streamEl.innerHTML = ''; typingRemoved = true; }
              streamEl.innerHTML += '<p style="color:var(--error);">Error: ' + eventData.error + '</p>';
            }
          }
        }
      } catch (err) {
        console.error('Stream read error:', err);
      }

      if (!typingRemoved) {
        streamEl.innerHTML = '<p style="color:var(--text-muted);">No response received. Please try again.</p>';
      }
    }

    function updateProgress(phase) {
      currentProgress = phase;
      const label = document.getElementById('progress-label');
      if (label) label.textContent = progressLabels[phase] || phase;

      const idx = progressPhases.indexOf(phase);
      document.querySelectorAll('.progress-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === idx);
        dot.classList.toggle('done', i < idx);
      });
    }

    function setInputState(enabled) {
      const input = document.getElementById('message-input');
      const btn = document.getElementById('send-btn');
      if (input) input.disabled = !enabled;
      if (btn) btn.disabled = !enabled;
    }

    function showCompletionBanner() {
      const inputArea = document.getElementById('input-area');
      if (inputArea) inputArea.remove();

      const messagesArea = document.getElementById('messages-area');
      const banner = document.createElement('div');
      banner.className = 'completion-banner';
      var bannerText = phase === 2 ? 'Your career profile is ready' : 'Your personality report is ready';
      var btnText = phase === 2 ? 'View Career Profile' : 'View Your Report';
      banner.innerHTML = '<p>' + bannerText + '</p><a href="/career-assessment/report?id=' + assessmentId + '&phase=' + phase + '" class="btn">' + btnText + '</a>';
      messagesArea.appendChild(banner);
      scrollToBottom();
    }

    // ============================================================
    // SIMPLE MARKDOWN TO HTML
    // ============================================================

    function markdownToHtml(md) {
      if (!md) return '';

      // Handle tables first
      md = md.replace(/^(\\|.+\\|\\n)+/gm, (match) => {
        const rows = match.trim().split('\\n');
        if (rows.length < 2) return match;
        let html = '<table>';
        rows.forEach((row, i) => {
          // Skip separator rows (|---|---|)
          if (row.match(/^\\|[\\s-:|]+\\|$/)) return;
          const cells = row.split('|').filter(c => c.trim() !== '');
          const tag = i === 0 ? 'th' : 'td';
          html += '<tr>' + cells.map(c => '<' + tag + '>' + c.trim() + '</' + tag + '>').join('') + '</tr>';
        });
        html += '</table>';
        return html;
      });

      let lines = md.split('\\n');
      let html = '';
      let inParagraph = false;

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
          if (inParagraph) { html += '</p>'; inParagraph = false; }
          continue;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          if (inParagraph) { html += '</p>'; inParagraph = false; }
          html += '<h3 style="margin-top:24px; margin-bottom:8px; text-transform:none; letter-spacing:normal; font-size:1rem; color:var(--text);">' + inlineFormat(trimmed.slice(4)) + '</h3>';
          continue;
        }
        if (trimmed.startsWith('## ')) {
          if (inParagraph) { html += '</p>'; inParagraph = false; }
          html += '<h2 style="margin-top:32px; margin-bottom:12px;">' + inlineFormat(trimmed.slice(3)) + '</h2>';
          continue;
        }

        // Horizontal rule
        if (trimmed === '---') {
          if (inParagraph) { html += '</p>'; inParagraph = false; }
          html += '<hr style="border:none; border-top:1px solid var(--border-light); margin:24px 0;">';
          continue;
        }

        // List items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          if (inParagraph) { html += '</p>'; inParagraph = false; }
          html += '<p style="padding-left:20px; margin-bottom:8px;">• ' + inlineFormat(trimmed.slice(2)) + '</p>';
          continue;
        }

        // Numbered list
        const numberedMatch = trimmed.match(/^(\\d+)\\.\\s/);
        if (numberedMatch) {
          if (inParagraph) { html += '</p>'; inParagraph = false; }
          html += '<p style="padding-left:20px; margin-bottom:8px;">' + numberedMatch[1] + '. ' + inlineFormat(trimmed.slice(numberedMatch[0].length)) + '</p>';
          continue;
        }

        // Tables (already handled above, skip if we see a | line)
        if (trimmed.startsWith('|') || trimmed.startsWith('<table')) {
          if (inParagraph) { html += '</p>'; inParagraph = false; }
          html += trimmed;
          continue;
        }

        // Regular paragraph
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
      // Bold
      text = text.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
      // Italic
      text = text.replace(/\\*(.+?)\\*/g, '<em>$1</em>');
      // Code
      text = text.replace(/\`(.+?)\`/g, '<code style="background:var(--border-light); padding:1px 4px; border-radius:3px; font-size:0.9em;">$1</code>');
      return text;
    }

    // ============================================================
    // INIT
    // ============================================================

    init();
  </script>
</body>
</html>`;
}
