// ========================================
// Almacén simple en JSON (MVP).
// En producción se reemplaza por una base de datos real (Postgres, etc.).
// Guarda usuarios (con sus tokens de Google) y sus reportes programados.
// ========================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: {}, schedules: [] };
  }
}

function save(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- Usuarios ---
function getUser(id) {
  return load().users[id] || null;
}

function upsertUser(user) {
  const db = load();
  db.users[user.id] = { ...(db.users[user.id] || {}), ...user };
  save(db);
  return db.users[user.id];
}

// Busca un usuario por su stripeCustomerId (para webhooks de Stripe).
function findUserByStripeCustomer(customerId) {
  const users = load().users;
  return Object.values(users).find((u) => u.stripeCustomerId === customerId) || null;
}

// --- Lista de espera (validación de demanda) ---
function addWaitlist(entry) {
  const db = load();
  db.waitlist = db.waitlist || [];
  if (!db.waitlist.some((w) => w.email === entry.email)) {
    db.waitlist.push(entry);
    save(db);
  }
  return entry;
}

function listWaitlist() {
  return load().waitlist || [];
}

// --- Reportes programados ---
function listSchedules(userId) {
  return load().schedules.filter((s) => s.userId === userId);
}

function allSchedules() {
  return load().schedules;
}

function addSchedule(schedule) {
  const db = load();
  db.schedules.push(schedule);
  save(db);
  return schedule;
}

function removeSchedule(id, userId) {
  const db = load();
  db.schedules = db.schedules.filter((s) => !(s.id === id && s.userId === userId));
  save(db);
}

module.exports = {
  getUser,
  upsertUser,
  findUserByStripeCustomer,
  addWaitlist,
  listWaitlist,
  listSchedules,
  allSchedules,
  addSchedule,
  removeSchedule,
};
