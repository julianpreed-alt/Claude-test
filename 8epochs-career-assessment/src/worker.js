import { handleApiRequest } from './api/router.js';
import { landingPage } from './pages/landing.js';
import { preparePage } from './pages/prepare.js';
import { dashboardPage } from './pages/dashboard.js';
import { chatPage } from './pages/chat.js';
import { cvUploadPage } from './pages/cv-upload.js';
import { intakePage } from './pages/intake.js';
import { questionnairePage } from './pages/questionnaire.js';
import { reportPage } from './pages/report.js';
import { termsPage } from './pages/terms.js';
import { privacyPage } from './pages/privacy.js';
import { consentPage } from './pages/consent.js';
import { accountPage } from './pages/account.js';
import { loginPage } from './pages/login.js';
import { authCallbackPage } from './pages/auth-callback.js';
import { adminPage } from './pages/admin.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(request),
      });
    }

    // API routes
    if (path.startsWith('/api/')) {
      const response = await handleApiRequest(request, env, ctx);
      // Add CORS headers to API responses
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders(request))) {
        headers.set(key, value);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    // Frontend pages
    const htmlHeaders = { 'Content-Type': 'text/html;charset=utf-8' };
    const pageMap = {
      '/': landingPage,
      '/career-assessment': landingPage,
      '/career-assessment/prepare': preparePage,
      '/career-assessment/dashboard': dashboardPage,
      '/career-assessment/chat': chatPage,
      '/career-assessment/cv-upload': cvUploadPage,
      '/career-assessment/intake': intakePage,
      '/career-assessment/questionnaire': questionnairePage,
      '/career-assessment/report': reportPage,
      '/career-assessment/terms': termsPage,
      '/career-assessment/privacy': privacyPage,
      '/career-assessment/consent': consentPage,
      '/career-assessment/account': accountPage,
      '/auth/login': loginPage,
      '/auth/callback': authCallbackPage,
      '/admin': adminPage,
    };

    const pageFn = pageMap[path];
    if (pageFn) {
      return new Response(pageFn(env), { headers: htmlHeaders });
    }

    return new Response(notFoundPage(), { headers: htmlHeaders, status: 404 });
  },
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Not Found — 8epochs</title>
  <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#FAF8F4;color:#1A1814;}
  .c{text-align:center}.c h1{font-size:4rem;font-weight:300;margin:0 0 8px;color:#B5AEA1}.c p{color:#8A8378;margin:0 0 24px}
  .c a{color:#2D4A3E;text-decoration:none;border-bottom:1px solid #2D4A3E}</style>
</head>
<body><div class="c"><h1>404</h1><p>Page not found.</p><a href="/career-assessment">Back to 8epochs</a></div></body>
</html>`;
}
