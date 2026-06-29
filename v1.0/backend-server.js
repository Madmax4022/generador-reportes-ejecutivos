// ========================================
// Generador de Reportes - Backend Node.js
// Integración con Google Workspace APIs
// ========================================

const express = require('express');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ========================================
// CONFIGURACIÓN DE GOOGLE APIs
// ========================================

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

// Servicios de Google
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
const drive = google.drive({ version: 'v3', auth: oauth2Client });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// ========================================
// CONFIGURACIÓN DE EMAIL
// ========================================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

// Obtener URL de autorización
app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  });

  res.json({ authUrl });
});

// Callback de OAuth
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Guardar tokens en sesión
    req.session = req.session || {};
    req.session.tokens = tokens;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error en callback de OAuth:', error);
    res.status(500).json({ error: 'Autenticación fallida' });
  }
});

// ========================================
// EXTRACCIÓN DE DATOS
// ========================================

// Extraer correos de Gmail
app.post('/api/extract/gmail', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Se requiere parámetro "query"' });
    }

    console.log(`📧 Extrayendo Gmail: ${query} (límite: ${limit})`);

    // Obtener lista de mensajes
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: Math.min(limit, 100),
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date']
    });

    if (!listRes.data.messages || listRes.data.messages.length === 0) {
      return res.json({ messages: [], count: 0 });
    }

    // Obtener detalles de cada mensaje
    const messages = await Promise.all(
      listRes.data.messages.slice(0, limit).map(async (msg) => {
        try {
          const msgRes = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
          });

          const headers = msgRes.data.payload.headers;
          const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
          const subject = headers.find(h => h.name === 'Subject')?.value || '(Sin asunto)';
          const date = headers.find(h => h.name === 'Date')?.value || '';

          // Extraer cuerpo del mensaje
          let body = '';
          if (msgRes.data.payload.parts) {
            const textPart = msgRes.data.payload.parts.find(
              p => p.mimeType === 'text/plain'
            );
            if (textPart && textPart.body.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
          } else if (msgRes.data.payload.body.data) {
            body = Buffer.from(msgRes.data.payload.body.data, 'base64').toString('utf-8');
          }

          return {
            id: msg.id,
            from,
            subject,
            date,
            preview: body.substring(0, 200)
          };
        } catch (error) {
          console.error(`Error procesando mensaje ${msg.id}:`, error.message);
          return null;
        }
      })
    );

    const validMessages = messages.filter(m => m !== null);

    res.json({
      success: true,
      count: validMessages.length,
      messages: validMessages
    });

  } catch (error) {
    console.error('Error extrayendo Gmail:', error);
    res.status(500).json({
      error: 'Error al extraer correos de Gmail',
      details: error.message
    });
  }
});

// Extraer contenido de Google Drive
app.post('/api/extract/drive', async (req, res) => {
  try {
    const { fileId, contentType = 'full' } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'Se requiere fileId' });
    }

    console.log(`📄 Extrayendo Drive: ${fileId} (tipo: ${contentType})`);

    // Obtener metadatos del archivo
    const metaRes = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType, modifiedTime, webViewLink'
    });

    // Exportar contenido según el tipo de archivo
    let content = '';
    const mimeType = metaRes.data.mimeType;

    if (mimeType === 'application/vnd.google-apps.document') {
      // Google Doc
      const exportRes = await drive.files.export({
        fileId: fileId,
        mimeType: 'text/plain'
      });
      content = exportRes.data;
    } else if (mimeType === 'application/pdf') {
      // PDF
      const pdfRes = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'arraybuffer' });

      // Aquí podrías usar una librería como pdfParse para extraer texto
      content = '[Contenido PDF - requiere procesamiento adicional]';
    } else {
      content = '[Tipo de archivo no soportado]';
    }

    // Procesar contenido según contentType
    let processedContent = content;
    if (contentType === 'summary' && content.length > 500) {
      processedContent = generateSummary(content);
    }

    res.json({
      success: true,
      fileName: metaRes.data.name,
      mimeType: mimeType,
      lastModified: metaRes.data.modifiedTime,
      contentLength: processedContent.length,
      content: processedContent.substring(0, 2000) // Limitar a 2000 caracteres
    });

  } catch (error) {
    console.error('Error extrayendo Drive:', error);
    res.status(500).json({
      error: 'Error al extraer contenido de Drive',
      details: error.message
    });
  }
});

// Extraer datos de Google Sheets
app.post('/api/extract/sheets', async (req, res) => {
  try {
    const { spreadsheetId, range = 'Sheet1!A1:Z100' } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Se requiere spreadsheetId' });
    }

    console.log(`📊 Extrayendo Sheets: ${spreadsheetId} (rango: ${range})`);

    // Obtener metadatos
    const metaRes = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'properties.title'
    });

    // Obtener valores
    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });

    const values = valuesRes.data.values || [];

    // Convertir a formato más útil
    const headers = values[0] || [];
    const rows = values.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
      });
      return obj;
    });

    res.json({
      success: true,
      title: metaRes.data.properties.title,
      range: range,
      rowCount: rows.length,
      headers: headers,
      data: rows.slice(0, 100) // Limitar a 100 filas
    });

  } catch (error) {
    console.error('Error extrayendo Sheets:', error);
    res.status(500).json({
      error: 'Error al extraer datos de Sheets',
      details: error.message
    });
  }
});

// ========================================
// GENERACIÓN DE REPORTES
// ========================================

// Generar reporte
app.post('/api/generate-report', async (req, res) => {
  try {
    const {
      title,
      date,
      executiveSummary,
      dataSources,
      includeCharts,
      includePriorities,
      includeRecommendations
    } = req.body;

    console.log('📊 Generando reporte...');

    let reportContent = `
      <h1>${title}</h1>
      <p><strong>Período:</strong> ${date}</p>
      <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>

      <h2>Resumen Ejecutivo</h2>
      <p>${executiveSummary}</p>
    `;

    // Procesar fuentes de datos
    if (dataSources && Array.isArray(dataSources)) {
      for (const source of dataSources) {
        if (source.type === 'manual') {
          reportContent += `
            <h2>${source.title}</h2>
            <p>${source.content.replace(/\n/g, '<br>')}</p>
          `;
        }
      }
    }

    // Agregar secciones opcionales
    if (includePriorities) {
      reportContent += generatePriorityMatrix();
    }

    if (includeRecommendations) {
      reportContent += generateRecommendations();
    }

    if (includeCharts) {
      reportContent += generateCharts();
    }

    const reportId = uuidv4();

    res.json({
      success: true,
      reportId: reportId,
      content: reportContent,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({
      error: 'Error al generar reporte',
      details: error.message
    });
  }
});

// ========================================
// ENVÍO DE REPORTES
// ========================================

// Enviar reporte por correo
app.post('/api/send-report', async (req, res) => {
  try {
    const { recipients, subject, htmlContent } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Se requieren destinatarios' });
    }

    if (!htmlContent) {
      return res.status(400).json({ error: 'Se requiere contenido HTML' });
    }

    console.log(`📧 Enviando reporte a: ${recipients.join(', ')}`);

    // Usar Gmail API para enviar
    const messageParts = [
      `To: ${recipients.join(', ')}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ].join('\r\n');

    const encodedMessage = Buffer.from(messageParts).toString('base64');

    const sendRes = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    // También guardar en drafts como respaldo
    await saveReportToDrive(subject, htmlContent);

    res.json({
      success: true,
      messageId: sendRes.data.id,
      sentTo: recipients,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enviando reporte:', error);
    res.status(500).json({
      error: 'Error al enviar reporte',
      details: error.message
    });
  }
});

// ========================================
// UTILIDADES
// ========================================

// Generar resumen automático
function generateSummary(text, sentences = 3) {
  const textSentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return textSentences.slice(0, sentences).join('').trim();
}

// Generar matriz de prioridades
function generatePriorityMatrix() {
  return `
    <h2>Matriz de Prioridades</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #f0f0f0;">
        <th style="border: 1px solid #ddd; padding: 10px;">Tema</th>
        <th style="border: 1px solid #ddd; padding: 10px;">Urgencia</th>
        <th style="border: 1px solid #ddd; padding: 10px;">Impacto</th>
        <th style="border: 1px solid #ddd; padding: 10px;">Acción</th>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;">Item 1</td>
        <td style="border: 1px solid #ddd; padding: 10px;">🔴 Alta</td>
        <td style="border: 1px solid #ddd; padding: 10px;">Alto</td>
        <td style="border: 1px solid #ddd; padding: 10px;">Inmediata</td>
      </tr>
    </table>
  `;
}

// Generar recomendaciones
function generateRecommendations() {
  return `
    <h2>Recomendaciones de Acción</h2>
    <ul>
      <li>Revisar hallazgos en orden de prioridad</li>
      <li>Tomar decisiones sobre acciones recomendadas</li>
      <li>Comunicar a los equipos responsables</li>
      <li>Programar seguimiento y próxima revisión</li>
    </ul>
  `;
}

// Generar gráficos
function generateCharts() {
  return `
    <h2>Gráficos y Análisis</h2>
    <p>Los gráficos se mostrarán basados en los datos extraídos.</p>
    <p><em>Integración con Chart.js/Plotly para visualización automática</em></p>
  `;
}

// Guardar reporte en Drive
async function saveReportToDrive(title, htmlContent) {
  try {
    const fileMetadata = {
      name: `${title} - ${new Date().toISOString()}.html`,
      mimeType: 'text/html'
    };

    const media = {
      mimeType: 'text/html',
      body: htmlContent
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    console.log(`✅ Reporte guardado en Drive: ${file.data.id}`);
    return file.data.id;
  } catch (error) {
    console.error('Error guardando en Drive:', error);
  }
}

// ========================================
// RUTAS DE SALUD
// ========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ========================================
// MANEJO DE ERRORES
// ========================================

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Servidor de Reportes Ejecutivos iniciado              ║
║  🌐 URL: http://localhost:${PORT}                           ║
║  📧 Email: ${process.env.EMAIL_USER}                        ║
║  ✅ Conectado a Google Workspace APIs                      ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
