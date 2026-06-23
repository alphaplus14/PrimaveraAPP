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
        return response()->json(['data' => Cliente::orderBy('nombre')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'   => 'required|string|max:255',
            'tipo'     => 'required|in:tienda,restaurante,galeria,individual',
            'telefono' => 'nullable|string|max:20',
        ], [
            'nombre.required' => 'El nombre es obligatorio.',
            'tipo.required'   => 'El tipo es obligatorio.',
            'tipo.in'         => 'El tipo debe ser: tienda, restaurante, galeria o individual.',
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
            'nombre'   => 'sometimes|string|max:255',
            'tipo'     => 'sometimes|in:tienda,restaurante,galeria,individual',
            'telefono' => 'nullable|string|max:20',
            'activo'   => 'sometimes|boolean',
        ]);

        $cliente->update($data);

        return response()->json(['data' => $cliente]);
    }

    public function destroy(Cliente $cliente): JsonResponse
    {
        $cliente->update(['activo' => false]);

        return response()->json(['message' => 'Cliente desactivado correctamente.']);
    }
}
