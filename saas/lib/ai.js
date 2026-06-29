// ========================================
// Generación del reporte con IA (Claude / Anthropic).
// Igual que Google y Stripe: si NO hay ANTHROPIC_API_KEY, funciona en
// "modo demo" (contenido de ejemplo) para poder mostrar el flujo sin setup.
//
// SDK oficial: @anthropic-ai/sdk. Modelo por defecto: claude-sonnet-4-6
// (buena calidad y más barato; configurable con ANTHROPIC_MODEL). Usa
// "structured outputs" para que Claude devuelva un objeto de reporte limpio.
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
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          summary: { type: 'string' },
          nextSteps: { type: 'string' },
          // Tabla opcional: úsala cuando el usuario pida datos organizados
          // (gastos, montos, fechas, recurrentes, etc.). Si no aplica, omítela.
          table: {
            type: 'object',
            properties: {
              caption: { type: 'string' },
              headers: { type: 'array', items: { type: 'string' } },
              rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
            },
            required: ['headers', 'rows'],
            additionalProperties: false,
          },
        },
        required: ['topic', 'summary', 'nextSteps'],
        additionalProperties: false,
      },
    },
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
  required: ['executiveSummary', 'topics', 'priorities', 'recommendations'],
  additionalProperties: false,
};

function buildPrompt({ title, period, summary, sections = [], emails = [], topics = [], instructions = '', pdfs = [] }) {
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
  if (pdfs.length) {
    material +=
      `\n\nDocumentos PDF adjuntos a los correos (${pdfs.length}): ` +
      pdfs.map((p) => p.filename).join(', ') +
      `.\nLee su contenido completo (pueden ser estados de cuenta, facturas o ` +
      `tablas) y trátalo como FUENTE PRINCIPAL de datos duros.`;
  }
  let focus = '';
  if (topics.length) {
    focus =
      `\n\nIMPORTANTE — el reporte debe enfocarse SOLO en estos temas: ${topics.join(', ')}.\n` +
      `- Ignora por completo cualquier correo o dato que NO tenga que ver con esos temas ` +
      `(publicidad, promociones, asuntos ajenos). NO los menciones.\n` +
      `- En "topics", crea UNA entrada por cada tema solicitado (${topics.join(', ')}), con: ` +
      `'topic' (el nombre del tema), 'summary' (qué pasó esta semana sobre ese tema, según el material) ` +
      `y 'nextSteps' (pendientes/seguimiento). Si no hay nada de un tema, dilo en 'summary'.`;
  } else {
    focus = `\n\nEn "topics" agrupa los asuntos principales (2-5) con su resumen y próximos pasos.`;
  }
  let guide = '';
  if (instructions && instructions.trim()) {
    guide =
      `\n\nINSTRUCCIONES ESPECÍFICAS DEL USUARIO (marco de referencia — síguelas al pie de la letra ` +
      `sobre QUÉ información extraer y CÓMO presentarla):\n"""${instructions.trim()}"""\n` +
      `- Extrae exactamente los datos que pide (montos, fechas, conceptos, recurrentes, etc.) desde el material.\n` +
      `- Cuando pida ver datos "organizados", "por tarjeta", "lista de gastos", "cuáles son recurrentes" o algo tabular, ` +
      `LLENA el campo "table" del tema correspondiente (headers + rows) además del "summary".\n` +
      `- Respeta el formato y el detalle que pide. No resumas de más si pidió el desglose.`;
  }
  return (
    `A partir del siguiente material en bruto, redacta un reporte ejecutivo para jefatura.\n\n` +
    `${material}${focus}${guide}\n\n` +
    `Devuelve:\n` +
    `- executiveSummary: 2-3 frases claras en español (visión general de los temas).\n` +
    `- topics: ver instrucción de arriba (organizado por tema, con seguimiento; usa "table" cuando aplique).\n` +
    `- priorities: 3-5 temas con urgencia (Alta/Media/Baja) e impacto (Alto/Medio/Bajo).\n` +
    `- recommendations: 3-5 acciones concretas.\n` +
    `Sé concreto; no inventes datos que no estén en el material.`
  );
}

// Llama a Claude de verdad (requiere ANTHROPIC_API_KEY).
async function generateReportContent(input) {
  const client = new AnthropicLib(); // lee ANTHROPIC_API_KEY del entorno
  // Claude lee los PDF de forma nativa: se adjuntan como bloques "document".
  const userContent = [];
  for (const pdf of input.pdfs || []) {
    userContent.push({
      type: 'document',
      title: pdf.filename,
      source: { type: 'base64', media_type: 'application/pdf', data: pdf.data },
    });
  }
  userContent.push({ type: 'text', text: buildPrompt(input) });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system:
      'Eres un analista que redacta reportes ejecutivos claros y accionables para ' +
      'jefatura. Escribe en español, en tono profesional y directo.',
    output_config: { format: { type: 'json_schema', schema: REPORT_SCHEMA } },
    messages: [{ role: 'user', content: userContent }],
  });
  const text = (response.content.find((b) => b.type === 'text') || {}).text || '{}';
  return JSON.parse(text);
}

// Contenido de ejemplo cuando no hay API key (para demostrar el flujo).
function demoReportContent(input = {}) {
  const base = (input.summary || '').trim();
  const reqTopics = (input.topics || []).length ? input.topics : ['Tema general'];
  const hasGuide = Boolean((input.instructions || '').trim());
  return {
    executiveSummary:
      (base ? base + ' ' : '') +
      'Este resumen fue redactado automáticamente por IA a partir del material proporcionado, ' +
      'enfocado en los temas solicitados.',
    topics: reqTopics.map((t, i) => ({
      topic: t,
      summary: `(Demo) Resumen de lo ocurrido esta semana sobre "${t}", filtrando solo lo relacionado con ese tema.`,
      nextSteps: `(Demo) Pendientes y seguimiento de "${t}".`,
      // Si el usuario dio instrucciones (ej. "organiza los gastos"), la IA
      // devolvería una tabla. En demo mostramos un ejemplo en el primer tema.
      ...(hasGuide && i === 0
        ? {
            table: {
              caption: '(Demo) Datos organizados según tus instrucciones',
              headers: ['Concepto', 'Monto', 'Recurrente'],
              rows: [
                ['Suscripción mensual', '$199.00', 'Sí'],
                ['Compra puntual', '$540.00', 'No'],
                ['Servicio anual', '$1,200.00', 'Sí'],
              ],
            },
          }
        : {}),
    })),
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
