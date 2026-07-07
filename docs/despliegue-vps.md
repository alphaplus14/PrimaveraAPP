# Despliegue en VPS (Hostinger) — PrimaveraAPP

Guía para publicar el backend Laravel + el frontend React en un VPS Linux con Nginx, MySQL y PHP 8.2+.

Arquitectura recomendada: **un solo dominio**. Nginx sirve el frontend compilado (`dist/`) y hace proxy de `/api` al backend Laravel. Así no hay problemas de CORS.

```
https://finca.midominio.com/          → dist/ (React)
https://finca.midominio.com/api/...   → Laravel (php-fpm)
```

---

## 0. Requisitos en el VPS

```bash
# PHP 8.2+ con extensiones típicas de Laravel
sudo apt install php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml \
  php8.2-curl php8.2-zip php8.2-bcmath php8.2-gd unzip git nginx mysql-server

# Composer y Node 20+
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 1. Base de datos

```sql
CREATE DATABASE primavera CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'primavera'@'localhost' IDENTIFIED BY 'CONTRASEÑA_FUERTE';
GRANT ALL PRIVILEGES ON primavera.* TO 'primavera'@'localhost';
FLUSH PRIVILEGES;
```

---

## 2. Backend Laravel

```bash
cd /var/www
git clone <repo> primavera
cd primavera/backend

composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

Edita `.env` con los valores de **producción**:

```env
APP_NAME="Finca Primavera"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://finca.midominio.com
APP_TIMEZONE=America/Bogota
APP_LOCALE=es

LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=primavera
DB_USERNAME=primavera
DB_PASSWORD=CONTRASEÑA_FUERTE

# Mismo dominio → no hace falta CORS. Si el frontend va en otro dominio:
# CORS_ALLOWED_ORIGINS=https://finca.midominio.com

# Admin inicial (cámbialo)
ADMIN_EMAIL=admin@midominio.com
ADMIN_NAME=Administrador
ADMIN_PASSWORD=CONTRASEÑA_ADMIN_FUERTE
```

Migraciones, datos base y cachés:

```bash
php artisan migrate --force           # crea el esquema en MySQL limpio
php artisan db:seed --force           # admin + productos + precios + clientes
                                      # (los datos demo NO se cargan en production)

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

Permisos:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## 3. Frontend React

```bash
cd /var/www/primavera/frontend
npm ci

# Mismo dominio con proxy /api → usar el valor por defecto
echo "VITE_API_URL=/api" > .env.production

npm run build      # genera dist/
```

---

## 4. Nginx (un solo dominio)

`/etc/nginx/sites-available/primavera`:

```nginx
server {
    listen 80;
    server_name finca.midominio.com;
    root /var/www/primavera/frontend/dist;
    index index.html;

    # Frontend SPA: cualquier ruta desconocida cae en index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Laravel
    location /api {
        try_files $uri $uri/ @laravel;
    }

    location @laravel {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME /var/www/primavera/backend/public/index.php;
        include fastcgi_params;
        fastcgi_param REQUEST_URI $request_uri;
    }

    # Health check de Laravel
    location = /up {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME /var/www/primavera/backend/public/index.php;
        include fastcgi_params;
    }
}
```

> Alternativa más simple: servir el backend en su propia raíz `backend/public` con un `server` aparte y dejar el frontend en otro. Si lo haces en subdominios distintos, define `CORS_ALLOWED_ORIGINS` en el `.env` del backend.

Activar y recargar:

```bash
sudo ln -s /etc/nginx/sites-available/primavera /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. HTTPS (obligatorio en producción)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d finca.midominio.com
```

Certbot ajusta el `server` para redirigir a HTTPS. Tras activar TLS, asegúrate de que `APP_URL` use `https://`.

---

## 6. Verificación post-despliegue

- `https://finca.midominio.com/up` → debe responder OK (health check).
- Entrar a la app, iniciar sesión con el admin definido en `.env`.
- Revisar `backend/storage/logs/laravel.log` ante cualquier error.
- Confirmar que `APP_DEBUG=false` (no deben verse stack traces).

---

## 7. Actualizaciones futuras

```bash
cd /var/www/primavera
git pull

cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache

cd ../frontend
npm ci && npm run build
```

---

## Notas de seguridad ya aplicadas en el código

- **Rate limiting**: `POST /api/login` limitado a 5 intentos/min por usuario+IP; `/api/two-factor-challenge` a 6/min.
- **CORS** configurable por `CORS_ALLOWED_ORIGINS` (sin exponer a todo internet).
- **Datos demo** desactivados automáticamente cuando `APP_ENV=production`.
- **Admin inicial** parametrizable por `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Pendientes recomendados (no bloqueantes): ampliar tests automatizados (créditos, reportes) y expiración de tokens Sanctum.
