# 📈 AutoReport — SaaS MVP (Fase 1)

Versión SaaS del generador de reportes: pensada para **venderse por suscripción** a
agencias y consultores. Conectas Google **una vez** y los reportes se generan y envían
en automático (diario / semanal / mensual).

> Esta es la **Fase 1** (la base). Ver el roadmap al final.

---

## ✅ Pruébalo en 1 minuto (modo demo, sin configurar nada)

```bash
cd saas
npm install
npm start
```

Abre **http://localhost:4000**. Sin credenciales de Google, arranca en **modo demo**:
puedes recorrer todo el producto (conectar, armar el reporte, vista previa, programar).
Los envíos son **simulados** en demo.

## 🟢 Activar Google real (cuando quieras)

Tú —dueño del SaaS— registras **una sola** app de Google que sirve a **todos** tus clientes:

1. En https://console.cloud.google.com crea credenciales **OAuth (aplicación web)**.
2. Redirect URI autorizado: `http://localhost:4000/auth/google/callback`
   (o `https://tu-dominio.com/auth/google/callback` en producción).
3. Copia el archivo de configuración y rellena las claves:
   ```bash
   cp .env.example .env
   # edita GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
   ```
4. `npm start`. Ahora tus clientes solo hacen clic en **“Conectar con Google”** — sin
   tocar Google Cloud, terminal ni `.env`. Esa es la clave de que sea "para no técnicos".

---

## 🧱 Qué incluye la Fase 1

- **OAuth de Google hospedado y multi-cliente** (login = "Conectar con Google").
- **Modo demo** automático para ver el producto sin setup.
- **Panel amigable**: armar reporte, vista previa en vivo, enviar ahora.
- **Programación automática** (diario / semanal / mensual) con `node-cron`.
- **Envío por el Gmail del propio usuario** vía API de Google.
- Almacén simple en JSON (se reemplaza por una base de datos real en producción).

## 🗺️ Roadmap

- **Fase 2** — Plantillas guardadas, más fuentes (Drive/Sheets), branding por cliente.
- **Fase 3** — Facturación con Stripe, prueba gratis, página de ventas.
- **Fase 4** — Soporte Microsoft 365 (Outlook/OneDrive/Excel), exportar a PDF, white-label.

## ⚠️ Notas para producción (aún pendientes)

- Reemplazar el almacén JSON por una base de datos (Postgres) y **cifrar los tokens**.
- Servir bajo **HTTPS** y configurar el dominio real en el Redirect URI.
- Refresco automático de tokens y manejo de revocación.
- Esta carpeta es independiente de `v1.0/` y `v2.0/` (el producto original sigue intacto).
