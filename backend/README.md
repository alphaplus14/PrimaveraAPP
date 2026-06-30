# PrimaveraAPP — Backend (API Laravel)

API REST de **PrimaveraAPP**, el sistema de gestión de la finca. Construida con **Laravel 12**, autenticación por tokens con **Sanctum** y segundo factor con **Fortify**.

> 📖 Para la guía de instalación completa (backend + frontend), revisa el [README principal](../README.md).

---

## Requisitos

- PHP 8.2+ con extensiones `pdo_mysql`, `mbstring`, `openssl`, `curl`, `fileinfo`, `intl`, `zip`, `gd`.
- Composer.
- MySQL (para tests también `pdo_sqlite`).

## Puesta en marcha rápida

```bash
composer install
cp .env.example .env
php artisan key:generate
# Editar .env: cambiar DB_CONNECTION=mysql y datos de la BD
php artisan migrate --seed
php artisan serve
```

La API queda en `http://127.0.0.1:8000`.

## Variables de entorno relevantes

| Variable | Descripción |
|----------|-------------|
| `DB_CONNECTION` | `mysql` en desarrollo/producción (el ejemplo viene en `sqlite`) |
| `APP_TIMEZONE` | Zona horaria (`America/Bogota`) |
| `APP_LOCALE` | Idioma (`es`) |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` | Admin inicial que crea el seeder |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos en producción (coma-separados) |
| `SANCTUM_STATEFUL_DOMAINS` | Dominios del frontend SPA |

## Tests

Usan SQLite en memoria, por lo que el PHP debe tener `pdo_sqlite` habilitado (ver README principal).

```bash
php artisan test
```

Cobertura: autenticación, ventas (descuento de stock y advertencia por stock insuficiente) y compras (reventa vs. insumo de finca).

## Estructura

```
app/
├── Http/Controllers/Api/   # Un controller por módulo
├── Models/                 # Modelos Eloquent
├── Services/               # Lógica de inventario y transacciones
└── Support/                # Helpers de dominio
database/
├── migrations/             # Esquema de la BD
└── seeders/                # Datos iniciales y de demo
routes/api.php              # Endpoints de la API
tests/Feature/              # Tests de funcionalidad
```

## Módulos de la API

Autenticación (Sanctum + 2FA), Productos, Precios (con revisión diaria), Inventario (productos e insumos), Compras (reventa / insumo de finca), Ventas, Transformaciones (pulpas), Labores y Cosecha (colaboradores), Reportes (ventas, compras, movimientos, rentabilidad, cosechas), Proveedores y Clientes.

## Despliegue

Guía de despliegue en VPS: [`../docs/despliegue-vps.md`](../docs/despliegue-vps.md).
