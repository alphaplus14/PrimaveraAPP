<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Venta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ventas = Venta::with(['producto', 'cliente'])
            ->when($request->desde, fn ($q) => $q->where('fecha', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('fecha', '<=', $request->hasta))
            ->orderByDesc('fecha')
            ->paginate(50);

        return response()->json($ventas);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fecha'           => 'required|date',
            'cliente_id'      => 'required|exists:clientes,id',
            'producto_id'     => 'required|exists:productos,id',
            'cantidad_kg'     => 'required|numeric|min:0.001',
            'tipo_venta'      => 'required|in:detal,mayorista',
            'precio_unitario' => 'required|numeric|min:0',
            'force'           => 'sometimes|boolean',
        ], [
            'fecha.required'           => 'La fecha es obligatoria.',
            'cliente_id.required'      => 'El cliente es obligatorio.',
            'cliente_id.exists'        => 'El cliente no existe.',
            'producto_id.required'     => 'El producto es obligatorio.',
            'producto_id.exists'       => 'El producto no existe.',
            'cantidad_kg.min'          => 'La cantidad debe ser mayor a cero.',
            'tipo_venta.required'      => 'El tipo de venta es obligatorio.',
            'tipo_venta.in'            => 'El tipo debe ser detal o mayorista.',
            'precio_unitario.required' => 'El precio unitario es obligatorio.',
        ]);

        $inventario = Inventario::where('producto_id', $data['producto_id'])->first();
        $stockActual = $inventario ? (float) $inventario->cantidad_kg : 0;
        $stockInsuficiente = $stockActual < $data['cantidad_kg'];

        if ($stockInsuficiente && ! ($data['force'] ?? false)) {
            return response()->json([
                'message'            => 'Stock insuficiente.',
                'advertencia'        => true,
                'stock_actual'       => $stockActual,
                'cantidad_solicitada' => $data['cantidad_kg'],
            ], 422);
        }

        $data['total'] = round($data['cantidad_kg'] * $data['precio_unitario'], 2);
        unset($data['force']);

        $venta = DB::transaction(function () use ($data, $inventario) {
            $venta = Venta::create($data);

            if ($inventario) {
                $inventario->decrement('cantidad_kg', $data['cantidad_kg']);
                $inventario->update(['fecha_actualizacion' => now()]);
            }

            MovimientoInventario::create([
                'producto_id'  => $data['producto_id'],
                'tipo'         => 'venta',
                'cantidad_kg'  => -$data['cantidad_kg'],
                'fecha'        => $data['fecha'],
                'referencia_id' => $venta->id,
            ]);

            return $venta;
        });

        return response()->json([
            'data' => $venta->load(['producto', 'cliente']),
        ], 201);
    }

    public function show(Venta $venta): JsonResponse
    {
        return response()->json([
            'data' => $venta->load(['producto', 'cliente']),
        ]);
    }
}
