<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Cliente::orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:store,restaurant,market,individual',
            'phone' => 'nullable|string|max:20',
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'type.required' => 'El tipo es obligatorio.',
            'type.in' => 'El tipo debe ser: store, restaurant, market o individual.',
        ]);

        return response()->json(['data' => Cliente::create($data)], 201);
    }

    public function show(Cliente $cliente): JsonResponse
    {
        return response()->json(['data' => $cliente]);
    }

    public function update(Request $request, Cliente $cliente): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:store,restaurant,market,individual',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $cliente->update($data);

        return response()->json(['data' => $cliente]);
    }

    public function destroy(Cliente $cliente): JsonResponse
    {
        $cliente->update(['is_active' => false]);

        return response()->json(['message' => 'Cliente desactivado correctamente.']);
    }
}
