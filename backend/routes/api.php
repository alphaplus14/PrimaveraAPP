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

// Autenticación pública
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas con Sanctum
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Catálogo de productos
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

    // Compras y ventas
    Route::apiResource('compras', CompraController::class)->only(['index', 'store', 'show']);
    Route::apiResource('ventas', VentaController::class)->only(['index', 'store', 'show']);

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
});