<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proveedor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Proveedor::orderBy('nombre')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'   => 'required|string|max:255',
            'tipo'     => 'required|in:vecino,galeria,otro',
            'telefono' => 'nullable|string|max:20',
        ], [
            'nombre.required' => 'El nombre es obligatorio.',
            'tipo.required'   => 'El tipo es obligatorio.',
            'tipo.in'         => 'El tipo debe ser: vecino, galeria u otro.',
        ]);

        return response()->json(['data' => Proveedor::create($data)], 201);
    }

    public function show(Proveedor $proveedor): JsonResponse
    {
        return response()->json(['data' => $proveedor]);
    }

    public function update(Request $request, Proveedor $proveedor): JsonResponse
    {
        $data = $request->validate([
            'nombre'   => 'sometimes|string|max:255',
            'tipo'     => 'sometimes|in:vecino,galeria,otro',
            'telefono' => 'nullable|string|max:20',
            'activo'   => 'sometimes|boolean',
        ]);

        $proveedor->update($data);

        return response()->json(['data' => $proveedor]);
    }

    public function destroy(Proveedor $proveedor): JsonResponse
    {
        $proveedor->update(['activo' => false]);

        return response()->json(['message' => 'Proveedor desactivado correctamente.']);
    }
}
