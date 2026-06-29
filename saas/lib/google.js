// ========================================
// Wrapper de Google OAuth + Gmail (por usuario).
// Una sola app de Google sirve a todos los clientes del SaaS.
// ========================================

const { google } = require('googleapis');

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

function isConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL || 'http://localhost:4000'}/auth/google/callback`
  );
}

function authUrl() {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

async function exchangeCode(code) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: profile } = await oauth2.userinfo.get();
  return { tokens, profile };
}

function clientForTokens(tokens) {
  const client = oauthClient();
  client.setCredentials(tokens);
  return client;
}

// Lee asuntos de correos recientes (para enriquecer el reporte).
async function recentEmailSubjects(tokens, query = 'is:unread', limit = 5) {
  const auth = clientForTokens(tokens);
  const gmail = google.gmail({ version: 'v1', auth });
  const list = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: limit });
  if (!list.data.messages) return [];
  const out = [];
  for (const m of list.data.messages) {
    const msg = await gmail.users.messages.get({
      userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['Subject', 'From'],
    });
    const headers = msg.data.payload.headers || [];
    out.push({
      subject: (headers.find((h) => h.name === 'Subject') || {}).value || '(sin asunto)',
      from: (headers.find((h) => h.name === 'From') || {}).value || '',
    });
  }
  return out;
}

// Envía el reporte por Gmail del propio usuario.
async function sendEmail(tokens, { to, subject, html }) {
  const auth = clientForTokens(tokens);
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = Buffer.from(
    [
      `To: ${to.join(', ')}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
    ].join('\r\n')
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  return res.data.id;
}

module.exports = { isConfigured, authUrl, exchangeCode, recentEmailSubjects, sendEmail, SCOPES };
