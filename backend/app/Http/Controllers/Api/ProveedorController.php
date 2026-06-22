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
        return response()->json(['data' => Proveedor::orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:neighbor,market,other',
            'phone' => 'nullable|string|max:20',
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'type.required' => 'El tipo es obligatorio.',
            'type.in' => 'El tipo debe ser: neighbor, market u other.',
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
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:neighbor,market,other',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $proveedor->update($data);

        return response()->json(['data' => $proveedor]);
    }

    public function destroy(Proveedor $proveedor): JsonResponse
    {
        $proveedor->update(['is_active' => false]);

        return response()->json(['message' => 'Proveedor desactivado correctamente.']);
    }
}
