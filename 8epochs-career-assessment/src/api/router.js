import { handleAuthCheckEmail } from './auth-routes.js';
import { handleDashboard } from './dashboard-routes.js';
import {
  handleCreateAssessment,
  handleSaveIntake,
  handleSaveQuestionnaire,
  handleGetAssessment,
  handleGetMessages,
  handleGetReport,
  handleStartPhase2,
} from './assessment-routes.js';
import { handleChat } from './chat-routes.js';
import { handleCvUpload, handleCvSkip } from './cv-routes.js';
import {
  handleRecordConsent,
  handleConsentStatus,
  handleDeleteData,
  handleDeleteAccount,
} from './consent-routes.js';
import {
  handleAdminGetUsers,
  handleAdminAddUsers,
  handleAdminDeleteUser,
  handleAdminGrantCredits,
  handleAdminRevokeCredit,
  handleAdminGetAssessments,
  handleAdminGetStats,
} from './admin-routes.js';

export async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // ---- Auth routes ----
    if (path === '/api/auth/check-email' && method === 'POST') {
      return handleAuthCheckEmail(request, env);
    }

    // ---- Dashboard ----
    if (path === '/api/dashboard' && method === 'GET') {
      return handleDashboard(request, env);
    }

    // ---- Assessment routes ----
    if (path === '/api/assessment/create' && method === 'POST') {
      return handleCreateAssessment(request, env);
    }

    // PUT /api/assessment/:id/intake
    const intakeMatch = path.match(/^\/api\/assessment\/([\w-]+)\/intake$/);
    if (intakeMatch && method === 'PUT') {
      return handleSaveIntake(request, env, intakeMatch[1]);
    }

    // PUT /api/assessment/:id/questionnaire
    const questionnaireMatch = path.match(/^\/api\/assessment\/([\w-]+)\/questionnaire$/);
    if (questionnaireMatch && method === 'PUT') {
      return handleSaveQuestionnaire(request, env, questionnaireMatch[1]);
    }

    // GET /api/assessment/:id
    const assessmentMatch = path.match(/^\/api\/assessment\/([\w-]+)$/);
    if (assessmentMatch && method === 'GET') {
      return handleGetAssessment(request, env, assessmentMatch[1]);
    }

    // GET /api/assessment/:id/messages
    const messagesMatch = path.match(/^\/api\/assessment\/([\w-]+)\/messages$/);
    if (messagesMatch && method === 'GET') {
      return handleGetMessages(request, env, messagesMatch[1]);
    }

    // GET /api/assessment/:id/report/phase1
    const reportMatch = path.match(/^\/api\/assessment\/([\w-]+)\/report\/phase(\d)$/);
    if (reportMatch && method === 'GET') {
      return handleGetReport(request, env, reportMatch[1], parseInt(reportMatch[2]));
    }

    // POST /api/chat
    if (path === '/api/chat' && method === 'POST') {
      return handleChat(request, env);
    }

    // POST /api/assessment/:id/cv
    const cvUploadMatch = path.match(/^\/api\/assessment\/([\w-]+)\/cv$/);
    if (cvUploadMatch && method === 'POST') {
      return handleCvUpload(request, env, cvUploadMatch[1]);
    }

    // POST /api/assessment/:id/cv-skip
    const cvSkipMatch = path.match(/^\/api\/assessment\/([\w-]+)\/cv-skip$/);
    if (cvSkipMatch && method === 'POST') {
      return handleCvSkip(request, env, cvSkipMatch[1]);
    }

    // POST /api/assessment/:id/start-phase2
    const phase2Match = path.match(/^\/api\/assessment\/([\w-]+)\/start-phase2$/);
    if (phase2Match && method === 'POST') {
      return handleStartPhase2(request, env, phase2Match[1]);
    }

    // ---- Consent routes ----
    if (path === '/api/consent' && method === 'POST') {
      return handleRecordConsent(request, env);
    }
    if (path === '/api/consent/status' && method === 'GET') {
      return handleConsentStatus(request, env);
    }

    // ---- Account management routes ----
    if (path === '/api/account/delete-data' && method === 'POST') {
      return handleDeleteData(request, env);
    }
    if (path === '/api/account/delete' && method === 'POST') {
      return handleDeleteAccount(request, env);
    }

    // ---- Admin routes ----
    if (path === '/api/admin/users' && method === 'GET') {
      return handleAdminGetUsers(request, env);
    }
    if (path === '/api/admin/users' && method === 'POST') {
      return handleAdminAddUsers(request, env);
    }
    if (path.match(/^\/api\/admin\/users\/[\w-]+$/) && method === 'DELETE') {
      const userId = path.split('/').pop();
      return handleAdminDeleteUser(request, env, userId);
    }
    if (path === '/api/admin/credits' && method === 'POST') {
      return handleAdminGrantCredits(request, env);
    }
    if (path.match(/^\/api\/admin\/credits\/[\w-]+$/) && method === 'DELETE') {
      const creditId = path.split('/').pop();
      return handleAdminRevokeCredit(request, env, creditId);
    }
    if (path === '/api/admin/assessments' && method === 'GET') {
      return handleAdminGetAssessments(request, env);
    }
    if (path === '/api/admin/stats' && method === 'GET') {
      return handleAdminGetStats(request, env);
    }

    // ---- 404 ----
    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
