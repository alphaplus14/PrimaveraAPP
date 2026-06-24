# 🌿 PrimaveraAPP

Sistema de gestión para finca productiva — inventario, compras, ventas, pulpas y labores.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| Backend | Laravel 12 + Sanctum |
| Base de datos | MySQL |

---

## Requisitos previos

Instalar en el computador antes de empezar:

- [PHP 8.2+](https://www.php.net/downloads) y [Composer](https://getcomposer.org/)
- [Node.js 18+](https://nodejs.org/)
- MySQL (se recomienda [XAMPP](https://www.apachefriends.org/) para desarrollo local)

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

Editar el archivo `.env` con los datos de la base de datos:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=primavera
DB_USERNAME=root
DB_PASSWORD=
```

> En XAMPP el usuario es `root` y la contraseña va vacía por defecto.

Crear la base de datos `primavera` en phpMyAdmin (cotejamiento `utf8mb4_unicode_ci`), luego:

```bash
php artisan migrate --seed
php artisan serve
```

El backend queda corriendo en `http://127.0.0.1:8000`.

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
| Email | admin@primavera.com |
| Contraseña | admin123 |

> **Cambiar la contraseña** después del primer inicio de sesión.

---

## Estructura del proyecto

```
PrimaveraAPP/
├── backend/          # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Controllers por módulo
│   │   └── Models/                 # Modelos Eloquent
│   ├── database/
│   │   ├── migrations/             # Migraciones de tablas
│   │   └── seeders/                # Datos iniciales
│   └── routes/api.php              # Endpoints de la API
│
└── frontend/         # SPA React
    └── src/
        ├── api/          # Funciones de llamada al backend
        ├── components/   # Componentes reutilizables
        ├── context/      # AuthContext (sesión)
        ├── hooks/        # Hooks personalizados
        └── pages/        # Páginas por módulo
```

---

## Módulos disponibles

- **Dashboard** — resumen del día, alertas de stock bajo, accesos rápidos
- **Productos** — catálogo con categorías (propio / comprado / pulpa)
- **Inventario** — stock actual, ajustes manuales con motivo
- **Compras** — registro de compras a proveedores (actualiza inventario)
- **Ventas** — registro de ventas con múltiples productos por venta

---

## Notas de desarrollo

- La API corre en el puerto `8000` y el frontend en `5174`
- En desarrollo, Vite hace **proxy** de `/api` al backend (evita errores CORS). No hace falta apuntar axios a `127.0.0.1:8000` directamente.
- Si ves error CORS: confirma que `php artisan serve` está corriendo y reinicia `npm run dev`
- CORS explícito para `localhost:5174` en `backend/config/cors.php`
- Todos los mensajes de error están en español
- Unidad de medida universal: **kilogramos (kg)**
