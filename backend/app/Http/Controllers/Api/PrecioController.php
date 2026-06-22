<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrecioController extends Controller
{
    public function index(Producto $producto): JsonResponse
    {
        $precios = $producto->precios()
            ->orderByDesc('effective_from')
            ->get()
            ->groupBy('type');

        return response()->json(['data' => $precios]);
    }

    public function store(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:retail,wholesale',
            'amount' => 'required|numeric|min:0.01',
            'effective_from' => 'required|date',
        ], [
            'type.required' => 'El tipo de precio es obligatorio.',
            'type.in' => 'El tipo debe ser retail o wholesale.',
            'amount.required' => 'El valor es obligatorio.',
            'amount.min' => 'El valor debe ser mayor a cero.',
            'effective_from.required' => 'La fecha de vigencia es obligatoria.',
        ]);

        $precio = $producto->precios()->create($data);

        return response()->json(['data' => $precio], 201);
    }

    public function actual(Producto $producto): JsonResponse
    {
        return response()->json([
            'data' => [
                'retail' => $producto->precioActual('retail'),
                'wholesale' => $producto->precioActual('wholesale'),
            ],
        ]);
    }
}
