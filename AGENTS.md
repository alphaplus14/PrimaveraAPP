# PrimaveraAPP — Sistema de Gestión para Finca Productiva

Aplicación web para reemplazar registros en papel de una finca familiar colombiana: inventario, compras, ventas, pulpas, labores e insumos.

## Estructura del repositorio

```
PrimaveraAPP/
├── backend/     # Laravel 12 — API REST, Eloquent, Sanctum, MySQL
└── frontend/    # React 19 + Vite + Tailwind CSS 4 — SPA responsive
```

- Frontend y backend **separados**. El frontend consume la API del backend.
- Idioma de la UI y mensajes de negocio: **español**.
- Unidad de medida universal: **kilogramos (kg)**.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React, JavaScript, Tailwind CSS, Vite |
| Backend | PHP 8.2+, Laravel 12, Eloquent |
| Base de datos | MySQL |
| Auth | Laravel Sanctum (email + contraseña) |
| Despliegue | VPS Linux (Hostinger) |

## MVP vs futuro

**MVP:** un solo usuario administrador; interfaz responsive (mobile-first); formularios rápidos para ventas/compras diarias.

**Preparar sin implementar aún:** roles `admin` / `colaborador` con permisos diferenciados (campo `rol` en usuarios).

## Módulos funcionales (orden sugerido)

1. Autenticación (Sanctum)
2. Catálogo de productos
3. Gestión de precios (detal / mayorista + historial)
4. Inventario (stock + ajustes manuales)
5. Compras
6. Ventas
7. Transformación a pulpas
8. Labores de finca e insumos
9. Reportes

## Diseño UI

- Paleta: azul oscuro `#1a365d`, naranja `#f56523`
- Mobile-first, formularios simples, buen rendimiento en conexiones lentas (zona rural)

## Reglas de Cursor

Contexto detallado en `.cursor/rules/`:

- `project-context.mdc` — negocio, alcance MVP, módulos
- `data-model.mdc` — entidades y relaciones Eloquent
- `backend-laravel.mdc` — convenciones API Laravel
- `frontend-react.mdc` — convenciones React/Tailwind

## Fuente de verdad

Especificación funcional: `especificacion_sistema_finca` (documento PDF del proyecto).

Feedback operativo de la finca (jun 2026): `docs/feedback-stakeholders.md`, `docs/estado-vs-feedback.md`.
