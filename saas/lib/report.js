// ========================================
// Generación del HTML del reporte ejecutivo.
// Acepta contenido generado por IA (resumen, prioridades, recomendaciones);
// si no se provee, usa secciones por defecto.
// ========================================

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function priorityMatrix(priorities) {
  // priorities: [{tema, urgencia, impacto}] — de IA. Si no hay, fila de ejemplo.
  const rows =
    Array.isArray(priorities) && priorities.length
      ? priorities
      : [{ tema: 'Item 1', urgencia: 'Alta', impacto: 'Alto' }];
  const body = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.tema)}</td><td>${escapeHtml(r.urgencia)}</td><td>${escapeHtml(r.impacto)}</td></tr>`
    )
    .join('');
  return `
    <h3>Matriz de Prioridades</h3>
    <table>
      <tr><th>Tema</th><th>Urgencia</th><th>Impacto</th></tr>
      ${body}
    </table>
  `;
}

// Renderiza una tabla de datos generada por la IA (gastos, montos, etc.).
// table: { caption?, headers: [..], rows: [[..]] }. Vacío si no aplica.
function dataTable(table) {
  if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows) || !table.rows.length) {
    return '';
  }
  const head = table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = table.rows
    .map((row) => `<tr>${(Array.isArray(row) ? row : [row]).map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('');
  const caption = table.caption ? `<p class="muted">${escapeHtml(table.caption)}</p>` : '';
  return `${caption}<table><tr>${head}</tr>${body}</table>`;
}

function recommendationsList(recommendations) {
  const items =
    Array.isArray(recommendations) && recommendations.length
      ? recommendations
      : [
          'Revisar hallazgos en orden de prioridad',
          'Ejecutar acciones recomendadas',
          'Comunicar a los equipos responsables',
        ];
  return `
    <h3>Recomendaciones de Acción</h3>
    <ul>${items.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
  `;
}

function generateReportHTML(config = {}) {
  const {
    title = 'Reporte Ejecutivo',
    period = '',
    summary = '',
    sections = [],
    includePriorities = true,
    includeRecommendations = true,
    priorities = null,
    recommendations = null,
    topicSections = null,
    brandName = '',
    aiGenerated = false,
  } = config;

  let body = `
    <h2>${escapeHtml(title)}</h2>
    ${aiGenerated ? '<p class="ai-badge">✨ Redactado con IA</p>' : ''}
    ${period ? `<p><strong>Período:</strong> ${escapeHtml(period)}</p>` : ''}
    <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
    <h3>Resumen Ejecutivo</h3>
    <p>${escapeHtml(summary).replace(/\n/g, '<br>')}</p>
  `;

  // Secciones por tema (filtradas/organizadas por la IA).
  if (Array.isArray(topicSections) && topicSections.length) {
    for (const t of topicSections) {
      body += `
        <h3>📌 ${escapeHtml(t.topic)}</h3>
        <p>${escapeHtml(t.summary || '').replace(/\n/g, '<br>')}</p>
        ${dataTable(t.table)}
        <p><strong>Seguimiento / próximos pasos:</strong> ${escapeHtml(t.nextSteps || '').replace(/\n/g, '<br>')}</p>
      `;
    }
  }

  for (const s of sections) {
    if (!s || !s.title) continue;
    body += `
      <h3>${escapeHtml(s.title)}</h3>
      <p>${escapeHtml(s.content || '').replace(/\n/g, '<br>')}</p>
    `;
  }

  if (includePriorities) body += priorityMatrix(priorities);
  if (includeRecommendations) body += recommendationsList(recommendations);

  const footer = brandName
    ? `<p class="footer">Reporte preparado por ${escapeHtml(brandName)}</p>`
    : `<p class="footer">Generado con AutoReport</p>`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#222;max-width:820px;margin:0 auto;padding:24px}
  h2{color:#5b4bd6}h3{color:#5b4bd6;margin-top:24px;border-bottom:2px solid #eee;padding-bottom:6px}
  table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f4f4fb}
  .ai-badge{display:inline-block;background:#ece9ff;color:#5b4bd6;padding:3px 10px;border-radius:20px;font-size:.85em;font-weight:600}
  .muted{color:#888;font-size:.9em;margin:4px 0}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #eee;color:#888;font-size:.9em}
</style></head><body>${body}${footer}</body></html>`;
}

module.exports = { generateReportHTML };
