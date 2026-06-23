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
            ->orderBy('cantidad_kg', 'desc')
            ->get();

        return response()->json(['data' => $inventario]);
    }

    public function show(Producto $producto): JsonResponse
    {
        $inventario = $producto->inventario;

        if (! $inventario) {
            return response()->json(['message' => 'Este producto no tiene registro de inventario.'], 404);
        }

        $movimientos = MovimientoInventario::where('producto_id', $producto->id)
            ->orderByDesc('fecha')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => [
                'inventario'          => $inventario,
                'movimientos_recientes' => $movimientos,
            ],
        ]);
    }

    public function ajuste(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate([
            'cantidad_kg' => 'required|numeric',
            'motivo'      => 'required|string|max:500',
        ], [
            'cantidad_kg.required' => 'La cantidad es obligatoria.',
            'cantidad_kg.numeric'  => 'La cantidad debe ser un número.',
            'motivo.required'      => 'El motivo del ajuste es obligatorio.',
        ]);

        $inventario = $producto->inventario;

        if (! $inventario) {
            return response()->json(['message' => 'Este producto no tiene registro de inventario.'], 404);
        }

        DB::transaction(function () use ($inventario, $producto, $data) {
            $inventario->increment('cantidad_kg', $data['cantidad_kg']);
            $inventario->update(['fecha_actualizacion' => now()]);

            MovimientoInventario::create([
                'producto_id' => $producto->id,
                'tipo'        => 'ajuste',
                'cantidad_kg' => $data['cantidad_kg'],
                'fecha'       => now()->toDateString(),
                'motivo'      => $data['motivo'],
            ]);
        });

        return response()->json([
            'data'    => $inventario->fresh(),
            'message' => 'Ajuste de inventario registrado.',
        ]);
    }
}
