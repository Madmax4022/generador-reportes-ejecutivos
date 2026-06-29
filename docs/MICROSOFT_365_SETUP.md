# 🔷 GUÍA DE CONFIGURACIÓN - MICROSOFT OFFICE 365

## 📋 Tabla de Contenidos
1. [Requisitos](#requisitos)
2. [Crear Aplicación en Azure](#crear-aplicación-en-azure)
3. [Configurar Permisos](#configurar-permisos)
4. [Obtener Credenciales](#obtener-credenciales)
5. [Configurar .env](#configurar-env)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Troubleshooting](#troubleshooting)

---

## ⚙️ Requisitos

- ✅ Cuenta de Microsoft 365 (Business, Enterprise o Personal)
- ✅ Acceso como administrador a Azure AD
- ✅ Node.js 14+ instalado
- ✅ npm con dependencias instaladas

---

## 🔑 Crear Aplicación en Azure

### Paso 1: Acceder a Azure Portal

1. Ve a: **https://portal.azure.com/**
2. Inicia sesión con tu cuenta de Microsoft 365

```
Espera a que se cargue el dashboard de Azure
```

### Paso 2: Navegar a Azure Active Directory

1. En el menú izquierdo, busca **"Azure Active Directory"**
2. O usa la barra de búsqueda superior y escribe "Azure AD"
3. Haz clic en el resultado

```
URL directa: https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview
```

### Paso 3: Registrar Nueva Aplicación

1. En el lado izquierdo, busca **"App registrations"** (Registros de aplicaciones)
2. Haz clic en **"New registration"** (Nuevo registro)

```
┌────────────────────────────────────┐
│ App registrations                  │
│                                    │
│ [New registration]   [Owned by me] │
└────────────────────────────────────┘
```

### Paso 4: Llenar Información de la Aplicación

```
Nombre:                     "Generador de Reportes"
Supported account types:    "Accounts in this organizational directory only"
Redirect URI:               http://localhost:3000/auth/microsoft/callback
```

3. Haz clic en **"Register"** (Registrar)

**IMPORTANTE:** Anota estos IDs que aparecerán:
```
Application (client) ID:    xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID:      xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 🔐 Obtener Credenciales

### Paso 1: Copiar Application ID

```
En la página de la aplicación, copiar:
Application (client) ID    →  MICROSOFT_CLIENT_ID
Directory (tenant) ID      →  MICROSOFT_TENANT_ID
```

### Paso 2: Crear Client Secret

1. En el lado izquierdo, busca: **"Certificates & secrets"**
2. Haz clic en **"New client secret"**

```
┌────────────────────────────────────┐
│ Certificates & secrets             │
│                                    │
│ [New client secret]                │
│                                    │
│ Client secrets (0)                 │
└────────────────────────────────────┘
```

3. Rellena:
```
Description:        "Generador Reportes Secret"
Expires:            "24 months" (recomendado)
```

4. Haz clic en **"Add"**

5. **COPIA INMEDIATAMENTE** el valor del secret en:
```
MICROSOFT_CLIENT_SECRET     →  Valor bajo "Value" (no "Secret ID")
```

⚠️ **IMPORTANTE:** Solo se muestra UNA VEZ. Si lo cierras, deberás crear uno nuevo.

---

## 📋 Configurar Permisos API

### Paso 1: Acceder a Permisos de API

1. En el lado izquierdo, busca: **"API permissions"** (Permisos de API)
2. Haz clic en **"Add a permission"** (Agregar un permiso)

```
┌────────────────────────────────────┐
│ API permissions                    │
│                                    │
│ [+ Add a permission]               │
└────────────────────────────────────┘
```

### Paso 2: Seleccionar Microsoft Graph

1. Selecciona: **"Microsoft Graph"**

```
Opciones:
- Microsoft APIs
  - Microsoft Graph  ← SELECCIONA ESTE
- APIs my organization uses
```

### Paso 3: Elegir Tipo de Permiso

Elige: **"Application permissions"** (Permisos de aplicación)

**NO:** "Delegated permissions"

### Paso 4: Buscar y Agregar Permisos

Busca y selecciona los siguientes permisos:

```
📧 MAIL
  ☐ Mail.Read            (Leer correos)
  ☐ Mail.Send            (Enviar correos)

📁 FILES
  ☐ Files.Read.All       (Leer archivos)
  ☐ Files.ReadWrite.All  (Leer y escribir archivos)

🗂️ SITES
  ☐ Sites.Read.All       (Leer sitios)

👤 USER
  ☐ User.Read            (Leer info de usuario)
  ☐ User.Read.All        (Leer todos los usuarios)
```

Selecciona cada uno y haz clic en **"Add permissions"**

```
Permiso seleccionado:
[Mail.Read]  [Add permissions]
```

### Paso 5: Dar Consentimiento del Administrador

1. Después de agregar todos los permisos, haz clic en:
   **"Grant admin consent for [tu organización]"**

2. Confirma en el popup

```
⚠️ IMPORTANTE: Sin esto, la aplicación no funcionará
```

---

## 🔧 Configurar Variables de Entorno

### Archivo .env

Copia el template y rellena con tus valores:

```bash
# Microsoft 365
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=tu_secret_aqui_muy_largo
MICROSOFT_REDIRECT_URL=http://localhost:3000/auth/microsoft/callback
MICROSOFT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_AUTHORITY=https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Google Workspace (si también lo usas)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Validar Configuración

```bash
# Verificar que las variables estén cargadas
node -e "console.log(process.env.MICROSOFT_CLIENT_ID)"

# Debe mostrar tu client ID, no "undefined"
```

---

## 💡 Ejemplos de Uso

### Extraer Correos de Outlook

```bash
curl -X POST http://localhost:3000/api/extract/outlook \
  -H "Content-Type: application/json" \
  -d '{
    "filter": "isRead eq false",
    "limit": 10
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "messages": [
    {
      "id": "AAMkADU...",
      "from": "jefe@empresa.com",
      "subject": "Reunión importante",
      "date": "2026-06-28T10:30:00Z",
      "preview": "Por favor revisar...",
      "source": "Outlook"
    }
  ]
}
```

### Extraer Datos de Excel Online

```bash
curl -X POST http://localhost:3000/api/extract/excel \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "ID_DEL_ARCHIVO",
    "sheetName": "Sheet1",
    "range": "A1:Z100"
  }'
```

### Enviar Reporte por Outlook

```bash
curl -X POST http://localhost:3000/api/send-report/outlook \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["jefe@empresa.com"],
    "subject": "Reporte Mensual",
    "htmlContent": "<h1>Mi Reporte</h1>..."
  }'
```

---

## 🔄 Flujos de Datos

### Autenticación

```
Usuario → Click en "Conectar Microsoft" 
    ↓
http://localhost:3000/auth/microsoft (genera URL de login)
    ↓
login.microsoftonline.com (usuario ingresa credenciales)
    ↓
Redirección a /auth/microsoft/callback con code
    ↓
Backend intercambia code por token de acceso
    ↓
Token almacenado en sesión
    ↓
✅ Conectado, listo para usar APIs
```

### Extracción de Datos

```
Usuario → POST /api/extract/outlook
    ↓
Backend usa token para llamar Microsoft Graph API
    ↓
Microsoft Graph procesa solicitud
    ↓
Retorna datos (correos, archivos, etc.)
    ↓
Backend procesa y formatea datos
    ↓
Retorna JSON al frontend
```

---

## 📊 Filtros de Outlook (OData)

### Sintaxis Básica

```
isRead eq false                   → Correos sin leer
isRead eq true                    → Correos leídos
from/emailAddress contains 'jefe' → De un remitente específico
subject contains 'reporte'        → Palabra en asunto
receivedDateTime ge 2026-06-01    → Después de una fecha
```

### Ejemplos Comunes

```
isRead eq false and from/emailAddress eq 'jefe@empresa.com'
  → Sin leer Y del jefe

hasAttachments eq true
  → Correos con adjuntos

subject contains 'urgente' or subject contains 'importante'
  → Palabra "urgente" O "importante" en asunto

receivedDateTime ge 2026-06-01 and receivedDateTime lt 2026-07-01
  → Correos de junio
```

---

## 🆔 Obtener IDs de Archivos

### Para OneDrive

```
URL: https://outlook.office365.com/mail/inbox
  ↓
Compartir archivo → Copiar enlace
  ↓
URL: https://[empresa]-my.sharepoint.com/:w:/g/personal/usuario/...
  ↓
El ID está en la URL

O usar Graph API:
GET /me/drive/root/children
  → Lista archivos con sus IDs
```

### Para Excel Online

```
1. Abre Excel en https://office.com/
2. Abre tu archivo
3. En la URL:
   https://[empresa].sharepoint.com/...
   
4. Obtener ID:
   GET /me/drive/items/{parent-id}/children
```

---

## 🐛 Troubleshooting

### Error: "Invalid Client ID"

**Solución:**
- Verificar que `MICROSOFT_CLIENT_ID` esté correcto
- Copiar exactamente desde Azure Portal
- Sin espacios al inicio/final

### Error: "AADSTS70001: Unauthorized client"

**Solución:**
- Client secret expiró → Crear uno nuevo
- Client secret no coincide → Copiar nuevamente
- Permiso "Grant admin consent" no dado → Hacerlo en Azure

### Error: "CORS error"

**Solución:**
```
En Azure Portal:
Authentication → Platform configurations
  → Web: Redirect URIs
  → Verificar que sea: http://localhost:3000/auth/microsoft/callback
```

### Error: "Mail.Send permission required"

**Solución:**
- Agregar permiso Mail.Send en Azure
- Dar Grant admin consent
- Reiniciar servidor

### No puedo conectarme

**Checklist:**
```
☐ Client ID es válido
☐ Client Secret es válido
☐ Redirect URI coincide exactamente
☐ Permisos están agregados
☐ Admin consent fue dado
☐ Servidor está corriendo en puerto 3000
☐ Usando HTTPS en producción (no http)
```

---

## 📦 Integración con Google + Microsoft

### Usar Ambos Simultáneamente

```javascript
// Backend soporta ambas plataformas

// Google
POST /api/extract/gmail
POST /api/extract/drive
POST /api/extract/sheets
POST /api/send-report/gmail

// Microsoft
POST /api/extract/outlook
POST /api/extract/onedrive
POST /api/extract/excel
POST /api/send-report/outlook

// Combinado
Puedes agregar fuentes de ambas plataformas
en el mismo reporte
```

### Ejemplo: Reporte Combinado

```
Fuentes:
- Gmail (Google)
- Outlook (Microsoft)
- Google Drive
- Excel Online (Microsoft)

Resultado:
Un solo reporte que consolida
información de ambas plataformas
```

---

## 🔒 Seguridad y Best Practices

### En Desarrollo
- Client secret en .env
- CORS restricto a localhost
- Tokens en sesión (no localStorage)

### En Producción
- Cliente secret en Variables de Entorno del servidor
- Usar HTTPS obligatorio
- Redirect URI con dominio real
- Agregar Rate Limiting
- Monitorear uso de APIs

---

## 📝 Resumen Rápido

| Paso | Acción | Dónde |
|------|--------|-------|
| 1 | Registrar app | Azure Portal → App registrations |
| 2 | Copiar IDs | Aplicación → Overview |
| 3 | Crear secret | Certificates & secrets → New secret |
| 4 | Agregar permisos | API permissions → Add permission |
| 5 | Grant consent | API permissions → Grant admin consent |
| 6 | Configurar .env | .env file → Rellenar valores |
| 7 | Iniciar servidor | `npm start` |
| 8 | Conectar | Browser → http://localhost:3000 |

---

## 🎓 Recursos Útiles

- **Azure Portal:** https://portal.azure.com/
- **Microsoft Graph API:** https://docs.microsoft.com/graph/
- **OData Filter Syntax:** https://docs.microsoft.com/odata/
- **SDK de Microsoft:** https://github.com/microsoftgraph/msgraph-sdk-javascript

---

**¡Listo para usar Microsoft 365!** 🚀
