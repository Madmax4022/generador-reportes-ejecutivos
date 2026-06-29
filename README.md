# 📊 Generador de Reportes Ejecutivos para Google Workspace

> **Aplicación integrable con Gmail, Drive, Sheets y más.** Extrae información automáticamente, la organiza y genera reportes profesionales para enviar a jefatura.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](README.md)

---

## 🎯 Qué Resuelve

### Problema: Información Dispersa
❌ Correos en Gmail  
❌ Documentos en Drive  
❌ Datos en Sheets  
❌ Información en múltiples lugares  
❌ Compilar reportes manualmente

### Solución: Reporte Centralizado
✅ Extrae de **Gmail, Drive, Sheets**  
✅ Organiza información automáticamente  
✅ Genera reportes **profesionales** en segundos  
✅ Envía por correo a jefatura  
✅ **Programable** (diariamente, semanalmente, etc.)

---

## ⚡ Quick Start (5 minutos)

### 1️⃣ Abrir en Navegador

Simplemente abre `ReporteExecutivo.html` en tu navegador:

```bash
# Windows
start ReporteExecutivo.html

# Mac
open ReporteExecutivo.html

# Linux
firefox ReporteExecutivo.html
```

O arrastra el archivo a tu navegador.

### 2️⃣ Agregar Fuentes

En la interfaz, selecciona una pestaña:

```
📧 Gmail      → Filtros como "label:importante"
📄 Drive      → URL del documento
📊 Sheets     → URL de la hoja de cálculo
✏️ Manual     → Contenido directo
```

**Ejemplo:**
```
Gmail Filter: from:jefe@empresa.com
Límite: 10 correos
↓
[+ Agregar fuente Gmail]
```

### 3️⃣ Configurar Reporte

```
Título:      "Reporte Mensual - Junio"
Período:     "Junio 1-30, 2026"
Resumen:     "Síntesis de hallazgos clave..."
Destinatarios: "jefe@empresa.com"
```

### 4️⃣ Generar y Enviar

```
[👁️ Vista Previa]  → Ver cómo se verá
     ↓
[📧 Enviar Reporte] → Enviar a jefatura
     ↓
[📥 Descargar HTML]  → Guardar localmente
```

**¡Listo!** El reporte está en su bandeja de entrada.

---

## 📦 Contenido del Proyecto

```
generador-reportes/
├── ReporteExecutivo.html      ← Interfaz web (abre directamente)
├── backend-server.js           ← Servidor Node.js (API)
├── package.json                ← Dependencias
├── .env.example                ← Configuración
│
├── GUIA_INTEGRACION.md        ← Guía técnica completa
├── INSTALACION.md              ← Pasos de instalación
├── AUTOMATIZACION.md           ← Programación de tareas
└── README.md                   ← Este archivo
```

---

## 🚀 Instalación Completa (15 minutos)

### Requisitos
- Node.js 14+ ([Descargar](https://nodejs.org/))
- Cuenta de Google Workspace
- 200 MB de espacio en disco

### Pasos

```bash
# 1. Descargar proyecto
git clone https://github.com/tu-empresa/generador-reportes.git
cd generador-reportes

# 2. Instalar dependencias
npm install

# 3. Obtener credenciales de Google
# → Ir a https://console.cloud.google.com/
# → Crear proyecto
# → Habilitar Gmail, Drive, Sheets APIs
# → Crear OAuth credentials
# → Descargar como credentials.json

# 4. Configurar variables
cp .env.example .env
# Edita .env con tus valores

# 5. Iniciar servidor
npm start

# 6. Abrir en navegador
# → http://localhost:3000
# → Hacer clic en "Conectar con Google"
# → Autorizar acceso
```

**Más detalles:** Ver `INSTALACION.md`

---

## 💡 Casos de Uso

### 📅 Reporte Semanal de Gestión
```
Fuentes:
- Gmail: últimos 10 correos con label "importante"
- Drive: documento de síntesis de la semana
- Manual: hallazgos clave del equipo

Frecuencia: Viernes a las 5 PM
Destinatarios: jefe@empresa.com

Resultado: Email profesional en bandeja de jefatura
```

### 📈 Reporte Mensual de Métricas
```
Fuentes:
- Sheets: dashboard con KPIs
- Drive: análisis de rendimiento
- Gmail: correos de analítica

Incluir: Gráficos + Matriz de prioridades
Enviar a: Jefatura + Directivos
```

### 📋 Consolidado de Proyectos
```
Fuentes:
- Sheets: matriz de proyectos
- Drive: planes actuales
- Gmail: updates de proyecto

Formato: Ejecutivo (máx 1 página)
Acción: Recomendaciones prioritarias
```

---

## 🔗 Integración con Sistemas

### Gmail ✉️
- Extrae correos usando filtros avanzados
- Soporta labels, remitentes, fechas
- Envía reportes como nuevo correo

### Google Drive 📄
- Lee documentos, PDFs, hojas
- Extrae textos y tablas
- Opción de resumen automático

### Google Sheets 📊
- Importa datos de hojas de cálculo
- Soporta múltiples rangos
- Convierte a formato legible

### Personalizado ✏️
- Agrega contenido manual directamente
- Organiza información como necesites
- Crea estructura personalizada

---

## 🛠️ Ejemplos de Uso

### Ejemplo 1: Extraer Correos
```javascript
POST /api/extract/gmail
{
  "query": "from:jefe@empresa.com label:urgente",
  "limit": 10
}

Respuesta:
{
  "count": 5,
  "messages": [
    {
      "from": "jefe@empresa.com",
      "subject": "Reunión importante",
      "preview": "Por favor revisar..."
    }
  ]
}
```

### Ejemplo 2: Generar Reporte
```javascript
POST /api/generate-report
{
  "title": "Reporte Ejecutivo",
  "executiveSummary": "Síntesis...",
  "includePriorities": true,
  "includeRecommendations": true
}

Respuesta:
{
  "reportId": "uuid",
  "content": "<h1>Reporte...</h1>",
  "generatedAt": "2026-06-28T..."
}
```

### Ejemplo 3: Enviar Reporte
```javascript
POST /api/send-report
{
  "recipients": ["jefe@empresa.com"],
  "subject": "Reporte Mensual",
  "htmlContent": "<h1>Mi Reporte</h1>..."
}

Respuesta:
{
  "success": true,
  "messageId": "...",
  "sentTo": ["jefe@empresa.com"]
}
```

---

## ⏰ Automatización

### Ejecutar Automáticamente

#### Opción 1: Cron (Linux/Mac)
```bash
# Cada día a las 9 AM
0 9 * * * /usr/bin/node /home/usuario/daily-report.js

# Lunes a viernes a las 5 PM
0 17 * * 1-5 /usr/bin/node /home/usuario/weekly-report.js
```

#### Opción 2: Windows Task Scheduler
```powershell
$trigger = New-ScheduledTaskTrigger -Daily -At 09:00
$action = New-ScheduledTaskAction -Execute "node.exe" -Argument "daily-report.js"
Register-ScheduledTask -TaskName "ReporteDiario" -Trigger $trigger -Action $action
```

#### Opción 3: Google Cloud Scheduler
```
Frecuencia: 0 9 * * * (9 AM diariamente)
URL: https://tu-dominio.com/api/generate-report
```

#### Opción 4: node-cron (En el servidor)
```javascript
const cron = require('node-cron');
cron.schedule('0 9 * * *', generateDailyReport);
```

**Más detalles:** Ver `AUTOMATIZACION.md`

---

## 🔐 Seguridad

✅ **OAuth 2.0** - No se guardan contraseñas  
✅ **Permisos Limitados** - Solo lectura (excepto envío)  
✅ **Tokens Temporales** - Expiración automática  
✅ **HTTPS** - Encriptación en tránsito  
✅ **Variables de Entorno** - Credenciales no en código  

---

## 📊 Características

### Extracción
- ✅ Gmail (filtros avanzados)
- ✅ Google Drive (múltiples tipos)
- ✅ Google Sheets (rangos personalizados)
- ✅ Entrada manual

### Generación
- ✅ Resumen ejecutivo
- ✅ Matriz de prioridades
- ✅ Recomendaciones de acción
- ✅ Gráficos automáticos
- ✅ Formato HTML/PDF

### Distribución
- ✅ Envío por correo
- ✅ Múltiples destinatarios
- ✅ Descarga local
- ✅ Almacenamiento en Drive

### Automatización
- ✅ Cron jobs (Linux/Mac)
- ✅ Task Scheduler (Windows)
- ✅ Cloud Scheduler
- ✅ Programación interna

---

## 🎓 Documentación

| Documento | Contenido |
|-----------|----------|
| **GUIA_INTEGRACION.md** | Uso completo, casos de ejemplo, API reference |
| **INSTALACION.md** | Pasos de instalación, setup de Google Cloud |
| **AUTOMATIZACION.md** | Cron jobs, Task Scheduler, Cloud Scheduler |
| **backend-server.js** | Código fuente comentado del servidor |

---

## 🐛 Solución de Problemas

### "No se conecta a Gmail"
1. Verificar credenciales en `.env`
2. Ir a http://localhost:3000/auth/google
3. Reautenticar

### "El correo no se envía"
1. Validar destinatario en formato email
2. Usar contraseña de aplicación (no contraseña principal)
3. Verificar permisos en credenciales OAuth

### "¿Cómo cambio el puerto?"
```bash
# En .env
PORT=3001

# O en línea de comandos
PORT=3001 npm start
```

---

## 🚀 Despliegue

### Heroku
```bash
git push heroku main
```

### AWS Lambda
```bash
sam deploy --guided
```

### Docker
```bash
docker build -t reportes .
docker run -p 3000:3000 reportes
```

### VPS (DigitalOcean, etc.)
```bash
npm install -g pm2
pm2 start backend-server.js --name "reportes"
pm2 startup
```

**Más detalles:** Ver `INSTALACION.md` sección Despliegue

---

## 📈 Roadmap

### v1.0 (✅ Actual)
- Extracción multi-fuente
- Generación de reportes
- Envío por correo
- Interfaz web

### v1.1 (🔜 Próximamente)
- Gráficos automáticos
- Análisis de datos NLP
- Plantillas personalizadas
- Webhooks

### v2.0 (🛣️ Futuro)
- Machine Learning para insights
- Integración con BI tools
- Mobile app
- Colaboración en equipo

---

## 💬 Soporte

- 📖 **Docs:** Consulta `GUIA_INTEGRACION.md`
- 📧 **Email:** soporte@empresa.com
- 💬 **Slack:** #soporte-reportes
- 🐛 **Issues:** GitHub issues

---

## 📝 Licencia

MIT License - Libre para usar y modificar

---

## 🙏 Créditos

Desarrollado por **Tu Empresa**  
Basado en Google Workspace APIs  
Con ❤️ para hacer reportes más fáciles

---

## 🎯 Próximos Pasos

1. ✅ **Descargar** archivos del proyecto
2. 📖 **Leer** `INSTALACION.md` para setup
3. 🔐 **Obtener** credenciales de Google Cloud
4. 🚀 **Iniciar** servidor con `npm start`
5. 📧 **Generar** primer reporte
6. ⏰ **Automatizar** ejecución periódica

---

<div align="center">

### 🎉 ¡Listo para empezar!

**[Abrir ReporteExecutivo.html](#)** | **[Ver Guía de Instalación](INSTALACION.md)** | **[Ver Documentación Técnica](GUIA_INTEGRACION.md)**

---

Made with 💙 for busy executives

</div>
