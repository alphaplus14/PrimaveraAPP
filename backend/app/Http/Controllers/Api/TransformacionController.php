<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Transformacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransformacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $transformaciones = Transformacion::with(['productoOrigen', 'productoPulpa'])
            ->when($request->desde, fn ($q) => $q->where('fecha', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('fecha', '<=', $request->hasta))
            ->orderByDesc('fecha')
            ->paginate(50);

        return response()->json($transformaciones);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fecha'              => 'required|date',
            'producto_origen_id' => 'required|exists:productos,id',
            'cantidad_fruta_kg'  => 'required|numeric|min:0.001',
            'producto_pulpa_id'  => 'required|exists:productos,id|different:producto_origen_id',
            'cantidad_pulpa_kg'  => 'required|numeric|min:0.001',
            'observaciones'      => 'nullable|string|max:1000',
        ], [
            'producto_origen_id.required' => 'El producto origen es obligatorio.',
            'cantidad_fruta_kg.min'       => 'La cantidad de fruta debe ser mayor a cero.',
            'producto_pulpa_id.required'  => 'El producto pulpa es obligatorio.',
            'producto_pulpa_id.different' => 'El producto pulpa debe ser diferente al origen.',
            'cantidad_pulpa_kg.min'       => 'La cantidad de pulpa debe ser mayor a cero.',
        ]);

        $transformacion = DB::transaction(function () use ($data) {
            $transformacion = Transformacion::create($data);

            $invOrigen = Inventario::firstOrCreate(
                ['producto_id' => $data['producto_origen_id']],
                ['cantidad_kg' => 0]
            );
            $invOrigen->decrement('cantidad_kg', $data['cantidad_fruta_kg']);
            $invOrigen->update(['fecha_actualizacion' => now()]);

            MovimientoInventario::create([
                'producto_id'  => $data['producto_origen_id'],
                'tipo'         => 'transformacion',
                'cantidad_kg'  => -$data['cantidad_fruta_kg'],
                'fecha'        => $data['fecha'],
                'referencia_id' => $transformacion->id,
            ]);

            $invPulpa = Inventario::firstOrCreate(
                ['producto_id' => $data['producto_pulpa_id']],
                ['cantidad_kg' => 0]
            );
            $invPulpa->increment('cantidad_kg', $data['cantidad_pulpa_kg']);
            $invPulpa->update(['fecha_actualizacion' => now()]);

            MovimientoInventario::create([
                'producto_id'  => $data['producto_pulpa_id'],
                'tipo'         => 'transformacion',
                'cantidad_kg'  => $data['cantidad_pulpa_kg'],
                'fecha'        => $data['fecha'],
                'referencia_id' => $transformacion->id,
            ]);

            return $transformacion;
        });

        return response()->json([
            'data' => $transformacion->load(['productoOrigen', 'productoPulpa']),
        ], 201);
    }

    public function show(Transformacion $transformacion): JsonResponse
    {
        return response()->json([
            'data' => $transformacion->load(['productoOrigen', 'productoPulpa']),
        ]);
    }
}
