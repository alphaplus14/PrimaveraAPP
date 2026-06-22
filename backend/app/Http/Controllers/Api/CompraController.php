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
            ->when($request->desde, fn ($q) => $q->where('date', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('date', '<=', $request->hasta))
            ->orderByDesc('date')
            ->paginate(50);

        return response()->json($compras);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id' => 'required|exists:products,id',
            'quantity_kg' => 'required|numeric|min:0.001',
            'unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ], [
            'date.required' => 'La fecha es obligatoria.',
            'supplier_id.required' => 'El proveedor es obligatorio.',
            'supplier_id.exists' => 'El proveedor no existe.',
            'product_id.required' => 'El producto es obligatorio.',
            'product_id.exists' => 'El producto no existe.',
            'quantity_kg.required' => 'La cantidad en kg es obligatoria.',
            'quantity_kg.min' => 'La cantidad debe ser mayor a cero.',
            'unit_price.required' => 'El precio unitario es obligatorio.',
        ]);

        $data['total'] = round($data['quantity_kg'] * $data['unit_price'], 2);

        $compra = DB::transaction(function () use ($data) {
            $compra = Compra::create($data);

            $inventario = Inventario::firstOrCreate(
                ['product_id' => $data['product_id']],
                ['quantity_kg' => 0]
            );
            $inventario->increment('quantity_kg', $data['quantity_kg']);
            $inventario->update(['quantity_updated_at' => now()]);

            MovimientoInventario::create([
                'product_id' => $data['product_id'],
                'type' => 'purchase',
                'quantity_kg' => $data['quantity_kg'],
                'date' => $data['date'],
                'reference_id' => $compra->id,
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
