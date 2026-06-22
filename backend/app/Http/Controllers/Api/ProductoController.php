<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function index(): JsonResponse
    {
        $productos = Producto::with(['inventario', 'pulpaRelacionada'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $productos]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:own,purchased,pulp',
            'unit_of_measure' => 'sometimes|string|max:20',
            'is_active' => 'sometimes|boolean',
            'is_fruit_for_pulp' => 'sometimes|boolean',
            'related_pulp_id' => 'nullable|exists:products,id',
        ], [
            'name.required' => 'El nombre del producto es obligatorio.',
            'category.required' => 'La categoría es obligatoria.',
            'category.in' => 'La categoría debe ser: own, purchased o pulp.',
            'related_pulp_id.exists' => 'La pulpa relacionada no existe.',
        ]);

        $producto = Producto::create($data);

        Inventario::create([
            'product_id' => $producto->id,
            'quantity_kg' => 0,
            'quantity_updated_at' => now(),
        ]);

        return response()->json(['data' => $producto->load('inventario')], 201);
    }

    public function show(Producto $producto): JsonResponse
    {
        return response()->json([
            'data' => $producto->load(['inventario', 'precios', 'pulpaRelacionada']),
        ]);
    }

    public function update(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|in:own,purchased,pulp',
            'unit_of_measure' => 'sometimes|string|max:20',
            'is_active' => 'sometimes|boolean',
            'is_fruit_for_pulp' => 'sometimes|boolean',
            'related_pulp_id' => 'nullable|exists:products,id',
        ]);

        $producto->update($data);

        return response()->json(['data' => $producto->fresh(['inventario'])]);
    }

    public function destroy(Producto $producto): JsonResponse
    {
        $producto->update(['is_active' => false]);

        return response()->json(['message' => 'Producto desactivado correctamente.']);
    }
}
