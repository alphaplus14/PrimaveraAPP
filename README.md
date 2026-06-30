# 🌿 PrimaveraAPP

Sistema de gestión para finca productiva — inventario, compras, ventas, precios, pulpas, labores/cosecha y reportes.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Backend | Laravel 12 + Sanctum + Fortify (2FA) |
| Base de datos | MySQL (producción/desarrollo) · SQLite (solo tests) |

---

## Requisitos previos

Instalar en el computador antes de empezar:

- **[PHP 8.2+](https://www.php.net/downloads)** con las extensiones: `pdo_mysql`, `mbstring`, `openssl`, `curl`, `fileinfo`, `intl`, `zip`, `gd`.
  Para correr los tests también se necesita **`pdo_sqlite`** (ver sección [Tests](#ejecutar-tests)).
- **[Composer](https://getcomposer.org/)** (gestor de dependencias de PHP).
- **[Node.js 18+](https://nodejs.org/)** (incluye `npm`).
- **MySQL** — se recomienda [XAMPP](https://www.apachefriends.org/) para desarrollo local.

> 💡 Si vienes de descargar esta rama, basta con seguir la sección **Instalación**: ahí se listan todos los comandos para dejar el proyecto corriendo.

---

## Dependencias del proyecto

No hace falta instalarlas a mano: `composer install` y `npm install` las descargan a partir de `composer.json` y `package.json`. Esta lista es solo de referencia.

### Backend (Composer)

| Paquete | Para qué sirve |
|---------|----------------|
| `laravel/framework` ^12 | Framework principal |
| `laravel/sanctum` ^4 | Autenticación por tokens (API) |
| `laravel/fortify` ^1 | Login + segundo factor (2FA) |
| `laravel/tinker` | Consola interactiva |
| *(dev)* `phpunit/phpunit`, `nunomaduro/collision`, `mockery`, `fakerphp/faker`, `laravel/pint` | Tests y formateo |

### Frontend (npm)

| Paquete | Para qué sirve |
|---------|----------------|
| `react` / `react-dom` ^19 | Librería de UI |
| `react-router-dom` ^7 | Ruteo de la SPA |
| `axios` | Llamadas HTTP a la API |
| `tailwindcss` + `@tailwindcss/vite` ^4 | Estilos |
| `recharts` | Gráficas de reportes |
| `sweetalert2` | Diálogos / alertas |
| *(dev)* `vite` ^8, `@vitejs/plugin-react`, `eslint` y plugins | Bundler y linting |

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd PrimaveraAPP
```

### 2. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Editar el archivo `.env`. **Por defecto `.env.example` viene configurado para SQLite**, así que para usar MySQL hay que cambiar la conexión:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=primavera
DB_USERNAME=root
DB_PASSWORD=
```

> En XAMPP el usuario es `root` y la contraseña va vacía por defecto.

Variables adicionales que conviene revisar en `.env`:

```env
APP_TIMEZONE=America/Bogota         # zona horaria de la finca
APP_LOCALE=es                        # idioma de la app

# Admin inicial que crea el seeder (cambiar en producción)
ADMIN_EMAIL=admin@primavera.com
ADMIN_NAME=Administrador
ADMIN_PASSWORD=admin123

# Orígenes permitidos por CORS en producción (separados por coma)
# Ej: CORS_ALLOWED_ORIGINS=https://finca.midominio.com
CORS_ALLOWED_ORIGINS=
```

Crear la base de datos `primavera` en phpMyAdmin (cotejamiento `utf8mb4_unicode_ci`), luego:

```bash
php artisan migrate --seed
php artisan serve
```

El backend queda corriendo en `http://127.0.0.1:8000`.

> El `--seed` crea el usuario admin y, **solo fuera de producción**, datos de demostración para probar la app.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend queda corriendo en `http://localhost:5174`.

---

## Acceso

| Campo | Valor |
|-------|-------|
| URL | http://localhost:5174 |
| Email | el de `ADMIN_EMAIL` (por defecto `admin@primavera.com`) |
| Contraseña | la de `ADMIN_PASSWORD` (por defecto `admin123`) |

> **Cambiar la contraseña** después del primer inicio de sesión.

---

## Ejecutar tests

Los tests usan una base de datos **SQLite en memoria**, por lo que el PHP de tu sistema debe tener habilitada la extensión `pdo_sqlite`.

En Windows, si no está activa, edita tu `php.ini` y descomenta la línea (quita el `;`):

```ini
extension=pdo_sqlite
```

Verifica que quedó activa con `php -m` (debe aparecer `pdo_sqlite`). Luego, desde `backend/`:

```bash
php artisan test
```

Cobertura actual: autenticación, ventas (descuento de stock y advertencia por stock insuficiente) y compras (reventa vs. insumo de finca).

---

## Estructura del proyecto

```
PrimaveraAPP/
├── backend/          # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Controllers por módulo
│   │   ├── Models/                 # Modelos Eloquent
│   │   ├── Services/               # Lógica de inventario, etc.
│   │   └── Support/                # Helpers de dominio
│   ├── database/
│   │   ├── migrations/             # Migraciones de tablas
│   │   └── seeders/                # Datos iniciales
│   ├── routes/api.php              # Endpoints de la API
│   └── tests/Feature/              # Tests de funcionalidad
│
├── frontend/         # SPA React
│   └── src/
│       ├── api/          # Funciones de llamada al backend
│       ├── components/   # Componentes reutilizables (incl. ErrorBoundary)
│       ├── context/      # AuthContext (sesión)
│       ├── hooks/        # Hooks personalizados
│       ├── lib/          # Utilidades (cálculo de pagos, etc.)
│       └── pages/        # Páginas por módulo
│
└── docs/             # Documentación
    └── despliegue-vps.md   # Guía de despliegue en VPS (Hostinger)
```

---

## Módulos disponibles

- **Dashboard** — resumen del día, alertas de stock bajo, accesos rápidos
- **Productos** — catálogo con categorías (propio / comprado / pulpa) y filtro "con compras"
- **Precios** — precios detal/mayorista con historial y revisión diaria al entrar
- **Inventario** — stock de productos e insumos, ajustes manuales con motivo
- **Compras** — compras a proveedores diferenciando reventa vs. insumo de finca
- **Ventas** — registro de ventas con autocompletado de precio y aviso de stock
- **Transformaciones** — conversión de fruta excedente en pulpas
- **Labores / Cosecha** — labores con insumos; cosechas con colaboradores y pago por kg o por día
- **Reportes** — ventas, compras, movimientos, rentabilidad por producto y cosechas
- **Proveedores / Clientes** — directorios para compras y ventas

---

## Despliegue en producción

La guía completa para desplegar en un VPS (Hostinger) — Nginx, HTTPS con Certbot, build del frontend y configuración del backend — está en [`docs/despliegue-vps.md`](docs/despliegue-vps.md).

---

## Notas de desarrollo

- La API corre en el puerto `8000` y el frontend en `5174`.
- En desarrollo, Vite hace **proxy** de `/api` al backend (evita errores CORS). No hace falta apuntar axios a `127.0.0.1:8000` directamente.
- Si ves error CORS: confirma que `php artisan serve` está corriendo y reinicia `npm run dev`.
- En producción, los orígenes permitidos se controlan con `CORS_ALLOWED_ORIGINS`.
- La sesión guardada se valida contra el backend al arrancar la app; si el token venció, se cierra sesión automáticamente.
- Todos los mensajes de error están en español.
- Unidad de medida universal: **kilogramos (kg)**.
.