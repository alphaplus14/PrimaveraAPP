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
            ->orderByDesc('fecha_vigencia_desde')
            ->get()
            ->groupBy('tipo');

        return response()->json(['data' => $precios]);
    }

    public function store(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate([
            'tipo'                 => 'required|in:detal,mayorista',
            'valor'                => 'required|numeric|min:0.01',
            'fecha_vigencia_desde' => 'required|date',
        ], [
            'tipo.required'                  => 'El tipo de precio es obligatorio.',
            'tipo.in'                        => 'El tipo debe ser detal o mayorista.',
            'valor.required'                 => 'El valor es obligatorio.',
            'valor.min'                      => 'El valor debe ser mayor a cero.',
            'fecha_vigencia_desde.required'  => 'La fecha de vigencia es obligatoria.',
        ]);

        $precio = $producto->precios()->create($data);

        return response()->json(['data' => $precio], 201);
    }

    public function actual(Producto $producto): JsonResponse
    {
        return response()->json([
            'data' => [
                'detal'     => $producto->precioActual('detal'),
                'mayorista' => $producto->precioActual('mayorista'),
            ],
        ]);
    }
}
