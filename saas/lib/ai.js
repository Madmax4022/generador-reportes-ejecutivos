// ========================================
// Generación del reporte con IA (Claude / Anthropic).
// Igual que Google y Stripe: si NO hay ANTHROPIC_API_KEY, funciona en
// "modo demo" (contenido de ejemplo) para poder mostrar el flujo sin setup.
//
// SDK oficial: @anthropic-ai/sdk. Modelo por defecto: claude-opus-4-8
// (el modelo más capaz actual). Usa "structured outputs" para que Claude
// devuelva un objeto de reporte limpio en vez de texto libre.
// ========================================

let AnthropicLib = null;
try {
  // Carga perezosa; el paquete puede exportar como default en CJS.
  const mod = require('@anthropic-ai/sdk');
  AnthropicLib = mod && mod.default ? mod.default : mod;
} catch (e) {
  AnthropicLib = null;
}

// Modelo por defecto: Sonnet 4.6 (buena calidad, ~40% más barato que Opus).
// Para máximo ahorro: ANTHROPIC_MODEL=claude-haiku-4-5 (~80% más barato).
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY && AnthropicLib);
}

// Esquema del reporte que Claude debe devolver (structured outputs).
const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    executiveSummary: { type: 'string' },
    priorities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tema: { type: 'string' },
          urgencia: { type: 'string', enum: ['Alta', 'Media', 'Baja'] },
          impacto: { type: 'string', enum: ['Alto', 'Medio', 'Bajo'] },
        },
        required: ['tema', 'urgencia', 'impacto'],
        additionalProperties: false,
      },
    },
    recommendations: { type: 'array', items: { type: 'string' } },
  },
  required: ['executiveSummary', 'priorities', 'recommendations'],
  additionalProperties: false,
};

function buildPrompt({ title, period, summary, sections = [], emails = [] }) {
  let material = `Título del reporte: ${title || 'Reporte Ejecutivo'}\n`;
  if (period) material += `Período: ${period}\n`;
  if (summary) material += `\nNotas del usuario:\n${summary}\n`;
  for (const s of sections) {
    if (s && s.title) material += `\n${s.title}:\n${s.content || ''}\n`;
  }
  if (emails.length) {
    material +=
      `\nCorreos del período:\n` +
      emails
        .map((m) => {
          let line = `- [${m.date || ''}] ${m.subject} — ${m.from}`;
          if (m.snippet) line += `\n  Extracto: ${m.snippet}`;
          return line;
        })
        .join('\n');
  }
  return (
    `A partir del siguiente material en bruto, redacta un reporte ejecutivo para jefatura.\n\n` +
    `${material}\n\n` +
    `Devuelve:\n` +
    `- executiveSummary: 2-3 frases claras y profesionales en español.\n` +
    `- priorities: 3-5 temas con su urgencia (Alta/Media/Baja) e impacto (Alto/Medio/Bajo).\n` +
    `- recommendations: 3-5 acciones concretas.\n` +
    `Sé concreto y conciso; no inventes datos que no estén en el material.`
  );
}

// Llama a Claude de verdad (requiere ANTHROPIC_API_KEY).
async function generateReportContent(input) {
  const client = new AnthropicLib(); // lee ANTHROPIC_API_KEY del entorno
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system:
      'Eres un analista que redacta reportes ejecutivos claros y accionables para ' +
      'jefatura. Escribe en español, en tono profesional y directo.',
    output_config: { format: { type: 'json_schema', schema: REPORT_SCHEMA } },
    messages: [{ role: 'user', content: buildPrompt(input) }],
  });
  const text = (response.content.find((b) => b.type === 'text') || {}).text || '{}';
  return JSON.parse(text);
}

// Contenido de ejemplo cuando no hay API key (para demostrar el flujo).
function demoReportContent(input = {}) {
  const base = (input.summary || '').trim();
  return {
    executiveSummary:
      (base ? base + ' ' : '') +
      'Este resumen fue redactado automáticamente por IA a partir del material proporcionado, ' +
      'destacando los avances y puntos de decisión más relevantes del período.',
    priorities: [
      { tema: 'Cerrar pendientes prioritarios del período', urgencia: 'Alta', impacto: 'Alto' },
      { tema: 'Dar seguimiento a métricas clave', urgencia: 'Media', impacto: 'Alto' },
      { tema: 'Revisar riesgos identificados', urgencia: 'Media', impacto: 'Medio' },
    ],
    recommendations: [
      'Priorizar las acciones de alta urgencia esta semana.',
      'Comunicar avances a las áreas involucradas.',
      'Agendar una revisión de seguimiento.',
    ],
  };
}

module.exports = { isConfigured, generateReportContent, demoReportContent, MODEL };
