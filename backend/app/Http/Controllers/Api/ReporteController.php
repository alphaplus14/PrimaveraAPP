<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Venta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReporteController extends Controller
{
    public function ventas(Request $request): JsonResponse
    {
        $request->validate([
            'desde' => 'required|date',
            'hasta' => 'required|date|after_or_equal:desde',
        ]);

        $ventas = Venta::with(['producto', 'cliente'])
            ->whereBetween('date', [$request->desde, $request->hasta])
            ->orderByDesc('date')
            ->get();

        $resumen = [
            'total_ventas' => $ventas->count(),
            'total_kg' => $ventas->sum('quantity_kg'),
            'total_pesos' => $ventas->sum('total'),
            'por_producto' => $ventas->groupBy('producto.name')->map(fn ($v) => [
                'quantity_kg' => $v->sum('quantity_kg'),
                'total_pesos' => $v->sum('total'),
            ]),
        ];

        return response()->json(['data' => ['ventas' => $ventas, 'resumen' => $resumen]]);
    }

    public function compras(Request $request): JsonResponse
    {
        $request->validate([
            'desde' => 'required|date',
            'hasta' => 'required|date|after_or_equal:desde',
        ]);

        $compras = Compra::with(['producto', 'proveedor'])
            ->whereBetween('date', [$request->desde, $request->hasta])
            ->orderByDesc('date')
            ->get();

        $resumen = [
            'total_compras' => $compras->count(),
            'total_kg' => $compras->sum('quantity_kg'),
            'total_pesos' => $compras->sum('total'),
        ];

        return response()->json(['data' => ['compras' => $compras, 'resumen' => $resumen]]);
    }

    public function inventario(): JsonResponse
    {
        $inventario = Inventario::with('producto')
            ->orderBy('quantity_kg', 'desc')
            ->get();

        return response()->json(['data' => $inventario]);
    }

    public function movimientos(Request $request): JsonResponse
    {
        $request->validate([
            'desde' => 'required|date',
            'hasta' => 'required|date|after_or_equal:desde',
            'product_id' => 'nullable|exists:products,id',
        ]);

        $movimientos = MovimientoInventario::with('producto')
            ->whereBetween('date', [$request->desde, $request->hasta])
            ->when($request->product_id, fn ($q) => $q->where('product_id', $request->product_id))
            ->orderByDesc('date')
            ->get();

        return response()->json(['data' => $movimientos]);
    }
}
