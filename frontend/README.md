# PrimaveraAPP — Frontend (SPA React)

Interfaz web de **PrimaveraAPP**, el sistema de gestión de la finca. Construida con **React 19**, **Vite 8** y **Tailwind CSS 4**. Consume la API del backend Laravel.

> 📖 Para la guía de instalación completa (backend + frontend), revisa el [README principal](../README.md).

---

## Requisitos

- Node.js 18+ (incluye `npm`).
- El backend corriendo en `http://127.0.0.1:8000` (ver [README del backend](../backend/README.md)).

## Puesta en marcha rápida

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5174`.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Compila a producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run lint` | Ejecuta ESLint |

## Dependencias principales

| Paquete | Para qué sirve |
|---------|----------------|
| `react` / `react-dom` | Librería de UI |
| `react-router-dom` | Ruteo de la SPA |
| `axios` | Llamadas HTTP a la API |
| `tailwindcss` + `@tailwindcss/vite` | Estilos |
| `recharts` | Gráficas de reportes |
| `sweetalert2` | Diálogos y alertas |

## Conexión con la API

- En desarrollo, Vite hace **proxy** de `/api` hacia el backend (`vite.config.js`), evitando errores CORS.
- En producción, la URL de la API se controla con la variable `VITE_API_URL` al hacer el build.
- La sesión guardada se valida contra el backend al arrancar la app; si el token venció, se cierra sesión automáticamente.

## Estructura

```
src/
├── api/          # Funciones de llamada al backend (axios)
├── components/   # Componentes reutilizables (incl. ErrorBoundary, Modal)
├── context/      # AuthContext (sesión y 2FA)
├── hooks/        # Hooks personalizados
├── lib/          # Utilidades (cálculo de pagos, tipos de labor, etc.)
├── constants/    # Etiquetas y enums
└── pages/        # Páginas por módulo
```

## Módulos / páginas

Login (con 2FA), Dashboard, Productos, Precios (revisión diaria), Inventario, Compras, Ventas, Transformaciones, Labores/Cosecha, Reportes, Proveedores y Clientes.
