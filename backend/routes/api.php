<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\PrecioController;
use App\Http\Controllers\Api\InventarioController;
use App\Http\Controllers\Api\ProveedorController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\CompraController;
use App\Http\Controllers\Api\VentaController;
use App\Http\Controllers\Api\TransformacionController;
use App\Http\Controllers\Api\InsumoController;
use App\Http\Controllers\Api\LaborController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\CreditoController;
use App\Http\Controllers\Api\PriceReviewController;

// Autenticación pública (con límite de intentos para frenar fuerza bruta)
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

// 2FA challenge (público, pero protegido por two_factor_token temporal en cache)
Route::post('/two-factor-challenge', [TwoFactorController::class, 'challenge'])
    ->middleware('throttle:6,1');

// Rutas protegidas con Sanctum
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Revisión diaria de precios
    Route::get('/user/price-review', [PriceReviewController::class, 'status']);
    Route::post('/user/price-review/complete', [PriceReviewController::class, 'complete']);
    Route::post('/user/price-review/skip', [PriceReviewController::class, 'skip']);
    Route::get('/precios/revision-diaria', [PriceReviewController::class, 'revisionDiaria']);

    // 2FA management
    Route::get('/user/two-factor-status', [TwoFactorController::class, 'status']);
    Route::post('/user/two-factor-authentication', [TwoFactorController::class, 'enable']);
    Route::post('/user/confirmed-two-factor-authentication', [TwoFactorController::class, 'confirm']);
    Route::delete('/user/two-factor-authentication', [TwoFactorController::class, 'disable']);
    Route::get('/user/two-factor-recovery-codes', [TwoFactorController::class, 'recoveryCodes']);
    Route::post('/user/two-factor-recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes']);

    // Catálogo de productos
    Route::get('productos/con-compras', [ProductoController::class, 'conCompras']);
    Route::apiResource('productos', ProductoController::class);

    // Precios (historial por producto)
    Route::get('productos/{producto}/precios', [PrecioController::class, 'index']);
    Route::post('productos/{producto}/precios', [PrecioController::class, 'store']);
    Route::get('productos/{producto}/precio-actual', [PrecioController::class, 'current']);

    // Inventario
    Route::get('inventario', [InventarioController::class, 'index']);
    Route::get('inventario/{producto}', [InventarioController::class, 'show']);
    Route::patch('inventario/{producto}/ajuste', [InventarioController::class, 'adjust']);

    // Proveedores y clientes
    Route::apiResource('proveedores', ProveedorController::class);
    Route::apiResource('clientes', ClienteController::class);

    // Créditos / fiado
    Route::get('creditos', [CreditoController::class, 'index']);
    Route::post('creditos/abonos', [CreditoController::class, 'storePayment']);

    // Compras y ventas
    Route::apiResource('compras', CompraController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('ventas', VentaController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

    // Transformaciones
    Route::apiResource('transformaciones', TransformacionController::class)->only(['index', 'store', 'show']);

    // Insumos y labores
    Route::apiResource('insumos', InsumoController::class);
    Route::apiResource('labores', LaborController::class);

    // Reportes
    Route::get('reportes/ventas', [ReporteController::class, 'ventas']);
    Route::get('reportes/compras', [ReporteController::class, 'compras']);
    Route::get('reportes/inventario', [ReporteController::class, 'inventario']);
    Route::get('reportes/movimientos', [ReporteController::class, 'movimientos']);
    Route::get('reportes/rentabilidad', [ReporteController::class, 'rentabilidad']);
    Route::get('reportes/origen', [ReporteController::class, 'origen']);
    Route::get('reportes/labores', [ReporteController::class, 'labores']);
});
