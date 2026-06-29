// ========================================
// Facturación con Stripe (Fase 3).
// Igual que con Google: si NO hay claves de Stripe, funciona en "modo demo"
// (la suscripción se simula) para poder mostrar el flujo completo sin setup.
// ========================================

const TRIAL_DAYS = 14;

function isConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

function client() {
  // Carga perezosa: solo requiere 'stripe' si está configurado.
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

async function createCheckoutUrl(user, baseUrl) {
  const stripe = client();
  const sessionConfig = {
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    client_reference_id: user.id,
    success_url: `${baseUrl}/app?billing=success`,
    cancel_url: `${baseUrl}/app?billing=cancel`,
    subscription_data: { trial_period_days: TRIAL_DAYS },
  };
  if (user.email) sessionConfig.customer_email = user.email;
  const session = await stripe.checkout.sessions.create(sessionConfig);
  return session.url;
}

function verifyEvent(rawBody, signature) {
  const stripe = client();
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

// ¿El usuario tiene acceso? (suscripción activa o prueba vigente)
function accessStatus(user) {
  const now = Date.now();
  if (user.plan === 'active') return { allowed: true, status: 'active' };
  if (user.trialEndsAt && new Date(user.trialEndsAt).getTime() > now) {
    const daysLeft = Math.ceil((new Date(user.trialEndsAt).getTime() - now) / 86400000);
    return { allowed: true, status: 'trialing', trialDaysLeft: daysLeft };
  }
  return { allowed: false, status: 'expired' };
}

module.exports = { isConfigured, createCheckoutUrl, verifyEvent, accessStatus, TRIAL_DAYS };
