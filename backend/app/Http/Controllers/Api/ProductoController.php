<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\Producto;
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
