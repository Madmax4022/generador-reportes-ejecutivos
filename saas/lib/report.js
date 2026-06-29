// ========================================
// Generación del HTML del reporte ejecutivo.
// Reutiliza la lógica del producto original (resumen, matriz, recomendaciones).
// ========================================

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generateReportHTML(config = {}) {
  const {
    title = 'Reporte Ejecutivo',
    period = '',
    summary = '',
    sections = [],
    includePriorities = true,
    includeRecommendations = true,
    brandName = '',
  } = config;

  let body = `
    <h2>${escapeHtml(title)}</h2>
    ${period ? `<p><strong>Período:</strong> ${escapeHtml(period)}</p>` : ''}
    <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
    <h3>Resumen Ejecutivo</h3>
    <p>${escapeHtml(summary).replace(/\n/g, '<br>')}</p>
  `;

  for (const s of sections) {
    if (!s || !s.title) continue;
    body += `
      <h3>${escapeHtml(s.title)}</h3>
      <p>${escapeHtml(s.content || '').replace(/\n/g, '<br>')}</p>
    `;
  }

  if (includePriorities) {
    body += `
      <h3>Matriz de Prioridades</h3>
      <table>
        <tr><th>Tema</th><th>Urgencia</th><th>Impacto</th></tr>
        <tr><td>Tema 1</td><td>🔴 Alta</td><td>Alto</td></tr>
      </table>
    `;
  }

  if (includeRecommendations) {
    body += `
      <h3>Recomendaciones de Acción</h3>
      <ul>
        <li>Revisar hallazgos en orden de prioridad</li>
        <li>Ejecutar acciones recomendadas</li>
        <li>Comunicar a los equipos responsables</li>
      </ul>
    `;
  }

  const footer = brandName
    ? `<p class="footer">Reporte preparado por ${escapeHtml(brandName)}</p>`
    : `<p class="footer">Generado con AutoReport</p>`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#222;max-width:820px;margin:0 auto;padding:24px}
  h2{color:#5b4bd6}h3{color:#5b4bd6;margin-top:24px;border-bottom:2px solid #eee;padding-bottom:6px}
  table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f4f4fb}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #eee;color:#888;font-size:.9em}
</style></head><body>${body}${footer}</body></html>`;
}

module.exports = { generateReportHTML };
