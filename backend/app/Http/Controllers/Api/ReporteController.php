<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\Inventario;
use App\Models\Labor;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\Venta;
use App\Support\HarvestTask;
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
        $query = Compra::with(['product', 'supplier', 'supply'])
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

    /**
     * Margen simple por producto: ventas − compras de reventa en el período (sin lotes/FIFO).
     */
    public function rentabilidad(Request $request)
    {
        $request->validate([
            'desde'      => 'nullable|date',
            'hasta'      => 'nullable|date|after_or_equal:desde',
            'product_id' => 'nullable|exists:products,id',
        ]);

        $salesQuery = Venta::query();
        $purchasesQuery = Compra::query()
            ->where('purchase_type', 'resale')
            ->whereNotNull('product_id');

        if ($request->filled('desde') && $request->filled('hasta')) {
            $salesQuery->whereBetween('date', [$request->desde, $request->hasta]);
            $purchasesQuery->whereBetween('date', [$request->desde, $request->hasta]);
        }

        if ($request->filled('product_id')) {
            $salesQuery->where('product_id', $request->product_id);
            $purchasesQuery->where('product_id', $request->product_id);
        }

        $salesByProduct = $salesQuery
            ->selectRaw('product_id, SUM(quantity_kg) as sales_kg, SUM(total) as sales_total')
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        $purchasesByProduct = $purchasesQuery
            ->selectRaw('product_id, SUM(quantity_kg) as purchase_kg, SUM(total) as purchase_total')
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        $productIds = $salesByProduct->keys()
            ->merge($purchasesByProduct->keys())
            ->unique()
            ->values();

        $products = Producto::whereIn('id', $productIds)->get()->keyBy('id');

        $rows = $productIds->map(function ($productId) use ($salesByProduct, $purchasesByProduct, $products) {
            $sales     = $salesByProduct->get($productId);
            $purchases = $purchasesByProduct->get($productId);
            $product   = $products->get($productId);

            $salesTotal    = (float) ($sales->sales_total ?? 0);
            $purchaseTotal = (float) ($purchases->purchase_total ?? 0);
            $salesKg       = (float) ($sales->sales_kg ?? 0);
            $purchaseKg    = (float) ($purchases->purchase_kg ?? 0);
            $margin        = $salesTotal - $purchaseTotal;

            return [
                'product_id'      => $productId,
                'product'         => $product ? [
                    'id'       => $product->id,
                    'name'     => $product->name,
                    'category' => $product->category,
                ] : null,
                'sales_kg'        => $salesKg,
                'sales_total'     => $salesTotal,
                'purchase_kg'     => $purchaseKg,
                'purchase_total'  => $purchaseTotal,
                'margin'          => $margin,
                'margin_per_kg'   => $salesKg > 0 ? round($margin / $salesKg, 2) : null,
            ];
        })
            ->sortByDesc('margin')
            ->values();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'sales_total'    => $rows->sum('sales_total'),
                'purchase_total' => $rows->sum('purchase_total'),
                'margin'         => $rows->sum('margin'),
                'sales_kg'       => $rows->sum('sales_kg'),
                'purchase_kg'    => $rows->sum('purchase_kg'),
            ],
        ]);
    }

    /**
     * Cosechas: kg por cultivo/fecha y totales pagados a colaboradores.
     */
    public function labores(Request $request)
    {
        $request->validate([
            'desde'      => 'nullable|date',
            'hasta'      => 'nullable|date|after_or_equal:desde',
            'crop'       => 'nullable|string|max:100',
            'task_type'  => 'nullable|string|max:100',
        ]);

        $query = Labor::with('workers')
            ->where(function ($q) {
                $q->where('task_type', 'like', 'Cosecha%')
                    ->orWhere('task_type', 'like', 'cosecha%');
            })
            ->orderByDesc('date')
            ->orderByDesc('id');

        if ($request->filled('desde') && $request->filled('hasta')) {
            $query->whereBetween('date', [$request->desde, $request->hasta]);
        }

        if ($request->filled('crop')) {
            $query->where('crop', 'like', '%'.$request->crop.'%');
        }

        if ($request->filled('task_type') && ! HarvestTask::isHarvest($request->task_type)) {
            $query->where('task_type', 'like', '%'.$request->task_type.'%');
        }

        $tasks = $query->get();

        $byCrop = [];
        $byDate = [];
        $totalKg = 0;
        $totalPaid = 0;
        $workerCount = 0;

        foreach ($tasks as $task) {
            $taskKg = (float) $task->workers->sum('quantity_kg');
            $taskPaid = (float) $task->workers->sum('total_paid');
            $cropKey = $task->crop ?: 'Sin cultivo';
            $dateKey = $task->date->toDateString();

            $totalKg += $taskKg;
            $totalPaid += $taskPaid;
            $workerCount += $task->workers->count();

            if (! isset($byCrop[$cropKey])) {
                $byCrop[$cropKey] = ['crop' => $cropKey, 'quantity_kg' => 0, 'total_paid' => 0, 'task_count' => 0];
            }
            $byCrop[$cropKey]['quantity_kg'] += $taskKg;
            $byCrop[$cropKey]['total_paid'] += $taskPaid;
            $byCrop[$cropKey]['task_count']++;

            if (! isset($byDate[$dateKey])) {
                $byDate[$dateKey] = ['date' => $dateKey, 'quantity_kg' => 0, 'total_paid' => 0, 'task_count' => 0];
            }
            $byDate[$dateKey]['quantity_kg'] += $taskKg;
            $byDate[$dateKey]['total_paid'] += $taskPaid;
            $byDate[$dateKey]['task_count']++;
        }

        $byCropList = collect($byCrop)->sortByDesc('quantity_kg')->values();
        $byDateList = collect($byDate)->sortByDesc('date')->values();

        return response()->json([
            'data' => [
                'tasks' => $tasks->map(fn (Labor $task) => [
                    'id'          => $task->id,
                    'date'        => $task->date->toDateString(),
                    'task_type'   => $task->task_type,
                    'crop'        => $task->crop,
                    'responsible' => $task->responsible,
                    'quantity_kg' => (float) $task->workers->sum('quantity_kg'),
                    'total_paid'  => (float) $task->workers->sum('total_paid'),
                    'workers'     => $task->workers,
                ]),
                'by_crop' => $byCropList,
                'by_date' => $byDateList,
            ],
            'meta' => [
                'total_kg'       => $totalKg,
                'total_paid'     => $totalPaid,
                'harvest_count'  => $tasks->count(),
                'worker_entries' => $workerCount,
            ],
        ]);
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
