<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\Inventario;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function index()
    {
        $products = Producto::with('inventory')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $products]);
    }

    /**
     * Productos con compras de reventa registradas (kg y $ agregados desde purchases).
     */
    public function conCompras(Request $request): JsonResponse
    {
        $query = Compra::query()
            ->where('purchase_type', 'resale')
            ->whereNotNull('product_id');

        if ($request->filled('desde')) {
            $query->where('date', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $query->where('date', '<=', $request->hasta);
        }

        $aggregates = $query
            ->selectRaw('product_id, SUM(quantity_kg) as purchased_kg, SUM(total) as purchased_total, COUNT(*) as purchase_count')
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        $products = Producto::with('inventory')
            ->whereIn('id', $aggregates->keys())
            ->orderBy('name')
            ->get()
            ->map(function (Producto $product) use ($aggregates) {
                $agg = $aggregates[$product->id];

                return array_merge($product->toArray(), [
                    'purchase_summary' => [
                        'purchased_kg'     => (float) $agg->purchased_kg,
                        'purchased_total'  => (float) $agg->purchased_total,
                        'purchase_count'   => (int) $agg->purchase_count,
                    ],
                ]);
            })
            ->values();

        return response()->json(['data' => $products]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:100',
            'category'         => 'required|in:own,purchased,pulp',
            'unit'             => 'nullable|string|max:20',
            'active'           => 'boolean',
            'is_pulp_fruit'    => 'boolean',
            'related_pulp_id'  => 'nullable|exists:products,id',
        ]);

        $product = Producto::create($data);

        Inventario::create([
            'product_id'       => $product->id,
            'quantity_kg'      => 0,
            'stock_updated_at' => now(),
        ]);

        return response()->json(['data' => $product->load('inventory')], 201);
    }

    public function show(Producto $producto)
    {
        return response()->json(['data' => $producto->load('inventory')]);
    }

    public function update(Request $request, Producto $producto)
    {
        $data = $request->validate([
            'name'            => 'sometimes|string|max:100',
            'category'        => 'sometimes|in:own,purchased,pulp',
            'unit'            => 'nullable|string|max:20',
            'active'          => 'boolean',
            'is_pulp_fruit'   => 'boolean',
            'related_pulp_id' => 'nullable|exists:products,id',
        ]);

        $producto->update($data);

        return response()->json(['data' => $producto->load('inventory')]);
    }

    public function destroy(Producto $producto)
    {
        $producto->delete();
        return response()->json(null, 204);
    }
}
