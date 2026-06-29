// ========================================
// AutoReport SaaS - Servidor (MVP Fase 1)
// - Login "Conectar con Google" (OAuth hospedado, multi-cliente)
// - Modo demo automático si no hay credenciales de Google
// - Generar / enviar reportes y programarlos (semanal/mensual/diario)
// ========================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const cron = require('node-cron');

const store = require('./lib/store');
const google = require('./lib/google');
const { generateReportHTML } = require('./lib/report');

const app = express();
const PORT = process.env.PORT || 4000;
const DEMO = !google.isConfigured();

app.use(express.json({ limit: '1mb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);
app.use(express.static(path.join(__dirname, 'public')));

// --- Helpers ---
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  next();
}
function currentUser(req) {
  return req.session.userId ? store.getUser(req.session.userId) : null;
}

// Frecuencias amigables -> expresión cron (lenguaje no técnico en la UI)
const FREQUENCIES = {
  daily: { label: 'Todos los días (9:00 AM)', cron: '0 9 * * *' },
  weekly: { label: 'Cada lunes (8:00 AM)', cron: '0 8 * * 1' },
  monthly: { label: 'El día 1 de cada mes (9:00 AM)', cron: '0 9 1 * *' },
};

// ========================================
// AUTENTICACIÓN
// ========================================
app.get('/auth/google', (req, res) => {
  if (DEMO) {
    // Modo demo: crea un usuario ficticio para poder ver el producto sin setup.
    const id = 'demo-user';
    store.upsertUser({ id, email: 'demo@empresa.com', name: 'Usuario Demo', demo: true });
    req.session.userId = id;
    return res.redirect('/app');
  }
  res.redirect(google.authUrl());
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { tokens, profile } = await google.exchangeCode(req.query.code);
    const id = profile.id;
    store.upsertUser({ id, email: profile.email, name: profile.name, picture: profile.picture, tokens });
    req.session.userId = id;
    res.redirect('/app');
  } catch (e) {
    console.error('OAuth callback error:', e.message);
    res.redirect('/?error=auth');
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ========================================
// API
// ========================================
app.get('/api/me', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.json({ authenticated: false, demo: DEMO });
  res.json({
    authenticated: true,
    demo: Boolean(user.demo) || DEMO,
    email: user.email,
    name: user.name,
    picture: user.picture || null,
    schedules: store.listSchedules(user.id),
    frequencies: FREQUENCIES,
  });
});

// Vista previa del reporte (sin enviar).
app.post('/api/report/preview', requireLogin, async (req, res) => {
  try {
    const cfg = req.body || {};
    const sections = Array.isArray(cfg.sections) ? cfg.sections : [];

    // Si está conectado de verdad y lo pide, enriquece con correos recientes.
    const user = currentUser(req);
    if (cfg.pullEmails && user && user.tokens && !DEMO) {
      const mails = await google.recentEmailSubjects(user.tokens, cfg.emailQuery || 'is:unread', 5);
      if (mails.length) {
        sections.push({
          title: 'Correos recientes',
          content: mails.map((m) => `• ${m.subject} — ${m.from}`).join('\n'),
        });
      }
    } else if (cfg.pullEmails && DEMO) {
      sections.push({
        title: 'Correos recientes (demo)',
        content: '• Reunión de planificación — jefe@empresa.com\n• Avance del proyecto X — equipo@empresa.com',
      });
    }

    const html = generateReportHTML({ ...cfg, sections });
    res.json({ html });
  } catch (e) {
    console.error('preview error:', e.message);
    res.status(500).json({ error: 'No se pudo generar la vista previa' });
  }
});

// Enviar el reporte ahora.
app.post('/api/report/send', requireLogin, async (req, res) => {
  try {
    const cfg = req.body || {};
    const recipients = (cfg.recipients || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!recipients.length) return res.status(400).json({ error: 'Agrega al menos un destinatario' });

    const html = generateReportHTML(cfg);
    const user = currentUser(req);

    if (DEMO || !user.tokens) {
      return res.json({ ok: true, demo: true, sentTo: recipients, message: 'Envío simulado (modo demo).' });
    }
    const messageId = await google.sendEmail(user.tokens, {
      to: recipients, subject: cfg.subject || cfg.title || 'Reporte Ejecutivo', html,
    });
    res.json({ ok: true, messageId, sentTo: recipients });
  } catch (e) {
    console.error('send error:', e.message);
    res.status(500).json({ error: 'No se pudo enviar el reporte' });
  }
});

// Programar un reporte recurrente.
app.post('/api/schedule', requireLogin, (req, res) => {
  const { frequency, config } = req.body || {};
  if (!FREQUENCIES[frequency]) return res.status(400).json({ error: 'Frecuencia no válida' });
  const schedule = {
    id: crypto.randomUUID(),
    userId: req.session.userId,
    frequency,
    cron: FREQUENCIES[frequency].cron,
    config: config || {},
    createdAt: new Date().toISOString(),
  };
  store.addSchedule(schedule);
  registerCron(schedule);
  res.json({ ok: true, schedule });
});

app.delete('/api/schedule/:id', requireLogin, (req, res) => {
  store.removeSchedule(req.params.id, req.session.userId);
  const job = cronJobs.get(req.params.id);
  if (job) { job.stop(); cronJobs.delete(req.params.id); }
  res.json({ ok: true });
});

// ========================================
// PROGRAMADOR (node-cron)
// ========================================
const cronJobs = new Map();

async function runScheduled(schedule) {
  const user = store.getUser(schedule.userId);
  if (!user) return;
  const cfg = schedule.config || {};
  const recipients = (cfg.recipients || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!recipients.length) return;
  const html = generateReportHTML(cfg);
  if (user.demo || !user.tokens) {
    console.log(`[scheduler] (demo) reporte para ${user.email} -> ${recipients.join(', ')}`);
    return;
  }
  try {
    await google.sendEmail(user.tokens, {
      to: recipients, subject: cfg.subject || cfg.title || 'Reporte Ejecutivo', html,
    });
    console.log(`[scheduler] reporte enviado para ${user.email}`);
  } catch (e) {
    console.error(`[scheduler] error para ${user.email}:`, e.message);
  }
}

function registerCron(schedule) {
  if (cronJobs.has(schedule.id)) return;
  const job = cron.schedule(schedule.cron, () => runScheduled(schedule));
  cronJobs.set(schedule.id, job);
}

// Re-registra los reportes programados al arrancar.
store.allSchedules().forEach(registerCron);

// ========================================
// RUTAS DE PÁGINAS
// ========================================
app.get('/app', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 AutoReport SaaS (MVP Fase 1)                          ║
║  🌐 ${(process.env.BASE_URL || `http://localhost:${PORT}`).padEnd(52)}║
║  ${(DEMO ? '🟡 MODO DEMO (sin credenciales de Google)' : '🟢 Google OAuth activo').padEnd(58)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
