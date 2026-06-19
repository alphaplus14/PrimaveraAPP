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
            ->orderBy('nombre')
            ->get();

        return response()->json(['data' => $productos]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => 'required|in:propio,comprado,pulpa',
            'unidad_medida' => 'sometimes|string|max:20',
            'activo' => 'sometimes|boolean',
            'es_fruta_para_pulpa' => 'sometimes|boolean',
            'pulpa_relacionada_id' => 'nullable|exists:productos,id',
        ], [
            'nombre.required' => 'El nombre del producto es obligatorio.',
            'categoria.required' => 'La categoría es obligatoria.',
            'categoria.in' => 'La categoría debe ser: propio, comprado o pulpa.',
            'pulpa_relacionada_id.exists' => 'La pulpa relacionada no existe.',
        ]);

        $producto = Producto::create($data);

        // Crear registro de inventario inicial
        Inventario::create([
            'producto_id' => $producto->id,
            'cantidad_kg' => 0,
            'fecha_actualizacion' => now(),
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
            'nombre' => 'sometimes|string|max:255',
            'categoria' => 'sometimes|in:propio,comprado,pulpa',
            'unidad_medida' => 'sometimes|string|max:20',
            'activo' => 'sometimes|boolean',
            'es_fruta_para_pulpa' => 'sometimes|boolean',
            'pulpa_relacionada_id' => 'nullable|exists:productos,id',
        ]);

        $producto->update($data);

        return response()->json(['data' => $producto->fresh(['inventario'])]);
    }

    public function destroy(Producto $producto): JsonResponse
    {
        $producto->update(['activo' => false]);

        return response()->json(['message' => 'Producto desactivado correctamente.']);
    }
}
