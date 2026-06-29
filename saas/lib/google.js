// ========================================
// Wrapper de Google OAuth + Gmail/Drive/Sheets (por usuario).
// Una sola app de Google sirve a todos los clientes del SaaS.
// ========================================

const { google } = require('googleapis');

// Extractor de texto de PDF (opcional). Si está, leemos el PDF localmente
// (0 tokens) y solo recurrimos a la visión de Claude para PDFs escaneados.
let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  pdfParse = null;
}
// Mínimo de caracteres para considerar que el PDF tiene capa de texto útil.
const PDF_TEXT_MIN = 80;
// Tope de texto por PDF (acota tokens en estados de cuenta largos).
const PDF_TEXT_MAX = 12000;

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

// Busca recursivamente los adjuntos PDF dentro del payload de un mensaje.
function findPdfParts(payload, acc = []) {
  if (!payload) return acc;
  const fn = payload.filename || '';
  const isPdf = payload.mimeType === 'application/pdf' || /\.pdf$/i.test(fn);
  if (isPdf && payload.body && payload.body.attachmentId) {
    acc.push({ filename: fn || 'documento.pdf', attachmentId: payload.body.attachmentId });
  }
  if (Array.isArray(payload.parts)) {
    for (const p of payload.parts) findPdfParts(p, acc);
  }
  return acc;
}

// Extrae correos reales (asunto + remitente + fecha + extracto del cuerpo).
// query por defecto: última semana. Pensado para reportes "con data dura".
// opts.includePdfs: además baja los PDFs adjuntos (base64) para que Claude
// los lea (estados de cuenta, facturas). Con tope de cantidad y tamaño.
async function recentEmails(tokens, query = 'newer_than:7d', limit = 15, opts = {}) {
  const { includePdfs = false, maxPdfs = 3, maxPdfBytes = 8 * 1024 * 1024 } = opts;
  const auth = clientForTokens(tokens);
  const gmail = google.gmail({ version: 'v1', auth });
  const list = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: Math.min(limit, 50) });
  if (!list.data.messages) return [];
  const out = [];
  let pdfBudget = maxPdfs;
  for (const m of list.data.messages.slice(0, limit)) {
    const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
    const payload = msg.data.payload;
    const headers = payload.headers || [];
    const h = (name) => (headers.find((x) => x.name === name) || {}).value || '';
    const body = decodeBody(payload).replace(/\s+/g, ' ').trim();
    const entry = {
      subject: h('Subject') || '(sin asunto)',
      from: h('From'),
      date: h('Date'),
      // Cuerpo amplio: estados de cuenta / correos con desglose necesitan
      // más texto para que la IA extraiga montos, conceptos y recurrentes.
      snippet: body.slice(0, 1500),
    };
    if (includePdfs && pdfBudget > 0) {
      for (const p of findPdfParts(payload)) {
        if (pdfBudget <= 0) break;
        try {
          const att = await gmail.users.messages.attachments.get({ userId: 'me', messageId: m.id, id: p.attachmentId });
          const buf = Buffer.from(att.data.data || '', 'base64url');
          if (!buf.length || buf.length > maxPdfBytes) continue;
          // Intento barato: extraer el texto del PDF localmente (0 tokens).
          let text = '';
          if (pdfParse) {
            try {
              const parsed = await pdfParse(buf);
              text = (parsed.text || '').replace(/\n{3,}/g, '\n\n').trim();
            } catch (e) {
              text = '';
            }
          }
          entry.pdfs = entry.pdfs || [];
          if (text.length >= PDF_TEXT_MIN) {
            // PDF digital: mandamos el texto (mucho más barato que la imagen).
            entry.pdfs.push({ filename: p.filename, text: text.slice(0, PDF_TEXT_MAX) });
          } else {
            // PDF escaneado/sin texto: lo lee Claude por visión (base64).
            entry.pdfs.push({ filename: p.filename, data: buf.toString('base64') });
          }
          pdfBudget--;
        } catch (e) {
          console.error('pdf attachment:', e.message);
        }
      }
    }
    out.push(entry);
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
