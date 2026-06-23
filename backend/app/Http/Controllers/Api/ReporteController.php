<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Venta;
use Illuminate\Http\Request;

class ReporteController extends Controller
{
    public function ventas(Request $request)
    {
        $query = Venta::with(['product', 'customer'])
            ->orderByDesc('date');

        if ($request->filled('desde') && $request->filled('hasta')) {
            $query->whereBetween('date', [$request->desde, $request->hasta]);
        }
        if ($request->filled('product_id')) {
            $request->validate(['product_id' => 'exists:products,id']);
            $query->where('product_id', $request->product_id);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function compras(Request $request)
    {
        $query = Compra::with(['product', 'supplier'])
            ->orderByDesc('date');

        if ($request->filled('desde') && $request->filled('hasta')) {
            $query->whereBetween('date', [$request->desde, $request->hasta]);
        }
        if ($request->filled('product_id')) {
            $request->validate(['product_id' => 'exists:products,id']);
            $query->where('product_id', $request->product_id);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function movimientos(Request $request)
    {
        $query = MovimientoInventario::with('product')
            ->orderByDesc('date');

        if ($request->filled('desde') && $request->filled('hasta')) {
            $query->whereBetween('date', [$request->desde, $request->hasta]);
        }
        if ($request->filled('product_id')) {
            $request->validate(['product_id' => 'exists:products,id']);
            $query->where('product_id', $request->product_id);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function inventario()
    {
        return response()->json([
            'data' => Inventario::with('product')->orderBy('quantity_kg')->get(),
        ]);
    }

    public function resumenHoy()
    {
        $today = now()->toDateString();

        $salesToday     = Venta::whereDate('date', $today)->get();
        $purchasesToday = Compra::whereDate('date', $today)->get();

        return response()->json([
            'data' => [
                'salesToday'            => $salesToday->count(),
                'revenueTodayRetail'    => $salesToday->where('sale_type', 'retail')->sum('total'),
                'revenueTodayWholesale' => $salesToday->where('sale_type', 'wholesale')->sum('total'),
                'purchasesToday'        => $purchasesToday->count(),
                'spentToday'            => $purchasesToday->sum('total'),
            ],
        ]);
    }

    public function resumenVentas(Request $request)
    {
        $request->validate([
            'desde' => 'required|date',
            'hasta' => 'required|date|after_or_equal:desde',
        ]);

        $sales = Venta::with('product')
            ->whereBetween('date', [$request->desde, $request->hasta])
            ->get();

        $byProduct = $sales->groupBy('product_id')->map(function ($group) {
            $first = $group->first();
            return [
                'product'     => $first->product?->name,
                'quantity_kg' => $group->sum('quantity_kg'),
                'total'       => $group->sum('total'),
            ];
        })->values();

        return response()->json([
            'data' => [
                'byProduct'    => $byProduct,
                'totalRevenue' => $sales->sum('total'),
                'totalKg'      => $sales->sum('quantity_kg'),
            ],
        ]);
    }
}
