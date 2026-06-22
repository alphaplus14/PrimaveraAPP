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
            ->when($request->desde, fn ($q) => $q->where('date', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('date', '<=', $request->hasta))
            ->orderByDesc('date')
            ->paginate(50);

        return response()->json($ventas);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'required|exists:products,id',
            'quantity_kg' => 'required|numeric|min:0.001',
            'sale_type' => 'required|in:retail,wholesale',
            'unit_price' => 'required|numeric|min:0',
            'force' => 'sometimes|boolean',
        ], [
            'date.required' => 'La fecha es obligatoria.',
            'customer_id.required' => 'El cliente es obligatorio.',
            'customer_id.exists' => 'El cliente no existe.',
            'product_id.required' => 'El producto es obligatorio.',
            'product_id.exists' => 'El producto no existe.',
            'quantity_kg.min' => 'La cantidad debe ser mayor a cero.',
            'sale_type.required' => 'El tipo de venta es obligatorio.',
            'sale_type.in' => 'El tipo debe ser retail o wholesale.',
            'unit_price.required' => 'El precio unitario es obligatorio.',
        ]);

        $inventario = Inventario::where('product_id', $data['product_id'])->first();
        $stockActual = $inventario ? (float) $inventario->quantity_kg : 0;
        $stockInsuficiente = $stockActual < $data['quantity_kg'];

        if ($stockInsuficiente && ! ($data['force'] ?? false)) {
            return response()->json([
                'message' => 'Stock insuficiente.',
                'advertencia' => true,
                'current_stock' => $stockActual,
                'requested_quantity' => $data['quantity_kg'],
            ], 422);
        }

        $data['total'] = round($data['quantity_kg'] * $data['unit_price'], 2);
        $data['forced'] = $stockInsuficiente && ($data['force'] ?? false);
        unset($data['force']);

        $venta = DB::transaction(function () use ($data, $inventario) {
            $venta = Venta::create($data);

            if ($inventario) {
                $inventario->decrement('quantity_kg', $data['quantity_kg']);
                $inventario->update(['quantity_updated_at' => now()]);
            }

            MovimientoInventario::create([
                'product_id' => $data['product_id'],
                'type' => 'sale',
                'quantity_kg' => -$data['quantity_kg'],
                'date' => $data['date'],
                'reference_id' => $venta->id,
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
