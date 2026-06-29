// ========================================
// Wrapper de Google OAuth + Gmail/Drive/Sheets (por usuario).
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

// Decodifica el cuerpo de texto plano de un mensaje de Gmail.
function decodeBody(payload) {
  if (!payload) return '';
  if (payload.parts) {
    const text = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (text && text.body && text.body.data) {
      return Buffer.from(text.body.data, 'base64').toString('utf-8');
    }
    // buscar recursivamente (multipart anidado)
    for (const p of payload.parts) {
      const nested = decodeBody(p);
      if (nested) return nested;
    }
  }
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  return '';
}

// Extrae correos reales (asunto + remitente + fecha + extracto del cuerpo).
// query por defecto: última semana. Pensado para reportes "con data dura".
async function recentEmails(tokens, query = 'newer_than:7d', limit = 15) {
  const auth = clientForTokens(tokens);
  const gmail = google.gmail({ version: 'v1', auth });
  const list = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: Math.min(limit, 50) });
  if (!list.data.messages) return [];
  const out = [];
  for (const m of list.data.messages.slice(0, limit)) {
    const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
    const headers = msg.data.payload.headers || [];
    const h = (name) => (headers.find((x) => x.name === name) || {}).value || '';
    const body = decodeBody(msg.data.payload).replace(/\s+/g, ' ').trim();
    out.push({
      subject: h('Subject') || '(sin asunto)',
      from: h('From'),
      date: h('Date'),
      // Cuerpo amplio: estados de cuenta / correos con desglose necesitan
      // más texto para que la IA extraiga montos, conceptos y recurrentes.
      snippet: body.slice(0, 1500),
    });
  }
  return out;
}

// Compatibilidad: versión que solo trae asunto + remitente.
async function recentEmailSubjects(tokens, query = 'is:unread', limit = 5) {
  const mails = await recentEmails(tokens, query, limit);
  return mails.map((m) => ({ subject: m.subject, from: m.from }));
}

// Extrae el ID de un documento/hoja desde una URL o lo devuelve tal cual.
function parseId(idOrUrl = '') {
  const m = String(idOrUrl).match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : String(idOrUrl).trim();
}

// Lee un Google Doc como texto plano.
async function readDriveDoc(tokens, idOrUrl) {
  const auth = clientForTokens(tokens);
  const drive = google.drive({ version: 'v3', auth });
  const fileId = parseId(idOrUrl);
  const meta = await drive.files.get({ fileId, fields: 'name, mimeType' });
  let text = '';
  if (meta.data.mimeType === 'application/vnd.google-apps.document') {
    const res = await drive.files.export({ fileId, mimeType: 'text/plain' });
    text = String(res.data);
  } else {
    text = '[Tipo de archivo no soportado para extracción de texto]';
  }
  return { name: meta.data.name, text: text.replace(/\s+\n/g, '\n').slice(0, 4000) };
}

// Lee valores de una hoja de cálculo y los resume como texto.
async function readSheet(tokens, idOrUrl, range = 'A1:Z100') {
  const auth = clientForTokens(tokens);
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = parseId(idOrUrl);
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'properties.title' });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = res.data.values || [];
  const text = values
    .slice(0, 30)
    .map((row) => row.join(' | '))
    .join('\n');
  return { title: meta.data.properties.title, text: text.slice(0, 4000) };
}

// Envía el reporte por Gmail del propio usuario.
async function sendEmail(tokens, { to, subject, html }) {
  const auth = clientForTokens(tokens);
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = Buffer.from(
    [`To: ${to.join(', ')}`, `Subject: ${subject}`, 'Content-Type: text/html; charset=utf-8', '', html].join('\r\n')
  )
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  return res.data.id;
}

module.exports = {
  isConfigured,
  authUrl,
  exchangeCode,
  recentEmails,
  recentEmailSubjects,
  readDriveDoc,
  readSheet,
  parseId,
  sendEmail,
  SCOPES,
};
