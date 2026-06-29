# 🚀 Instalación y Configuración - Generador de Reportes Ejecutivos

## 📋 Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Google Cloud](#configuración-de-google-cloud)
3. [Instalación Local](#instalación-local)
4. [Configuración del Servidor](#configuración-del-servidor)
5. [Primeras Pruebas](#primeras-pruebas)
6. [Despliegue](#despliegue)

---

## ⚙️ Requisitos Previos

### Software Necesario
- **Node.js** 14.0.0 o superior
- **npm** 6.0.0 o superior
- **Git** (opcional)
- Una **cuenta de Google Workspace**

### Verificar Instalación

```bash
# Comprobar versión de Node
node --version
# Debe mostrar v14.0.0 o superior

# Comprobar versión de npm
npm --version
# Debe mostrar 6.0.0 o superior
```

### Descargar Node.js (si no está instalado)
- **Windows/Mac:** https://nodejs.org/ (descargar LTS)
- **Linux:** 
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

---

## 🔐 Configuración de Google Cloud

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ir a https://console.cloud.google.com/
2. Haz clic en el selector de proyectos (arriba a la izquierda)
3. Haz clic en **"Nuevo Proyecto"**
4. Ingresa un nombre: `"Generador de Reportes"`
5. Haz clic en **"Crear"**

```
Ejemplo:
┌─────────────────────────────────┐
│ Nombre del proyecto             │
│ Generador de Reportes           │
│                                 │
│ ID del proyecto (auto)          │
│ generador-reportes-12345        │
└─────────────────────────────────┘
```

### Paso 2: Habilitar APIs Necesarias

En la consola de Google Cloud:

1. Ve a **"APIs y Servicios"** → **"Biblioteca"**

2. **Habilitar Gmail API:**
   - Busca "Gmail API"
   - Haz clic en el resultado
   - Haz clic en **"Habilitar"**

3. **Habilitar Google Drive API:**
   - Busca "Google Drive API"
   - Haz clic en el resultado
   - Haz clic en **"Habilitar"**

4. **Habilitar Google Sheets API:**
   - Busca "Google Sheets API"
   - Haz clic en el resultado
   - Haz clic en **"Habilitar"**

```
Progreso:
✅ Gmail API - Habilitada
✅ Google Drive API - Habilitada
✅ Google Sheets API - Habilitada
```

### Paso 3: Crear Credenciales OAuth 2.0

1. Ve a **"APIs y Servicios"** → **"Credenciales"**

2. Haz clic en **"+ Crear Credenciales"** → **"ID de cliente OAuth 2.0"**

3. Si se pide configurar pantalla de consentimiento:
   - Haz clic en **"Configurar pantalla de consentimiento"**
   - Selecciona **"Externo"** (o "Interno" si es Workspace)
   - Completa con tu información:
     ```
     Nombre de la app: "Generador de Reportes"
     Email de soporte: tu_email@empresa.com
     ```
   - Añade estos scopes:
     ```
     gmail.readonly
     gmail.send
     drive.readonly
     spreadsheets.readonly
     userinfo.email
     ```
   - Añade usuarios de prueba (tu email)
   - Guarda y vuelve a credenciales

4. Selecciona tipo de aplicación:
   - **"Aplicación de escritorio"**
   - Haz clic en **"Crear"**

### Paso 4: Descargar Credenciales

1. En la sección de credenciales, verás un nuevo cliente OAuth
2. Haz clic en el **icono de descarga** (↓)
3. Guarda el archivo como **`credentials.json`**
4. Coloca este archivo en la carpeta raíz del proyecto

```
Contenido de credentials.json:
{
  "installed": {
    "client_id": "tu_client_id.apps.googleusercontent.com",
    "project_id": "tu_project_id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "client_secret": "tu_client_secret",
    ...
  }
}
```

---

## 📥 Instalación Local

### Paso 1: Clonar o Descargar Proyecto

```bash
# Opción A: Si tienes Git
git clone https://github.com/tu-empresa/generador-reportes.git
cd generador-reportes

# Opción B: Si descargaste ZIP
unzip generador-reportes.zip
cd generador-reportes
```

### Paso 2: Instalar Dependencias

```bash
# Instalar todos los paquetes necesarios
npm install

# Esto descargará:
# - express (framework web)
# - googleapis (API de Google)
# - nodemailer (envío de emails)
# - y otros...
```

**Esperado:**
```
added 200+ packages in 2m
```

### Paso 3: Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env`:
   ```bash
   # Windows
   notepad .env
   
   # Mac/Linux
   nano .env
   ```

3. Rellena los valores:
   ```env
   PORT=3000
   NODE_ENV=development
   
   GOOGLE_CLIENT_ID=tu_client_id_aqui
   GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
   GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
   GOOGLE_PROJECT_ID=tu_project_id_aqui
   
   EMAIL_USER=tu_email@gmail.com
   EMAIL_PASSWORD=tu_contraseña_aplicacion
   
   SESSION_SECRET=mi_secret_muy_seguro_123
   ```

4. Guarda el archivo

---

## 🖥️ Configuración del Servidor

### Paso 1: Iniciar el Servidor

```bash
# Desarrollo (con auto-recarga)
npm run dev

# O producción
npm start
```

**Salida esperada:**
```
╔════════════════════════════════════════════════════════════╗
║  🚀 Servidor de Reportes Ejecutivos iniciado              ║
║  🌐 URL: http://localhost:3000                             ║
║  📧 Email: tu_email@gmail.com                              ║
║  ✅ Conectado a Google Workspace APIs                      ║
╚════════════════════════════════════════════════════════════╝
```

### Paso 2: Autenticarse con Google

1. Abre tu navegador en: http://localhost:3000/auth/google

2. Se abrirá la pantalla de login de Google

3. Selecciona tu cuenta de Google Workspace

4. **Haz clic en "Permitir"** para dar permisos:
   ```
   ✓ Acceso a tus correos (Gmail)
   ✓ Acceso a tus archivos (Drive)
   ✓ Acceso a tus hojas (Sheets)
   ✓ Envío de correos
   ```

5. Serás redirigido a `/dashboard`

```
Flujo de autenticación:
┌──────────────────────────────────────────┐
│ 1. Haces clic en "Conectar con Google"   │
├──────────────────────────────────────────┤
│ 2. Se abre login.accounts.google.com     │
├──────────────────────────────────────────┤
│ 3. Ingresas credenciales de Google       │
├──────────────────────────────────────────┤
│ 4. Autoriza permisos requeridos          │
├──────────────────────────────────────────┤
│ 5. Eres redirigido a la app              │
│    Token guardado en sesión              │
└──────────────────────────────────────────┘
```

---

## 🧪 Primeras Pruebas

### Test 1: Extraer Correos de Gmail

```bash
curl -X POST http://localhost:3000/api/extract/gmail \
  -H "Content-Type: application/json" \
  -d '{
    "query": "is:unread",
    "limit": 5
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "count": 3,
  "messages": [
    {
      "id": "18d...",
      "from": "jefe@empresa.com",
      "subject": "Reunión importante",
      "date": "2026-06-28T10:30:00Z",
      "preview": "Por favor revisar el documento adjunto..."
    }
  ]
}
```

### Test 2: Extraer Contenido de Google Drive

```bash
curl -X POST http://localhost:3000/api/extract/drive \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "1aBcDeFgHiJkLmNoPqRsT",
    "contentType": "full"
  }'
```

### Test 3: Extraer Datos de Google Sheets

```bash
curl -X POST http://localhost:3000/api/extract/sheets \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetId": "1aBcDeFgHiJkLmNoPqRsT",
    "range": "Sheet1!A1:Z100"
  }'
```

### Test 4: Generar Reporte

```bash
curl -X POST http://localhost:3000/api/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Reporte Mensual",
    "date": "Junio 2026",
    "executiveSummary": "Resumen de actividades...",
    "includePriorities": true,
    "includeRecommendations": true
  }'
```

### Test 5: Enviar Reporte

```bash
curl -X POST http://localhost:3000/api/send-report \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["jefe@empresa.com"],
    "subject": "Reporte Ejecutivo - Junio 2026",
    "htmlContent": "<h1>Mi Reporte</h1>..."
  }'
```

---

## 🌐 Acceder a la Interfaz Web

1. Abre http://localhost:3000 en tu navegador

2. Deberías ver:
   ```
   📈 Generador de Reportes Ejecutivos
   Integración con Google Workspace
   ```

3. Empieza a agregar fuentes de datos y generar reportes

---

## 🚀 Despliegue en Producción

### Opción 1: Heroku

```bash
# 1. Crear aplicación en Heroku
heroku create mi-generador-reportes

# 2. Configurar variables de entorno
heroku config:set GOOGLE_CLIENT_ID=...
heroku config:set GOOGLE_CLIENT_SECRET=...
heroku config:set EMAIL_PASSWORD=...
# ... etc

# 3. Desplegar
git push heroku main

# 4. Ver logs
heroku logs --tail
```

### Opción 2: AWS Lambda + API Gateway

```bash
# Usar SAM (Serverless Application Model)
sam init
sam build
sam deploy --guided
```

### Opción 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Construir imagen
docker build -t generador-reportes .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env generador-reportes
```

### Opción 4: VPS (DigitalOcean, Linode, etc.)

```bash
# 1. Conectar por SSH
ssh root@tu_ip

# 2. Instalar Node
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clonar proyecto
git clone https://github.com/tu-empresa/generador-reportes.git
cd generador-reportes

# 4. Instalar dependencias
npm install

# 5. Crear archivo .env con valores de producción
nano .env

# 6. Usar PM2 para ejecutar en background
npm install -g pm2
pm2 start backend-server.js --name "reportes"
pm2 startup
pm2 save

# 7. Configurar Nginx como proxy
sudo apt-get install nginx
# ... configurar nginx.conf ...

# 8. Certificado SSL
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d tu-dominio.com
```

---

## 🔧 Solución de Problemas

### Error: "ENOENT: no such file or directory, open '.env'"

**Solución:**
```bash
cp .env.example .env
# Edita .env con tus valores
```

### Error: "Invalid client id"

**Solución:**
- Verifica que `GOOGLE_CLIENT_ID` en `.env` sea correcto
- Descarga nuevas credenciales de Google Cloud Console

### Error: "Gmail API error: 401 Unauthorized"

**Solución:**
- Reautentica: ve a http://localhost:3000/auth/google
- Elimina `token.json` si existe
- Reinicia el servidor

### Error: "listen EADDRINUSE :::3000"

**Solución (cambiar puerto):**
```bash
# En .env
PORT=3001

# O matar proceso existente
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Mac/Linux
lsof -i :3000
kill -9 [PID]
```

---

## 📝 Próximos Pasos

1. ✅ Instalación completada
2. 🔐 Autenticación configurada
3. 📊 Primeros reportes generados
4. 📧 Reportes enviados automáticamente
5. 🔄 Programar ejecución periódica (cron jobs)

---

## 📞 Soporte

- **Documentación:** Consulta GUIA_INTEGRACION.md
- **API Docs:** http://localhost:3000/api/docs (próximamente)
- **Issues:** GitHub issues
- **Email:** soporte@empresa.com

---

**¡Listo para empezar a generar reportes!** 🎉
