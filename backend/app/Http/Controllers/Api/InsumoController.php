<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Insumo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsumoController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Insumo::where('is_active', true)->orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:chemical,fertilizer,other',
            'unit_of_measure' => 'required|string|max:20',
            'current_stock' => 'sometimes|numeric|min:0',
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'type.required' => 'El tipo es obligatorio.',
            'type.in' => 'El tipo debe ser: chemical, fertilizer u other.',
            'unit_of_measure.required' => 'La unidad de medida es obligatoria.',
        ]);

        return response()->json(['data' => Insumo::create($data)], 201);
    }

    public function show(Insumo $insumo): JsonResponse
    {
        return response()->json(['data' => $insumo]);
    }

    public function update(Request $request, Insumo $insumo): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:chemical,fertilizer,other',
            'unit_of_measure' => 'sometimes|string|max:20',
            'current_stock' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $insumo->update($data);

        return response()->json(['data' => $insumo]);
    }

    public function destroy(Insumo $insumo): JsonResponse
    {
        $insumo->update(['is_active' => false]);

        return response()->json(['message' => 'Insumo desactivado correctamente.']);
    }
}
