# 📊 Generador de Reportes Ejecutivos - Guía de Integración

## 🎯 Descripción General

Aplicación web integrable con **Google Workspace** que extrae información de múltiples fuentes (Gmail, Google Drive, Google Sheets) y genera reportes ejecutivos profesionales para enviar a jefatura.

---

## ✨ Características Principales

### 1. **Integración Multi-Fuente**
- ✅ **Gmail**: Extrae correos usando filtros (labels, remitentes, palabras clave)
- ✅ **Google Drive**: Lee documentos, PDFs y archivos
- ✅ **Google Sheets**: Importa datos de hojas de cálculo
- ✅ **Entrada Manual**: Agrega contenido directo

### 2. **Generación Automática de Reportes**
- 📝 Resumen ejecutivo personalizado
- 📊 Matriz de prioridades
- ✅ Recomendaciones de acción
- 🔀 Organización lógica y clara

### 3. **Distribución Automática**
- 📧 Envío directo a correos electrónicos
- 🔗 Integración con Gmail API
- 📥 Exportación a HTML descargable

### 4. **Interfaz Intuitiva**
- Pestañas para cada tipo de fuente
- Vista previa en tiempo real
- Gestión de múltiples fuentes
- Estado de operaciones en tiempo real

---

## 🚀 Cómo Usar

### **Paso 1: Agregar Fuentes de Datos**

#### Opción A: Gmail
```
Filtro: from:jefe@empresa.com
Límite: 10 correos
Resultado: Extrae los 10 últimos correos del jefe
```

**Ejemplos de filtros Gmail:**
```
label:importante        → Correos marcados como importantes
is:unread              → Correos sin leer
from:jefe@empresa.com  → De un remitente específico
subject:reporte        → Con palabra clave en asunto
```

#### Opción B: Google Drive
```
URL: https://docs.google.com/document/d/[ID_DEL_DOCUMENTO]/edit
Tipo: Contenido completo / Resumen / Solo tablas
Resultado: Extrae el contenido del documento
```

#### Opción C: Google Sheets
```
URL: https://docs.google.com/spreadsheets/d/[ID]/edit
Rango: Sheet1!A1:Z100
Resultado: Importa los datos de la hoja de cálculo
```

#### Opción D: Contenido Manual
```
Título: "Hallazgos Clave"
Contenido: [Texto directo]
Resultado: Agrega el contenido al reporte
```

### **Paso 2: Configurar Reporte**

1. **Título del Reporte**
   - Ej: "Reporte Mensual de Gestión - Junio 2026"

2. **Período/Fecha**
   - Ej: "Junio 1-30, 2026"

3. **Resumen Ejecutivo** (2-3 párrafos)
   - Síntesis de puntos clave
   - Contexto para la jefatura

4. **Destinatarios**
   - Separados por coma: `jefe@empresa.com, director@empresa.com`

5. **Asunto del Correo**
   - Ej: "Reporte Ejecutivo - Junio 2026"

### **Paso 3: Generar Vista Previa**

Haz clic en **"👁️ Vista Previa"** para:
- Ver cómo se verá el reporte
- Validar contenido
- Ajustar antes de enviar

### **Paso 4: Enviar Reporte**

**Opción A:** Enviar por Correo
- Haz clic en **"📧 Enviar Reporte"**
- Se enviará a todos los destinatarios

**Opción B:** Descargar HTML
- Haz clic en **"📥 Descargar HTML"**
- Archivo listo para guardar o adjuntar

---

## 💡 Casos de Uso Prácticos

### **Caso 1: Reporte Semanal de Gestión**

```
Fuentes:
- Gmail: label:semanal
- Drive: [Documento de síntesis de la semana]
- Manual: Resumen de reuniones

Configuración:
- Título: "Reporte Semanal de Gestión"
- Período: "Lunes a Viernes"
- Frecuencia: Todos los viernes a las 5 PM

Resultado: Email con estado de la semana
```

### **Caso 2: Reporte Mensual de Métricas**

```
Fuentes:
- Sheets: Dashboard de KPIs
- Drive: Análisis de métricas
- Gmail: from:analítica@empresa.com

Configuración:
- Título: "Reporte de Métricas Mensuales"
- Incluir: Gráficos + Matriz de prioridades
- Enviar a: Jefatura y directivos

Resultado: Reporte con datos + recomendaciones
```

### **Caso 3: Consolidado de Proyectos**

```
Fuentes:
- Sheets: [Matriz de proyectos]
- Drive: [Plan de proyectos]
- Gmail: subject:proyecto

Configuración:
- Título: "Estado de Proyectos - Junio"
- Incluir: Recomendaciones + Urgencias
- Formato: Ejecutivo (máximo 1 página)

Resultado: Resumen consolidado de todos los proyectos
```

---

## 🔗 Integración Avanzada con API

### **Opción 1: Node.js / JavaScript**

```javascript
const axios = require('axios');

// Integración con Gmail API
async function extractEmailsFromGmail(query, limit) {
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: limit
  });
  
  return response.data.messages;
}

// Integración con Drive API
async function extractDocumentContent(documentId) {
  const response = await drive.files.get({
    fileId: documentId,
    mimeType: 'text/plain'
  });
  
  return response.data;
}

// Enviar por correo usando Gmail API
async function sendReportByEmail(to, subject, body) {
  const message = {
    to: to,
    subject: subject,
    body: body,
    mimeType: 'text/html'
  };
  
  return await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: Buffer.from(message).toString('base64') }
  });
}
```

### **Opción 2: Python + Flask**

```python
from flask import Flask, request, jsonify
from google.oauth2 import service_account
from googleapiclient.discovery import build
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)

# Autorización
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/spreadsheets.readonly']

credentials = service_account.Credentials.from_service_account_file(
    'credentials.json', scopes=SCOPES)

gmail_service = build('gmail', 'v1', credentials=credentials)
drive_service = build('drive', 'v3', credentials=credentials)

@app.route('/api/extract-emails', methods=['POST'])
def extract_emails():
    data = request.json
    query = data.get('query', '')
    limit = data.get('limit', 10)
    
    results = gmail_service.users().messages().list(
        userId='me', q=query, maxResults=limit).execute()
    
    return jsonify(results)

@app.route('/api/send-report', methods=['POST'])
def send_report():
    data = request.json
    recipients = data.get('recipients', [])
    subject = data.get('subject', '')
    body = data.get('body', '')
    
    for recipient in recipients:
        message = MIMEText(body, 'html')
        message['Subject'] = subject
        message['From'] = 'reportes@empresa.com'
        message['To'] = recipient
        
        # Enviar vía Gmail SMTP
        # ... implementar SMTP ...
    
    return jsonify({'success': True})
```

### **Opción 3: Google Apps Script**

```javascript
// Ejecutar como trigger en Google Sheets

function generateAndSendReport() {
  // Extraer datos de Sheets
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Generar HTML del reporte
  const report = generateReportHTML(data);
  
  // Enviar por correo
  MailApp.sendEmail({
    to: "jefe@empresa.com",
    subject: "Reporte Ejecutivo - " + new Date().toLocaleDateString(),
    htmlBody: report
  });
}

function generateReportHTML(data) {
  let html = '<h1>Reporte Ejecutivo</h1>';
  html += '<table border="1" cellpadding="10">';
  
  for (let row of data) {
    html += '<tr>';
    for (let cell of row) {
      html += '<td>' + cell + '</td>';
    }
    html += '</tr>';
  }
  
  html += '</table>';
  return html;
}

// Programar ejecución diaria
function scheduleReport() {
  ScriptApp.newTrigger('generateAndSendReport')
    .timeBased()
    .atTime('17:00')
    .everyWeekdays()
    .create();
}
```

---

## 🔐 Requisitos de Seguridad

### **Autenticación**
- ✅ OAuth 2.0 con Google (no se guardan credenciales)
- ✅ Acceso limitado a archivos específicos
- ✅ Token de sesión con expiración

### **Permisos Requeridos**
```
✓ gmail.readonly       → Leer correos (no modificar)
✓ drive.readonly       → Leer documentos
✓ spreadsheets.readonly → Leer hojas
✓ gmail.send          → Enviar reportes
```

### **Buenas Prácticas**
- Nunca almacenar credenciales en el código
- Usar variables de entorno para config
- Validar todas las entradas
- Encriptar datos en tránsito (HTTPS)

---

## 📱 Ejemplos de Salida

### **Formato Email HTML**
```html
<h2>Reporte Ejecutivo - Junio 2026</h2>
<p><strong>Período:</strong> Junio 1-30, 2026</p>

<h3>Resumen Ejecutivo</h3>
<p>Este reporte consolida la información más relevante...</p>

<h3>Hallazgos Clave</h3>
<ul>
  <li>Hallazgo 1</li>
  <li>Hallazgo 2</li>
</ul>

<h3>Matriz de Prioridades</h3>
<table>
  <tr><th>Tema</th><th>Urgencia</th><th>Impacto</th></tr>
  <tr><td>Tema 1</td><td>Alta</td><td>Alto</td></tr>
</table>

<h3>Recomendaciones</h3>
<ul>
  <li>Acción 1</li>
  <li>Acción 2</li>
</ul>
```

---

## 🛠️ Instalación Local

### **Requisitos**
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Cuenta de Google Workspace (para integración)
- Node.js 14+ (si deseas backend)

### **Pasos**

1. **Descargar archivo**
   ```bash
   wget https://[tu-servidor]/ReporteExecutivo.html
   ```

2. **Abrir en navegador**
   ```
   File → Open File → ReporteExecutivo.html
   ```

3. **O servir con Node.js**
   ```bash
   npx http-server -p 8000
   # Visitar: http://localhost:8000/ReporteExecutivo.html
   ```

---

## 🔄 Workflow Recomendado

```
┌─────────────────────────────────────────────────┐
│ 1. AGENDAR GENERACIÓN (semanal/mensual)        │
│    ↓                                            │
│ 2. EXTRAER DATOS (Gmail, Drive, Sheets)        │
│    ↓                                            │
│ 3. PROCESAR INFORMACIÓN (ordenar, resumir)     │
│    ↓                                            │
│ 4. GENERAR REPORTE (HTML/PDF)                  │
│    ↓                                            │
│ 5. ENVIAR A JEFATURA (automático)              │
│    ↓                                            │
│ 6. GUARDAR VERSIÓN (archivo)                   │
└─────────────────────────────────────────────────┘
```

---

## 📊 Filtros de Gmail - Referencia Rápida

```
label:importante        Correos marcados como importantes
label:proyectos        Correos de una etiqueta específica
from:jefe@empresa.com  De un remitente
to:mi@empresa.com      Enviados a ti
subject:reporte        Palabra en asunto
is:unread              Sin leer
is:starred             Marcados con estrella
before:2026/06/01      Antes de una fecha
after:2026/06/01       Después de una fecha
```

---

## 🆘 Solución de Problemas

### **Problema: No se conecta a Gmail**
**Solución:** 
- Verificar permisos OAuth
- Revisar token no expirado
- Reautenticar en Google

### **Problema: Los datos no se actualizan**
**Solución:**
- Limpiar caché del navegador (Ctrl+Shift+Delete)
- Recargar la página
- Verificar conexión a internet

### **Problema: El correo no se envía**
**Solución:**
- Confirmar destinatarios válidos
- Verificar permisos de Gmail
- Revisar límites de rate limit

---

## 📞 Soporte

- 📧 Email: soporte@empresa.com
- 💬 Chat: Slack #soporte-reportes
- 📖 Wiki: https://wiki.empresa.com/reportes

---

## 📝 Changelog

### v1.0.0 (Junio 2026)
- ✅ Interfaz principal
- ✅ Integración Gmail/Drive/Sheets
- ✅ Generación de reportes
- ✅ Envío por correo

### v1.1.0 (Próximamente)
- 🔄 Gráficos automáticos
- 🔄 Análisis de datos
- 🔄 Plantillas personalizadas
- 🔄 Programación automática

---

**Versión:** 1.0.0  
**Última actualización:** Junio 28, 2026  
**Licencia:** Interna
