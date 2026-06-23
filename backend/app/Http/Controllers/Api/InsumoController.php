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
        return response()->json([
            'data' => Insumo::where('activo', true)->orderBy('nombre')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'         => 'required|string|max:255',
            'tipo'           => 'required|in:quimico,abono,otro',
            'unidad_medida'  => 'required|string|max:20',
            'stock_actual'   => 'sometimes|numeric|min:0',
        ], [
            'nombre.required'        => 'El nombre es obligatorio.',
            'tipo.required'          => 'El tipo es obligatorio.',
            'tipo.in'                => 'El tipo debe ser: quimico, abono u otro.',
            'unidad_medida.required' => 'La unidad de medida es obligatoria.',
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
            'nombre'        => 'sometimes|string|max:255',
            'tipo'          => 'sometimes|in:quimico,abono,otro',
            'unidad_medida' => 'sometimes|string|max:20',
            'stock_actual'  => 'sometimes|numeric|min:0',
            'activo'        => 'sometimes|boolean',
        ]);

        $insumo->update($data);

        return response()->json(['data' => $insumo]);
    }

    public function destroy(Insumo $insumo): JsonResponse
    {
        $insumo->update(['activo' => false]);

        return response()->json(['message' => 'Insumo desactivado correctamente.']);
    }
}
