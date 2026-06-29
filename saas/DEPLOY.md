# 🚀 Poner AutoReport en vivo (guía sin tecnicismos)

Meta: tener una **URL pública** (ej. `https://autoreport-saas.onrender.com`) que puedas
compartir con agencias para validar el producto.

Usaremos **Render** porque es lo más simple: conectas tu repo de GitHub, Render lee el
archivo `render.yaml` y configura casi todo solo.

---

## Parte A — Subirlo a Render (10 minutos)

1. Crea una cuenta gratis en **https://render.com** (puedes entrar con GitHub).
2. Arriba a la derecha: **New → Blueprint**.
3. Elige el repo **`generador-reportes-ejecutivos`**. Render detecta `render.yaml`.
4. Clic en **Apply**. Render empieza a construir la app.
5. Cuando termine, te dará una URL tipo `https://autoreport-saas.onrender.com`.

> Ya puedes abrir esa URL: la app funciona en **modo demo** (sin Google ni Stripe reales).
> Eso ya sirve para enseñar el producto a prospectos. Las partes B y C activan lo real.

💡 **Plan:** `render.yaml` usa el plan **starter** (~$7/mes) porque incluye un **disco
persistente** que guarda usuarios y la lista de espera. Si solo quieres demostrar y no te
importa perder datos al reiniciar, cambia `plan: starter` por `plan: free` y borra el bloque
`disk:` del archivo.

---

## Parte B — Activar Google real (para conectar Gmail de verdad)

1. En **https://console.cloud.google.com** crea credenciales **OAuth (aplicación web)**.
2. En "URIs de redirección autorizados" pon:
   `https://TU-URL.onrender.com/auth/google/callback`
   (reemplaza `TU-URL` por la que te dio Render).
3. En Render → tu servicio → **Environment**, rellena:
   - `BASE_URL` = `https://TU-URL.onrender.com`
   - `GOOGLE_CLIENT_ID` = (el de Google)
   - `GOOGLE_CLIENT_SECRET` = (el de Google)
4. **Save** → Render reinicia. El botón "Conectar con Google" ya funciona de verdad.

---

## Parte C — Activar cobros con Stripe (cuando quieras facturar)

1. En **https://dashboard.stripe.com** crea un **Producto** con un **precio recurrente**
   (ej. $99/mes). Copia el **Price ID** (`price_...`).
2. En Render → **Environment**, rellena:
   - `STRIPE_SECRET_KEY` = `sk_live_...` (o `sk_test_...` para probar)
   - `STRIPE_PRICE_ID` = `price_...`
3. Crea un **Webhook** en Stripe → endpoint:
   `https://TU-URL.onrender.com/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.deleted`
   - Copia el **Signing secret** (`whsec_...`) → ponlo en Render como `STRIPE_WEBHOOK_SECRET`.
4. **Save**. Ahora "Suscribirme" abre el pago real de Stripe.

---

## Parte D — Activar la redacción con IA (Claude)

1. Crea una API key en **https://console.anthropic.com**.
2. En Render → **Environment**, agrega:
   - `ANTHROPIC_API_KEY` = `sk-ant-...`
3. **Save**. Ahora la casilla "✨ Redactar con IA" usa Claude de verdad para
   redactar el resumen, la matriz de prioridades y las recomendaciones.

Sin la key, la IA corre en **modo demo** (contenido de ejemplo). El modelo por
defecto es `claude-opus-4-8`; puedes cambiarlo con `ANTHROPIC_MODEL`.
Costo aproximado: unos pocos centavos de USD por reporte generado.

---

## Resumen de variables (Render → Environment)

| Variable | Para qué | Obligatoria |
|---|---|---|
| `BASE_URL` | URL pública de tu app | Sí (B y C) |
| `SESSION_SECRET` | Seguridad de sesión | Render la genera sola |
| `DATA_DIR` | Carpeta del disco persistente | Ya configurada (`/var/data`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Conectar Gmail real | Para Google real |
| `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / `STRIPE_WEBHOOK_SECRET` | Cobros | Para facturar |
| `ANTHROPIC_API_KEY` | Redacción con IA (Claude) | Para IA real |

Sin ninguna de estas, todo corre en **modo demo** y la URL sigue siendo mostrable.

---

## Otros hosts (opcional)

- **Railway / Fly.io / Cloud Run:** usa el `Dockerfile` incluido (build context = `saas/`).
- **Heroku-style:** usa el `Procfile` incluido (`web: node server.js`).
En todos, configura las mismas variables de entorno de la tabla de arriba.

## ⚠️ Antes de cobrar a clientes reales

El almacén de datos es un archivo JSON (bien para validar). Para escala real conviene:
una base de datos (Postgres), **cifrar los tokens de Google**, y refresco automático de
tokens. Es la "Fase: Hardening" del roadmap.
