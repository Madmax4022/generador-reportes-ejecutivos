# ⏰ Automatización y Programación de Reportes

## 📋 Tabla de Contenidos
1. [Cron Jobs](#cron-jobs-linux--macos)
2. [Windows Task Scheduler](#windows-task-scheduler)
3. [Google Cloud Scheduler](#google-cloud-scheduler)
4. [Node.js con node-cron](#nodejs-con-node-cron)

---

## 🐧 Cron Jobs (Linux / macOS)

### ¿Qué es Cron?
Sistema de Linux/macOS que ejecuta tareas en horarios específicos automáticamente.

### Sintaxis Cron
```
┌───────────── minuto (0-59)
│ ┌───────────── hora (0-23)
│ │ ┌───────────── día del mes (1-31)
│ │ │ ┌───────────── mes (1-12)
│ │ │ │ ┌───────────── día de la semana (0-7, 0 y 7 son domingo)
│ │ │ │ │
│ │ │ │ │
* * * * * comando_a_ejecutar

Ejemplo: 0 9 * * MON
         ↓ ↓ ↓ ↓ ↓
         0 9 * * 1  → 9:00 AM todos los lunes
```

### Acceder a Crontab

```bash
# Editar crontab del usuario actual
crontab -e

# Ver crontab actual
crontab -l

# Eliminar crontab
crontab -r
```

### Ejemplos de Tareas Programadas

#### 1️⃣ Reporte Diario a las 9 AM

```bash
0 9 * * * /usr/bin/node /home/usuario/generador-reportes/daily-report.js >> /var/log/reportes.log 2>&1
```

#### 2️⃣ Reporte Semanal (lunes a las 8 AM)

```bash
0 8 * * 1 curl -X POST http://localhost:3000/api/generate-report \
  -H "Content-Type: application/json" \
  -d '{"title":"Reporte Semanal","date":"Semana $(date +%V)"}' >> /var/log/weekly-report.log 2>&1
```

#### 3️⃣ Reporte Mensual (Primer día del mes a las 10 AM)

```bash
0 10 1 * * /usr/bin/node /home/usuario/generador-reportes/monthly-report.js
```

#### 4️⃣ Múltiples reportes (Lunes, Miércoles, Viernes a las 5 PM)

```bash
0 17 * * 1,3,5 /usr/bin/node /home/usuario/generador-reportes/periodic-report.js
```

#### 5️⃣ Cada 2 horas

```bash
0 */2 * * * /usr/bin/node /home/usuario/generador-reportes/frequent-report.js
```

#### 6️⃣ Diariamente a las 5 PM (Lunes a Viernes)

```bash
0 17 * * 1-5 /usr/bin/node /home/usuario/generador-reportes/weekday-report.js
```

### Archivo Ejecutable: daily-report.js

```javascript
// daily-report.js
const axios = require('axios');
const fs = require('fs');

const generateReport = async () => {
  try {
    console.log(`[${new Date().toISOString()}] Iniciando reporte diario...`);

    // Extraer datos
    const gmailRes = await axios.post('http://localhost:3000/api/extract/gmail', {
      query: 'label:importante',
      limit: 10
    });

    // Generar reporte
    const reportRes = await axios.post('http://localhost:3000/api/generate-report', {
      title: `Reporte Diario - ${new Date().toLocaleDateString('es-ES')}`,
      date: new Date().toLocaleDateString('es-ES'),
      executiveSummary: `Se encontraron ${gmailRes.data.count} correos importantes`,
      dataSources: [],
      includePriorities: true,
      includeRecommendations: true
    });

    // Enviar por correo
    const sendRes = await axios.post('http://localhost:3000/api/send-report', {
      recipients: ['jefe@empresa.com'],
      subject: `Reporte Diario - ${new Date().toLocaleDateString('es-ES')}`,
      htmlContent: reportRes.data.content
    });

    console.log(`✅ Reporte enviado a ${sendRes.data.sentTo}`);
    
    // Guardar log
    fs.appendFileSync('/var/log/reportes.log', 
      `[${new Date().toISOString()}] ✅ Reporte generado y enviado\n`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    fs.appendFileSync('/var/log/reportes.log', 
      `[${new Date().toISOString()}] ❌ Error: ${error.message}\n`);
  }
};

generateReport();
```

### Verificar Logs

```bash
# Ver últimas líneas del log
tail -f /var/log/reportes.log

# Ver todos los cron jobs
sudo grep CRON /var/log/syslog  # Ubuntu/Debian
log stream --predicate 'eventMessage contains[cd] "cron"'  # macOS
```

---

## 🪟 Windows Task Scheduler

### Crear Nueva Tarea

1. Abre **Task Scheduler** (Programador de tareas)
2. Click en **"Create Basic Task"**
3. Ingresa un nombre: `"Reporte Diario"`
4. Click en **Next**

### Configurar Trigger (Cuándo)

1. Selecciona **"Daily"** (o la frecuencia deseada)
2. Ingresa la hora: **09:00**
3. Click en **Next**

### Configurar Acción (Qué hacer)

1. Selecciona **"Start a program"**
2. Program: `C:\Program Files\nodejs\node.exe`
3. Arguments: `C:\ruta\al\proyecto\daily-report.js`
4. Start in: `C:\ruta\al\proyecto`
5. Click en **Finish**

### Script PowerShell Alternativo

```powershell
# crear-tarea.ps1

# Ejecutar Node script cada día a las 9 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 09:00
$action = New-ScheduledTaskAction -Execute "C:\Program Files\nodejs\node.exe" `
  -Argument "daily-report.js" `
  -WorkingDirectory "C:\ruta\al\proyecto"

Register-ScheduledTask -TaskName "ReporteDiario" `
  -Trigger $trigger `
  -Action $action `
  -RunLevel Highest

# Ejecutar en PowerShell (como administrador)
```

### Ver Tareas Programadas

```powershell
# Listar todas las tareas
Get-ScheduledTask

# Ver tarea específica
Get-ScheduledTask -TaskName "ReporteDiario"

# Ejecutar tarea manualmente
Start-ScheduledTask -TaskName "ReporteDiario"

# Deshabilitar tarea
Disable-ScheduledTask -TaskName "ReporteDiario"

# Eliminar tarea
Unregister-ScheduledTask -TaskName "ReporteDiario" -Confirm:$false
```

---

## ☁️ Google Cloud Scheduler

### Configurar Cloud Scheduler

1. Ve a Google Cloud Console
2. **"Cloud Scheduler"** → **"Create Job"**
3. Configura:

```
Nombre:        "Reporte-Diario"
Frecuencia:    "0 9 * * *"  (9 AM todos los días)
Timezone:      "America/Mexico_City" (o tu zona)
Execution:     HTTP POST
URL:           "https://tu-dominio.com/api/generate-report"
Auth header:   "Add OIDC token"
Service account: [Tu service account]
```

4. Click en **"Create"**

### Ejemplo de Job

```yaml
# scheduler-config.yaml
apiVersion: cloudscheduler.cnrm.cloud.google.com/v1beta1
kind: CloudSchedulerJob
metadata:
  name: reporte-diario
spec:
  schedule: "0 9 * * *"
  timeZone: "America/Mexico_City"
  httpTarget:
    uri: "https://tu-dominio.com/api/generate-report"
    httpMethod: POST
    body: |
      {
        "title": "Reporte Diario",
        "includeRecommendations": true
      }
    headers:
      Content-Type: "application/json"
```

---

## 📦 Node.js con node-cron

### Instalación

```bash
npm install node-cron
```

### Implementación en el Servidor

```javascript
// backend-server.js (agregar al final)

const cron = require('node-cron');

// Reporte diario a las 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('🕘 Ejecutando reporte diario...');
  try {
    const response = await generateAutomaticReport({
      title: `Reporte Diario - ${new Date().toLocaleDateString('es-ES')}`,
      recipients: ['jefe@empresa.com']
    });
    console.log('✅ Reporte diario completado');
  } catch (error) {
    console.error('❌ Error en reporte diario:', error);
  }
});

// Reporte semanal (lunes a las 8 AM)
cron.schedule('0 8 * * 1', async () => {
  console.log('🕘 Ejecutando reporte semanal...');
  try {
    const response = await generateAutomaticReport({
      title: `Reporte Semanal - Semana ${getWeekNumber()}`,
      recipients: ['jefe@empresa.com', 'director@empresa.com']
    });
    console.log('✅ Reporte semanal completado');
  } catch (error) {
    console.error('❌ Error en reporte semanal:', error);
  }
});

// Reporte mensual (1° del mes a las 10 AM)
cron.schedule('0 10 1 * *', async () => {
  console.log('🕘 Ejecutando reporte mensual...');
  try {
    const response = await generateAutomaticReport({
      title: `Reporte Mensual - ${new Date().toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
      })}`,
      recipients: ['jefe@empresa.com']
    });
    console.log('✅ Reporte mensual completado');
  } catch (error) {
    console.error('❌ Error en reporte mensual:', error);
  }
});

// Función para generar reportes automáticos
async function generateAutomaticReport(config) {
  // Extraer datos de Gmail
  const gmailData = await extractGmailData(config.gmailQuery || 'label:importante');
  
  // Generar reporte
  const report = generateReportHTML({
    title: config.title,
    executiveSummary: `Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}`,
    dataSources: [{ type: 'manual', title: 'Datos Extraídos', content: JSON.stringify(gmailData) }]
  });

  // Enviar por correo
  return await sendEmailReport({
    to: config.recipients,
    subject: config.title,
    htmlContent: report
  });
}

function getWeekNumber() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
}

console.log('✅ Cron jobs configurados y activos');
```

### Patrones Útiles de Cron

```javascript
cron.schedule('0 0 * * *', task);        // Cada día a medianoche
cron.schedule('0 * * * *', task);        // Cada hora
cron.schedule('*/15 * * * *', task);     // Cada 15 minutos
cron.schedule('0 9 * * 1-5', task);      // Lunes a viernes a las 9 AM
cron.schedule('0 0 1 * *', task);        // 1° del mes a medianoche
cron.schedule('0 0 * * 0', task);        // Cada domingo a medianoche
cron.schedule('30 3 * * *', task);       // Todos los días a las 3:30 AM
```

---

## 📊 Tabla de Comparación

| Método | Ventaja | Desventaja | Mejor Para |
|--------|---------|-----------|-----------|
| **Cron (Linux)** | Nativo, ligero | Solo Linux/Mac | Servidores Unix |
| **Task Scheduler** | Nativo en Windows | Solo Windows | Servidores Windows |
| **Cloud Scheduler** | Sin mantenimiento | Requiere GCP | Producción en cloud |
| **node-cron** | Multiplataforma | Depende del servidor activo | Dev y producción |

---

## 🔔 Monitoreo de Tareas

### Alertas por Email

```javascript
// Agregar al server si una tarea falla
cron.schedule('0 9 * * *', async () => {
  try {
    await generateReport();
  } catch (error) {
    // Enviar alerta
    await sendAlert({
      to: 'admin@empresa.com',
      subject: '❌ Error en Reporte Diario',
      body: `Error: ${error.message}\n\nStack: ${error.stack}`
    });
  }
});
```

### Logging Centralizado

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'cron-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'cron.log' })
  ]
});

cron.schedule('0 9 * * *', async () => {
  logger.info('Iniciando reporte diario');
  try {
    await generateReport();
    logger.info('Reporte diario completado');
  } catch (error) {
    logger.error(`Error en reporte: ${error.message}`);
  }
});
```

---

## ✅ Checklist de Implementación

- ⬜ Elegir método de programación (Cron/Task Scheduler/Cloud Scheduler/node-cron)
- ⬜ Crear archivo de script ejecutable
- ⬜ Configurar schedule/trigger
- ⬜ Probar ejecución manual
- ⬜ Verificar logs
- ⬜ Configurar alertas de error
- ⬜ Documentar schedule
- ⬜ Hacer backup de configuración

---

## 📝 Documentación de Schedule

Crea un archivo `SCHEDULE.md` en tu proyecto:

```markdown
# Tareas Programadas - Generador de Reportes

## Tareas Activas

| Nombre | Frecuencia | Hora | Destinatarios |
|--------|-----------|------|---------------|
| Reporte Diario | Diariamente | 9:00 AM | jefe@empresa.com |
| Reporte Semanal | Lunes | 8:00 AM | jefe@, director@ |
| Reporte Mensual | 1° del mes | 10:00 AM | jefe@empresa.com |

## Mantenimiento

- Revisar logs semanalmente
- Actualizar destinatarios según cambios organizacionales
- Probar schedules cada trimestre
- Backup de configuración cada mes
```

---

**¡Automatización completada!** 🚀
