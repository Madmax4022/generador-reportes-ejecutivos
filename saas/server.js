// ========================================
// AutoReport SaaS - Servidor (MVP Fases 1 + 3)
// - Login "Conectar con Google" (OAuth hospedado, multi-cliente)
// - Prueba gratis de 14 días + suscripción Stripe (modo demo si no hay claves)
// - Generar / enviar reportes y programarlos (semanal/mensual/diario)
// - Lista de espera para validar demanda
// ========================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const cron = require('node-cron');

const store = require('./lib/store');
const google = require('./lib/google');
const billing = require('./lib/billing');
const ai = require('./lib/ai');
const { generateReportHTML } = require('./lib/report');

const app = express();
const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const DEMO = !google.isConfigured();
const BILLING_DEMO = !billing.isConfigured();

// --- Webhook de Stripe: necesita el body crudo, así que va ANTES de express.json ---
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  if (BILLING_DEMO) return res.json({ received: true, demo: true });
  let event;
  try {
    event = billing.verifyEvent(req.body, req.headers['stripe-signature']);
  } catch (e) {
    console.error('Webhook signature error:', e.message);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const user = store.getUser(s.client_reference_id);
    if (user) store.upsertUser({ id: user.id, plan: 'active', stripeCustomerId: s.customer, stripeSubscriptionId: s.subscription });
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const user = store.findUserByStripeCustomer(sub.customer);
    if (user) store.upsertUser({ id: user.id, plan: 'canceled' });
  }
  res.json({ received: true });
});

const PROD = process.env.NODE_ENV === 'production';
// Detrás del proxy HTTPS de Render/Railway: necesario para cookies seguras.
if (PROD) app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, secure: PROD, sameSite: 'lax' },
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
// Da de alta valores por defecto (prueba de 14 días) si el usuario es nuevo.
function ensureDefaults(user) {
  if (!user.trialEndsAt) {
    user = store.upsertUser({
      id: user.id,
      plan: user.plan || 'trial',
      trialEndsAt: new Date(Date.now() + billing.TRIAL_DAYS * 86400000).toISOString(),
    });
  }
  return user;
}
// Bloquea acciones de pago (enviar/programar) si la prueba expiró y no hay suscripción.
function requireAccess(req, res, next) {
  const user = currentUser(req);
  const st = billing.accessStatus(user);
  if (!st.allowed) {
    return res.status(402).json({ error: 'Tu prueba terminó. Suscríbete para seguir enviando reportes.', needsUpgrade: true });
  }
  next();
}

const FREQUENCIES = {
  daily: { label: 'Todos los días (9:00 AM)', cron: '0 9 * * *' },
  weekly: { label: 'Cada lunes (8:00 AM)', cron: '0 8 * * 1' },
  monthly: { label: 'El día 1 de cada mes (9:00 AM)', cron: '0 9 1 * *' },
};

// Si el usuario pidió IA, enriquece la config con resumen/prioridades/
// recomendaciones generadas por Claude (o contenido demo si no hay API key).
// Resiliente: si la IA falla, devuelve la config sin cambios.
async function applyAI(cfg, sections, topics) {
  if (!cfg || !cfg.useAI) return cfg;
  const input = {
    title: cfg.title,
    period: cfg.period,
    summary: cfg.summary,
    sections: sections || [],
    emails: cfg.emails || [],
    topics: topics || [],
  };
  try {
    const content = ai.isConfigured()
      ? await ai.generateReportContent(input)
      : ai.demoReportContent(input);
    return {
      ...cfg,
      summary: content.executiveSummary || cfg.summary,
      topicSections: content.topics || null,
      priorities: content.priorities,
      recommendations: content.recommendations,
      includePriorities: true,
      includeRecommendations: true,
      aiGenerated: true,
    };
  } catch (e) {
    console.error('AI generation failed, falling back:', e.message);
    return cfg;
  }
}

// Recopila datos REALES del usuario (correos de la semana, Drive, Sheets).
// En modo demo (o sin cuenta conectada) devuelve datos de ejemplo realistas.
async function gatherSources(user, cfg, topics) {
  const sections = Array.isArray(cfg.sections) ? [...cfg.sections] : [];
  let emails = [];
  const real = user && user.tokens && !DEMO;

  if (cfg.pullEmails) {
    if (real) {
      // Filtra a nivel Gmail por los temas: newer_than:7d ("Canon" OR "CCAP")
      let q = cfg.emailQuery || 'newer_than:7d';
      if (topics && topics.length) {
        q += ' (' + topics.map((t) => `"${t}"`).join(' OR ') + ')';
      }
      emails = await google.recentEmails(user.tokens, q, 20);
    } else {
      emails = [
        { subject: 'Cierre de venta — Cliente A', from: 'ventas@empresa.com', date: 'lun', snippet: 'Se concretó la venta del plan anual con el Cliente A por $12,000.' },
        { subject: 'Incidencia soporte #482', from: 'soporte@empresa.com', date: 'mar', snippet: 'Dos clientes reportaron lentitud en el panel; se escaló a ingeniería.' },
        { subject: 'Lanzamiento web nueva', from: 'marketing@empresa.com', date: 'jue', snippet: 'La nueva landing está en producción; +18% de conversión la primera semana.' },
      ];
    }
    if (emails.length) {
      sections.push({ title: 'Correos del período', content: emails.map((m) => `• ${m.subject} — ${m.from}`).join('\n') });
    }
  }

  if (cfg.driveId) {
    if (real) {
      try {
        const doc = await google.readDriveDoc(user.tokens, cfg.driveId);
        sections.push({ title: `Documento: ${doc.name}`, content: doc.text });
      } catch (e) { console.error('drive read:', e.message); }
    } else {
      sections.push({ title: 'Documento (demo): Plan semanal', content: 'Objetivos: cerrar 3 ventas, publicar la web, reducir tickets de soporte.' });
    }
  }

  if (cfg.sheetId) {
    if (real) {
      try {
        const sh = await google.readSheet(user.tokens, cfg.sheetId, cfg.sheetRange || 'A1:Z100');
        sections.push({ title: `Hoja: ${sh.title}`, content: sh.text });
      } catch (e) { console.error('sheet read:', e.message); }
    } else {
      sections.push({ title: 'Hoja (demo): KPIs', content: 'Métrica | Valor\nVentas | 3\nTickets | 5\nConversión | 18%' });
    }
  }

  return { sections, emails };
}

// Recopila datos -> aplica IA -> devuelve el HTML del reporte.
async function buildReport(user, cfg) {
  const topics = (cfg.topics || '').split(',').map((s) => s.trim()).filter(Boolean);
  const { sections, emails } = await gatherSources(user, cfg, topics);
  const finalCfg = await applyAI({ ...cfg, emails }, sections, topics);
  return generateReportHTML({ ...finalCfg, sections });
}

// ========================================
// AUTENTICACIÓN
// ========================================
app.get('/auth/google', (req, res) => {
  if (DEMO) {
    const id = 'demo-user';
    let user = store.upsertUser({ id, email: 'demo@empresa.com', name: 'Usuario Demo', demo: true });
    ensureDefaults(user);
    req.session.userId = id;
    return res.redirect('/app');
  }
  res.redirect(google.authUrl());
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { tokens, profile } = await google.exchangeCode(req.query.code);
    let user = store.upsertUser({ id: profile.id, email: profile.email, name: profile.name, picture: profile.picture, tokens });
    ensureDefaults(user);
    req.session.userId = profile.id;
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
// LISTA DE ESPERA (pública - validación de demanda)
// ========================================
app.post('/api/waitlist', (req, res) => {
  const email = (req.body.email || '').trim();
  if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Email no válido' });
  store.addWaitlist({ email, at: new Date().toISOString() });
  res.json({ ok: true });
});

// ========================================
// API
// ========================================
app.get('/api/me', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.json({ authenticated: false, demo: DEMO });
  const st = billing.accessStatus(user);
  res.json({
    authenticated: true,
    demo: Boolean(user.demo) || DEMO,
    email: user.email,
    name: user.name,
    picture: user.picture || null,
    schedules: store.listSchedules(user.id),
    frequencies: FREQUENCIES,
    billing: {
      plan: user.plan || 'trial',
      status: st.status,
      trialDaysLeft: st.trialDaysLeft || 0,
      billingDemo: BILLING_DEMO,
    },
    ai: { available: true, demo: !ai.isConfigured(), model: ai.MODEL },
  });
});

// Suscribirse (Stripe Checkout, o simulado en demo).
app.post('/api/billing/checkout', requireLogin, async (req, res) => {
  const user = currentUser(req);
  if (BILLING_DEMO) {
    store.upsertUser({ id: user.id, plan: 'active' });
    return res.json({ ok: true, demo: true, message: 'Suscripción activada (modo demo).' });
  }
  try {
    const url = await billing.createCheckoutUrl(user, BASE_URL);
    res.json({ ok: true, url });
  } catch (e) {
    console.error('checkout error:', e.message);
    res.status(500).json({ error: 'No se pudo iniciar el pago' });
  }
});

// Vista previa (permitida durante la prueba; no requiere suscripción activa).
app.post('/api/report/preview', requireLogin, async (req, res) => {
  try {
    const html = await buildReport(currentUser(req), req.body || {});
    res.json({ html });
  } catch (e) {
    console.error('preview error:', e.message);
    res.status(500).json({ error: 'No se pudo generar la vista previa' });
  }
});

// Enviar ahora (requiere prueba vigente o suscripción).
app.post('/api/report/send', requireLogin, requireAccess, async (req, res) => {
  try {
    const cfg = req.body || {};
    const recipients = (cfg.recipients || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!recipients.length) return res.status(400).json({ error: 'Agrega al menos un destinatario' });
    const user = currentUser(req);
    const html = await buildReport(user, cfg);
    if (DEMO || !user.tokens) return res.json({ ok: true, demo: true, sentTo: recipients, message: 'Envío simulado (modo demo).' });
    const messageId = await google.sendEmail(user.tokens, { to: recipients, subject: cfg.subject || cfg.title || 'Reporte Ejecutivo', html });
    res.json({ ok: true, messageId, sentTo: recipients });
  } catch (e) {
    console.error('send error:', e.message);
    res.status(500).json({ error: 'No se pudo enviar el reporte' });
  }
});

// Programar (requiere prueba vigente o suscripción).
app.post('/api/schedule', requireLogin, requireAccess, (req, res) => {
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
  if (!billing.accessStatus(user).allowed) return; // no enviar si no tiene acceso
  const cfg = schedule.config || {};
  const recipients = (cfg.recipients || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!recipients.length) return;
  const html = await buildReport(user, cfg);
  if (user.demo || !user.tokens) {
    console.log(`[scheduler] (demo) reporte para ${user.email} -> ${recipients.join(', ')}`);
    return;
  }
  try {
    await google.sendEmail(user.tokens, { to: recipients, subject: cfg.subject || cfg.title || 'Reporte Ejecutivo', html });
    console.log(`[scheduler] reporte enviado para ${user.email}`);
  } catch (e) {
    console.error(`[scheduler] error para ${user.email}:`, e.message);
  }
}

function registerCron(schedule) {
  if (cronJobs.has(schedule.id)) return;
  cronJobs.set(schedule.id, cron.schedule(schedule.cron, () => runScheduled(schedule)));
}

store.allSchedules().forEach(registerCron);

// ========================================
// PÁGINAS
// ========================================
app.get('/app', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 AutoReport SaaS (MVP Fases 1 + 3)                     ║
║  🌐 ${BASE_URL.padEnd(56)}║
║  ${(DEMO ? '🟡 Google: MODO DEMO' : '🟢 Google: OAuth activo').padEnd(58)}║
║  ${(BILLING_DEMO ? '🟡 Stripe: MODO DEMO' : '🟢 Stripe: activo').padEnd(58)}║
║  ${(ai.isConfigured() ? '🟢 IA (Claude): activa' : '🟡 IA (Claude): MODO DEMO').padEnd(58)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
