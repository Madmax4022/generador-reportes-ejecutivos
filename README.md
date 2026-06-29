# 📊 Generador de Reportes Ejecutivos

Aplicación para generar reportes automáticos desde **Google Workspace** y **Microsoft Office 365**.

## 🌐 Plataformas Soportadas

- **Google Workspace**: Gmail, Google Drive, Google Sheets
- **Microsoft 365**: Outlook, OneDrive, Excel Online

## 📁 Estructura del Proyecto

```
generador-reportes-ejecutivos/
├── v1.0/                          # Versión Solo Google
│   ├── backend-server.js
│   ├── ReporteExecutivo.html
│   ├── package.json
│   └── ...
│
├── v2.0/                          # Versión Google + Microsoft
│   ├── backend-server-MULTI.js
│   ├── ReporteExecutivo-MULTI.html
│   ├── package-MULTI.json
│   └── ...
│
├── docs/                          # Documentación
│   ├── INSTALACION.md
│   ├── MICROSOFT_365_SETUP.md
│   ├── GUIA_INTEGRACION.md
│   └── ...
│
└── README.md                      # Este archivo
```

## 🚀 Quick Start

### Opción 1: Solo Google Workspace
```bash
cd v1.0
npm install
cp .env.example .env
# Edita .env con tus credenciales de Google
npm start
```

### Opción 2: Solo Microsoft 365
```bash
cd v2.0
npm install
cp .env-MULTI.example .env
# Edita .env con tus credenciales de Microsoft
npm start
```

### Opción 3: AMBAS Plataformas (Recomendado)
```bash
cd v2.0
npm install
cp .env-MULTI.example .env
# Edita .env con AMBAS credenciales
npm start
```

## 📚 Documentación

- **[Guía de Instalación](docs/INSTALACION.md)** - Setup Google Workspace
- **[Setup Microsoft 365](docs/MICROSOFT_365_SETUP.md)** - Configuración Azure
- **[Guía de Integración](docs/GUIA_INTEGRACION.md)** - Uso técnico
- **[Comparación](docs/GOOGLE_vs_MICROSOFT.md)** - Google vs Microsoft
- **[Automatización](docs/AUTOMATIZACION.md)** - Cron, Task Scheduler

## 🔐 Seguridad

⚠️ **IMPORTANTE:**
- Nunca commits `.env` a Git
- Usa contraseñas de aplicación, no contraseñas principales
- Protege tus Client Secrets
- Revisa `.gitignore` antes de hacer push

## 💡 Características

- ✅ Extracción de múltiples fuentes
- ✅ Generación automática de reportes
- ✅ Envío por correo (Gmail/Outlook)
- ✅ Programación de tareas (Cron/Cloud Scheduler)
- ✅ Interfaz web intuitiva
- ✅ Soporte multiplataforma

## 📊 Versiones

| Característica | v1.0 | v2.0 |
|---|---|---|
| Google Workspace | ✅ | ✅ |
| Microsoft 365 | ❌ | ✅ |
| APIs soportadas | 3 | 6 |
| Interfaz | Estándar | Dual |

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

MIT - Ver archivo LICENSE

## 📞 Soporte

- 📖 Documentación completa en `/docs`
- 🐛 Issues: GitHub Issues
- 💬 Contacto: [tu-email@empresa.com]

## 🙏 Agradecimientos

Desarrollado para automatizar la generación de reportes ejecutivos desde múltiples plataformas.

---

**Versión:** 2.0.0  
**Última actualización:** Junio 2026  
**Estado:** Production Ready ✅
