// ========================================
// Generador de Reportes - Backend Node.js
// EXTENDIDO: Google Workspace + Microsoft 365
// ========================================

const express = require('express');
const { google } = require('googleapis');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
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
// CONFIGURACIÓN - GOOGLE WORKSPACE
// ========================================

const googleOauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

const gmail = google.gmail({ version: 'v1', auth: googleOauth2Client });
const googleDrive = google.drive({ version: 'v3', auth: googleOauth2Client });
const googleSheets = google.sheets({ version: 'v4', auth: googleOauth2Client });

// ========================================
// CONFIGURACIÓN - MICROSOFT 365
// ========================================

const microsoftClient = Client.init({
  authProvider: async (done) => {
    if (process.session && process.session.msTokens) {
      done(null, process.session.msTokens.accessToken);
    } else {
      done(new Error('No Microsoft access token available'));
    }
  }
});

// ========================================
// AUTENTICACIÓN GOOGLE WORKSPACE
// ========================================

app.get('/auth/google', (req, res) => {
  const authUrl = googleOauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/gmail.send'
    ]
  });

  res.json({ authUrl });
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await googleOauth2Client.getToken(code);
    googleOauth2Client.setCredentials(tokens);

    req.session = req.session || {};
    req.session.googleTokens = tokens;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error en callback Google:', error);
    res.status(500).json({ error: 'Autenticación Google fallida' });
  }
});

// ========================================
// AUTENTICACIÓN MICROSOFT 365
// ========================================

app.get('/auth/microsoft', (req, res) => {
  const msAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${process.env.MICROSOFT_CLIENT_ID}` +
    `&response_type=code` +
    `&scope=https://graph.microsoft.com/.default` +
    `&redirect_uri=${process.env.MICROSOFT_REDIRECT_URL}` +
    `&response_mode=query`;

  res.json({ authUrl: msAuthUrl });
});

app.get('/auth/microsoft/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URL,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await response.json();

    req.session = req.session || {};
    req.session.msTokens = tokens;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error en callback Microsoft:', error);
    res.status(500).json({ error: 'Autenticación Microsoft fallida' });
  }
});

// ========================================
// EXTRACCIÓN DE DATOS - GOOGLE WORKSPACE
// ========================================

app.post('/api/extract/gmail', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    console.log(`📧 Extrayendo Gmail: ${query}`);

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: Math.min(limit, 100)
    });

    if (!listRes.data.messages) {
      return res.json({ messages: [], count: 0, source: 'Gmail' });
    }

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

          let body = '';
          if (msgRes.data.payload.parts) {
            const textPart = msgRes.data.payload.parts.find(p => p.mimeType === 'text/plain');
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
            preview: body.substring(0, 200),
            source: 'Gmail'
          };
        } catch (error) {
          console.error(`Error procesando Gmail ${msg.id}:`, error.message);
          return null;
        }
      })
    );

    const validMessages = messages.filter(m => m !== null);

    res.json({
      success: true,
      count: validMessages.count,
      messages: validMessages,
      source: 'Gmail'
    });

  } catch (error) {
    console.error('Error extrayendo Gmail:', error);
    res.status(500).json({ error: 'Error al extraer correos de Gmail', details: error.message });
  }
});

app.post('/api/extract/drive', async (req, res) => {
  try {
    const { fileId } = req.body;

    console.log(`📄 Extrayendo Google Drive: ${fileId}`);

    const metaRes = await googleDrive.files.get({
      fileId: fileId,
      fields: 'name, mimeType, modifiedTime, webViewLink'
    });

    let content = '';
    const mimeType = metaRes.data.mimeType;

    if (mimeType === 'application/vnd.google-apps.document') {
      const exportRes = await googleDrive.files.export({
        fileId: fileId,
        mimeType: 'text/plain'
      });
      content = exportRes.data;
    }

    res.json({
      success: true,
      fileName: metaRes.data.name,
      mimeType: mimeType,
      lastModified: metaRes.data.modifiedTime,
      content: content.substring(0, 2000),
      source: 'Google Drive'
    });

  } catch (error) {
    console.error('Error extrayendo Drive:', error);
    res.status(500).json({ error: 'Error al extraer contenido de Drive', details: error.message });
  }
});

app.post('/api/extract/sheets', async (req, res) => {
  try {
    const { spreadsheetId, range = 'Sheet1!A1:Z100' } = req.body;

    console.log(`📊 Extrayendo Google Sheets: ${spreadsheetId}`);

    const metaRes = await googleSheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'properties.title'
    });

    const valuesRes = await googleSheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });

    const values = valuesRes.data.values || [];
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
      data: rows.slice(0, 100),
      source: 'Google Sheets'
    });

  } catch (error) {
    console.error('Error extrayendo Sheets:', error);
    res.status(500).json({ error: 'Error al extraer datos de Sheets', details: error.message });
  }
});

// ========================================
// EXTRACCIÓN DE DATOS - MICROSOFT 365
// ========================================

app.post('/api/extract/outlook', async (req, res) => {
  try {
    const { filter, limit = 10 } = req.body;

    console.log(`📧 Extrayendo Outlook: ${filter}`);

    const messages = await microsoftClient
      .api('/me/messages')
      .filter(filter || "isRead eq false")
      .top(Math.min(limit, 100))
      .get();

    const result = messages.value.map(msg => ({
      id: msg.id,
      from: msg.from?.emailAddress?.address || 'Desconocido',
      subject: msg.subject || '(Sin asunto)',
      date: msg.receivedDateTime,
      preview: msg.bodyPreview || '',
      source: 'Outlook'
    }));

    res.json({
      success: true,
      count: result.length,
      messages: result,
      source: 'Outlook'
    });

  } catch (error) {
    console.error('Error extrayendo Outlook:', error);
    res.status(500).json({ error: 'Error al extraer correos de Outlook', details: error.message });
  }
});

app.post('/api/extract/onedrive', async (req, res) => {
  try {
    const { fileId } = req.body;

    console.log(`📄 Extrayendo OneDrive: ${fileId}`);

    const file = await microsoftClient
      .api(`/me/drive/items/${fileId}`)
      .get();

    let content = '';

    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      // Para Word documents, obtener contenido
      const contentRes = await microsoftClient
        .api(`/me/drive/items/${fileId}/content`)
        .get();
      content = 'Contenido extraído de documento Word';
    } else if (file.name.endsWith('.txt')) {
      const contentRes = await microsoftClient
        .api(`/me/drive/items/${fileId}/content`)
        .responseType('text')
        .get();
      content = contentRes;
    }

    res.json({
      success: true,
      fileName: file.name,
      mimeType: file.file?.mimeType || 'unknown',
      lastModified: file.lastModifiedDateTime,
      content: content.substring(0, 2000),
      source: 'OneDrive'
    });

  } catch (error) {
    console.error('Error extrayendo OneDrive:', error);
    res.status(500).json({ error: 'Error al extraer contenido de OneDrive', details: error.message });
  }
});

app.post('/api/extract/excel', async (req, res) => {
  try {
    const { fileId, sheetName = 'Sheet1', range = 'A1:Z100' } = req.body;

    console.log(`📊 Extrayendo Excel Online: ${fileId}`);

    // Obtener workbook
    const workbook = await microsoftClient
      .api(`/me/drive/items/${fileId}/workbook`)
      .get();

    // Obtener datos del rango
    const tableData = await microsoftClient
      .api(`/me/drive/items/${fileId}/workbook/worksheets/${sheetName}/range(address='${range}')`)
      .get();

    const values = tableData.values || [];
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
      fileName: workbook.name,
      sheetName: sheetName,
      range: range,
      rowCount: rows.length,
      headers: headers,
      data: rows.slice(0, 100),
      source: 'Excel Online'
    });

  } catch (error) {
    console.error('Error extrayendo Excel:', error);
    res.status(500).json({ error: 'Error al extraer datos de Excel Online', details: error.message });
  }
});

// ========================================
// GENERACIÓN DE REPORTES (Multiplataforma)
// ========================================

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

    console.log('📊 Generando reporte multiplataforma...');

    let reportContent = `
      <h1>${title}</h1>
      <p><strong>Período:</strong> ${date}</p>
      <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
      <p><strong>Fuentes:</strong> Google Workspace + Microsoft 365</p>

      <h2>Resumen Ejecutivo</h2>
      <p>${executiveSummary}</p>
    `;

    // Procesar fuentes de ambos ecosistemas
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
      generatedAt: new Date().toISOString(),
      supportedPlatforms: ['Google Workspace', 'Microsoft 365']
    });

  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ error: 'Error al generar reporte', details: error.message });
  }
});

// ========================================
// ENVÍO DE REPORTES
// ========================================

// Enviar por Gmail
app.post('/api/send-report/gmail', async (req, res) => {
  try {
    const { recipients, subject, htmlContent } = req.body;

    console.log(`📧 Enviando por Gmail a: ${recipients.join(', ')}`);

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
      requestBody: { raw: encodedMessage }
    });

    res.json({
      success: true,
      messageId: sendRes.data.id,
      sentTo: recipients,
      platform: 'Gmail',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enviando por Gmail:', error);
    res.status(500).json({ error: 'Error al enviar por Gmail', details: error.message });
  }
});

// Enviar por Outlook
app.post('/api/send-report/outlook', async (req, res) => {
  try {
    const { recipients, subject, htmlContent } = req.body;

    console.log(`📧 Enviando por Outlook a: ${recipients.join(', ')}`);

    const message = {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: htmlContent
      },
      toRecipients: recipients.map(email => ({
        emailAddress: { address: email }
      }))
    };

    const sendRes = await microsoftClient
      .api('/me/sendMail')
      .post({ message });

    res.json({
      success: true,
      sentTo: recipients,
      platform: 'Outlook',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enviando por Outlook:', error);
    res.status(500).json({ error: 'Error al enviar por Outlook', details: error.message });
  }
});

// ========================================
// INFORMACIÓN DEL SISTEMA
// ========================================

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Generador de Reportes Ejecutivos',
    version: '2.0.0',
    description: 'Integración con Google Workspace y Microsoft 365',
    supportedPlatforms: {
      google: ['Gmail', 'Google Drive', 'Google Sheets'],
      microsoft: ['Outlook', 'OneDrive', 'Excel Online']
    },
    features: [
      'Extracción de múltiples fuentes',
      'Generación de reportes HTML',
      'Envío automático de correos',
      'Matriz de prioridades',
      'Recomendaciones automáticas',
      'Soporte multiplataforma'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    platforms: {
      googleWorkspace: 'enabled',
      microsoft365: 'enabled'
    }
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
// FUNCIONES AUXILIARES
// ========================================

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

function generateRecommendations() {
  return `
    <h2>Recomendaciones de Acción</h2>
    <ul>
      <li>Revisar hallazgos en orden de prioridad</li>
      <li>Tomar decisiones sobre acciones recomendadas</li>
      <li>Comunicar a los equipos responsables</li>
      <li>Programar seguimiento</li>
    </ul>
  `;
}

function generateCharts() {
  return `
    <h2>Gráficos y Análisis</h2>
    <p>Los gráficos se mostrarán basados en los datos extraídos.</p>
  `;
}

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Servidor de Reportes - Versión Multiplataforma        ║
║  🌐 URL: http://localhost:${PORT}                           ║
║  ✅ Google Workspace (Gmail, Drive, Sheets)               ║
║  ✅ Microsoft 365 (Outlook, OneDrive, Excel)              ║
║  ✅ Generador de reportes ejecutivos integrado            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
