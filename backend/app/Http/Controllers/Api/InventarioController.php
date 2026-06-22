<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventarioController extends Controller
{
    public function index(): JsonResponse
    {
        $inventario = Inventario::with('producto')
            ->orderBy('quantity_kg', 'desc')
            ->get();

        return response()->json(['data' => $inventario]);
    }

    public function show(Producto $producto): JsonResponse
    {
        $inventario = $producto->inventario;

        if (! $inventario) {
            return response()->json(['message' => 'Este producto no tiene registro de inventario.'], 404);
        }

        $movimientos = MovimientoInventario::where('product_id', $producto->id)
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => [
                'inventario' => $inventario,
                'recent_movements' => $movimientos,
            ],
        ]);
    }

    public function ajuste(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate([
            'quantity_kg' => 'required|numeric',
            'reason' => 'required|string|max:500',
        ], [
            'quantity_kg.required' => 'La cantidad es obligatoria.',
            'quantity_kg.numeric' => 'La cantidad debe ser un número.',
            'reason.required' => 'El motivo del ajuste es obligatorio.',
        ]);

        $inventario = $producto->inventario;

        if (! $inventario) {
            return response()->json(['message' => 'Este producto no tiene registro de inventario.'], 404);
        }

        DB::transaction(function () use ($inventario, $producto, $data) {
            $inventario->increment('quantity_kg', $data['quantity_kg']);
            $inventario->update(['quantity_updated_at' => now()]);

            MovimientoInventario::create([
                'product_id' => $producto->id,
                'type' => 'adjustment',
                'quantity_kg' => $data['quantity_kg'],
                'date' => now()->toDateString(),
                'reason' => $data['reason'],
            ]);
        });

        return response()->json([
            'data' => $inventario->fresh(),
            'message' => 'Ajuste de inventario registrado.',
        ]);
    }
}
