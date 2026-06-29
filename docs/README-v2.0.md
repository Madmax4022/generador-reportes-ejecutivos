# 📊 Generador de Reportes Ejecutivos v2.0
## Google Workspace + Microsoft Office 365

> **Sistema integrable con Gmail, Outlook, Drive, OneDrive, Sheets, Excel.** Extrae información de ambos ecosistemas automáticamente, la organiza y genera reportes profesionales para enviar a jefatura.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](README-v2.0.md)
[![Platforms](https://img.shields.io/badge/Platforms-Google%20%2B%20Microsoft-blue)](README-v2.0.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎯 ¿Qué Resuelve?

### El Problema
Información dispersa en múltiples plataformas:
- ❌ Google Workspace (Gmail, Drive, Sheets)
- ❌ Microsoft 365 (Outlook, OneDrive, Excel)
- ❌ Compilar reportes manualmente
- ❌ Enviar a jefatura de forma desorganizada

### La Solución
Un **único sistema** que:
- ✅ Lee de **ambas plataformas** simultáneamente
- ✅ Consolida toda la información
- ✅ Genera reportes automáticamente
- ✅ Envía directamente a jefatura

---

## ⚡ Quick Start (5 minutos)

### Opción 1: Solo Interfaz Web
```bash
# Sin instalación, sin backend
Abre: ReporteExecutivo-MULTI.html
Agrega: Contenido manual
Descarga: Como HTML
```

### Opción 2: Con Servidor Completo (Recomendado)
```bash
# 1. Descargar proyecto
git clone [repo]
cd generador-reportes-multi

# 2. Instalar dependencias
npm install

# 3. Configurar credenciales
cp .env-MULTI.example .env
# Editar .env con tus valores

# 4. Iniciar servidor
npm start

# 5. Abrir en navegador
http://localhost:3000
```

---

## 📦 Archivos Nuevos v2.0

### Integración Microsoft 365
- **backend-server-MULTI.js** - Servidor con soporte dual
- **package-MULTI.json** - Dependencias actualizadas
- **.env-MULTI.example** - Variables para ambas plataformas
- **ReporteExecutivo-MULTI.html** - Interfaz con pestañas duales
- **MICROSOFT_365_SETUP.md** - Guía configuración Azure
- **GOOGLE_vs_MICROSOFT.md** - Comparación y equivalencias

### Documentación Original (aún vigente)
- README.md
- INSTALACION.md
- GUIA_INTEGRACION.md
- AUTOMATIZACION.md

---

## 🌐 Plataformas Soportadas

### Google Workspace
```
📧 Gmail         → Filtros avanzados (label:, from:, subject:)
📄 Google Drive  → Documentos, PDFs, conversión automática
📊 Google Sheets → Datos tabulares, rangos personalizados
```

### Microsoft Office 365
```
📧 Outlook       → OData filtering (isRead, from, subject)
📁 OneDrive      → Word, Excel, PowerPoint documents
📊 Excel Online  → Datos, fórmulas, gráficos
```

---

## 🚀 Características

### Extracción de Datos
- ✅ Google Workspace (3 servicios)
- ✅ Microsoft 365 (3 servicios)
- ✅ Múltiples fuentes simultáneamente
- ✅ Filtros avanzados en ambas plataformas

### Generación
- ✅ Consolidación automática
- ✅ Resumen ejecutivo
- ✅ Matriz de prioridades
- ✅ Recomendaciones
- ✅ HTML profesional

### Distribución
- ✅ Envío por Gmail
- ✅ Envío por Outlook
- ✅ Descarga local
- ✅ Guardado en Drive/OneDrive

### Automatización
- ✅ Cron jobs
- ✅ Task Scheduler
- ✅ Cloud Scheduler
- ✅ node-cron integrado

---

## 📋 Comparación Rápida

| Característica | Google | Microsoft | Soporte |
|---|---|---|---|
| **Correo** | Gmail | Outlook | ✅ Ambos |
| **Documentos** | Drive | OneDrive | ✅ Ambos |
| **Datos** | Sheets | Excel | ✅ Ambos |
| **Rate Limit** | Medio | Alto | ✅ Soportado |
| **OAuth 2.0** | ✅ | ✅ | ✅ Ambos |
| **Costo** | Gratis/Premium | Licencia/Premium | ✅ Flexible |

Ver: [GOOGLE_vs_MICROSOFT.md](GOOGLE_vs_MICROSOFT.md) para comparación completa.

---

## 🎓 Primeros Pasos

### Paso 1: Entender
Leer: **README-v2.0.md** (este archivo) - 10 minutos

### Paso 2: Configurar Google (Opcional)
Seguir: **INSTALACION.md** - Google Workspace - 30 minutos

### Paso 3: Configurar Microsoft (Opcional)
Seguir: **MICROSOFT_365_SETUP.md** - Azure & Office 365 - 30 minutos

### Paso 4: Iniciar Servidor
```bash
npm install
npm start
```

### Paso 5: Usar
Abrir: http://localhost:3000
Agregar fuentes de una o ambas plataformas

---

## 💡 Casos de Uso

### Caso 1: Empresa 100% Google
```
Fuentes: Gmail + Drive + Sheets
Resultado: Reporte solo de Google
```

### Caso 2: Empresa 100% Microsoft
```
Fuentes: Outlook + OneDrive + Excel
Resultado: Reporte solo de Microsoft
```

### Caso 3: Empresa Híbrida (MEJOR)
```
Fuentes: Gmail + Outlook + Drive + OneDrive + Sheets + Excel
Resultado: Reporte consolidado de ambas plataformas
```

### Caso 4: Migración Gradual
```
Situación: Transición de Google a Microsoft
Solución: Usar ambas simultáneamente durante transición
Beneficio: Validar datos en ambas plataformas
```

---

## 🔐 Seguridad

### Autenticación
- ✅ OAuth 2.0 (Google)
- ✅ OAuth 2.0 + Azure AD (Microsoft)
- ✅ No almacena contraseñas
- ✅ Tokens con expiración

### Permisos
- ✅ Lectura solamente (excepto envío)
- ✅ Acceso controlado
- ✅ Revocación inmediata

### Almacenamiento
- ✅ Variables de entorno
- ✅ Nunca en código
- ✅ .gitignore por defecto

---

## 📁 Estructura de Archivos

```
generador-reportes-multi/
│
├─── VERSIÓN 2.0 (DUAL)
│    ├─ backend-server-MULTI.js          (Google + Microsoft)
│    ├─ ReporteExecutivo-MULTI.html      (Interfaz dual)
│    ├─ package-MULTI.json               (Dependencias amplias)
│    └─ .env-MULTI.example               (Config dual)
│
├─── VERSIÓN 1.0 (SOLO GOOGLE)
│    ├─ backend-server.js                (Solo Google)
│    ├─ ReporteExecutivo.html            (Interfaz Google)
│    ├─ package.json
│    └─ .env.example
│
├─── DOCUMENTACIÓN
│    ├─ README.md                        (v1.0)
│    ├─ README-v2.0.md                   (v2.0 - Este archivo)
│    ├─ INSTALACION.md                   (Google)
│    ├─ MICROSOFT_365_SETUP.md           (Microsoft)
│    ├─ GUIA_INTEGRACION.md              (Técnica)
│    ├─ GOOGLE_vs_MICROSOFT.md           (Comparación)
│    ├─ AUTOMATIZACION.md                (Scheduling)
│    └─ INDICE.md                        (Índice)
│
└─── CONFIGURACIÓN
     └─ .gitignore                       (Seguridad)
```

---

## 🔧 Configuración

### Google Workspace

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=google_secret
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
```

Ver: [INSTALACION.md](INSTALACION.md)

### Microsoft 365

```env
MICROSOFT_CLIENT_ID=azure-client-id
MICROSOFT_CLIENT_SECRET=azure-secret
MICROSOFT_REDIRECT_URL=http://localhost:3000/auth/microsoft/callback
MICROSOFT_TENANT_ID=tenant-id
```

Ver: [MICROSOFT_365_SETUP.md](MICROSOFT_365_SETUP.md)

---

## 📊 Ejemplos

### Extraer de Gmail
```bash
POST /api/extract/gmail
{
  "query": "label:importante from:jefe@empresa.com",
  "limit": 10
}
```

### Extraer de Outlook
```bash
POST /api/extract/outlook
{
  "filter": "isRead eq false",
  "limit": 10
}
```

### Generar Reporte
```bash
POST /api/generate-report
{
  "title": "Reporte Mensual",
  "dataSources": [...],
  "includePriorities": true
}
```

### Enviar por Gmail
```bash
POST /api/send-report/gmail
{
  "recipients": ["jefe@empresa.com"],
  "subject": "Reporte",
  "htmlContent": "..."
}
```

### Enviar por Outlook
```bash
POST /api/send-report/outlook
{
  "recipients": ["jefe@empresa.com"],
  "subject": "Reporte",
  "htmlContent": "..."
}
```

---

## ⏰ Automatización

### Cron (Linux/Mac)
```bash
0 9 * * * node /path/daily-report.js
```

### Task Scheduler (Windows)
```powershell
$trigger = New-ScheduledTaskTrigger -Daily -At 09:00
Register-ScheduledTask -TaskName "ReporteDiario" -Trigger $trigger
```

### Google Cloud Scheduler
```
Frecuencia: 0 9 * * *
URL: https://tu-dominio.com/api/generate-report
```

### Microsoft Automation
```
Power Automate → Cloud flows
Trigger: Scheduled cloud flow
Frecuencia: Diaria a las 9 AM
```

Ver: [AUTOMATIZACION.md](AUTOMATIZACION.md)

---

## 🐛 Problemas Comunes

### "Invalid Client ID"
**Solución:** Verificar credenciales en `.env`, sin espacios al inicio/final

### "CORS error"
**Solución:** Redirect URI debe coincidir exactamente con Azure/Google Console

### "Permission denied"
**Solución:** Agregar permisos en Azure Portal o Google Cloud Console

### "Token expired"
**Solución:** Normal, se renueva automáticamente

Ver: [INSTALACION.md](INSTALACION.md) para más troubleshooting

---

## 📈 Roadmap

### v2.0 ✅ (Actual)
- Google Workspace + Microsoft 365
- Interfaz dual
- APIs REST completas
- Documentación integral

### v2.1 (Próximamente)
- Gráficos automáticos
- Análisis de sentimiento NLP
- Plantillas personalizables

### v3.0 (Futuro)
- Machine Learning
- Integración BI (Power BI, Looker)
- Mobile app
- Colaboración en equipo

---

## 📞 Soporte

### Documentación
- 📖 [README.md](README.md) - Guía v1.0
- 📖 [INSTALACION.md](INSTALACION.md) - Setup Google
- 🔷 [MICROSOFT_365_SETUP.md](MICROSOFT_365_SETUP.md) - Setup Microsoft
- 📊 [GOOGLE_vs_MICROSOFT.md](GOOGLE_vs_MICROSOFT.md) - Comparación

### Recursos
- Google APIs: https://developers.google.com/
- Microsoft Graph: https://docs.microsoft.com/graph/
- Azure Portal: https://portal.azure.com/
- Node.js: https://nodejs.org/

### Contacto
- 📧 Email: soporte@empresa.com
- 💬 Slack: #soporte-reportes
- 🐛 Issues: GitHub issues

---

## ✅ Checklist de Instalación

### Solo Google
- ☐ Obtener credenciales Google Cloud
- ☐ Configurar .env
- ☐ npm install
- ☐ npm start

### Solo Microsoft
- ☐ Crear app en Azure Portal
- ☐ Configurar permisos API
- ☐ Obtener credenciales
- ☐ Configurar .env
- ☐ npm install
- ☐ npm start

### Ambas Plataformas
- ☐ Completar ambos procesos anteriores
- ☐ Usar backend-server-MULTI.js
- ☐ Usar package-MULTI.json
- ☐ Usar .env-MULTI.example
- ☐ npm install
- ☐ npm start

---

## 🎉 ¡Listo para Usar!

**Versión:** 2.0.0  
**Estado:** Production Ready ✅  
**Plataformas:** Google Workspace + Microsoft 365  
**Actualización:** Junio 2026

### Próximos Pasos

1. **Elige tu configuración:**
   - [ ] Solo Google
   - [ ] Solo Microsoft
   - [ ] Ambas (Recomendado)

2. **Sigue la guía correspondiente:**
   - [Google] → [INSTALACION.md](INSTALACION.md)
   - [Microsoft] → [MICROSOFT_365_SETUP.md](MICROSOFT_365_SETUP.md)
   - [Ambas] → Ambas guías

3. **Genera tu primer reporte**

4. **Automatiza (opcional)**
   - [AUTOMATIZACION.md](AUTOMATIZACION.md)

---

<div align="center">

### 🌟 Sistema Híbrido Completo

**Google Workspace + Microsoft 365 = Máxima Flexibilidad**

Comienza con: [INSTALACION.md](INSTALACION.md) o [MICROSOFT_365_SETUP.md](MICROSOFT_365_SETUP.md)

¿Preguntas? Consulta: [GOOGLE_vs_MICROSOFT.md](GOOGLE_vs_MICROSOFT.md)

</div>
