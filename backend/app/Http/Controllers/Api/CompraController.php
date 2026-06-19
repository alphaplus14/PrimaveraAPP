<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompraController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $compras = Compra::with(['producto', 'proveedor'])
            ->when($request->desde, fn ($q) => $q->where('fecha', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('fecha', '<=', $request->hasta))
            ->orderByDesc('fecha')
            ->paginate(50);

        return response()->json($compras);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fecha' => 'required|date',
            'proveedor_id' => 'required|exists:proveedores,id',
            'producto_id' => 'required|exists:productos,id',
            'cantidad_kg' => 'required|numeric|min:0.001',
            'precio_unitario' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string|max:1000',
        ], [
            'fecha.required' => 'La fecha es obligatoria.',
            'proveedor_id.required' => 'El proveedor es obligatorio.',
            'proveedor_id.exists' => 'El proveedor no existe.',
            'producto_id.required' => 'El producto es obligatorio.',
            'producto_id.exists' => 'El producto no existe.',
            'cantidad_kg.required' => 'La cantidad en kg es obligatoria.',
            'cantidad_kg.min' => 'La cantidad debe ser mayor a cero.',
            'precio_unitario.required' => 'El precio unitario es obligatorio.',
        ]);

        $data['total'] = round($data['cantidad_kg'] * $data['precio_unitario'], 2);

        $compra = DB::transaction(function () use ($data) {
            $compra = Compra::create($data);

            // Actualizar inventario
            $inventario = Inventario::firstOrCreate(
                ['producto_id' => $data['producto_id']],
                ['cantidad_kg' => 0]
            );
            $inventario->increment('cantidad_kg', $data['cantidad_kg']);
            $inventario->update(['fecha_actualizacion' => now()]);

            // Registrar movimiento
            MovimientoInventario::create([
                'producto_id' => $data['producto_id'],
                'tipo' => 'compra',
                'cantidad_kg' => $data['cantidad_kg'],
                'fecha' => $data['fecha'],
                'referencia_id' => $compra->id,
            ]);

            return $compra;
        });

        return response()->json([
            'data' => $compra->load(['producto', 'proveedor']),
        ], 201);
    }

    public function show(Compra $compra): JsonResponse
    {
        return response()->json([
            'data' => $compra->load(['producto', 'proveedor']),
        ]);
    }
}
