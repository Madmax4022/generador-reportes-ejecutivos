# Imagen para desplegar AutoReport SaaS en cualquier host con Docker
# (Railway, Fly.io, Cloud Run, etc.). Build context: la carpeta saas/.
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
# El host asigna el puerto vía la variable PORT; el server ya la respeta.
EXPOSE 4000

CMD ["node", "server.js"]
