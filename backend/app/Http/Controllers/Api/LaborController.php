<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Insumo;
use App\Models\Labor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LaborController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $labores = Labor::with('insumos')
            ->when($request->desde, fn ($q) => $q->where('fecha', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('fecha', '<=', $request->hasta))
            ->orderByDesc('fecha')
            ->paginate(50);

        return response()->json($labores);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fecha'        => 'required|date',
            'tipo_labor'   => 'required|string|max:255',
            'cultivo'      => 'nullable|string|max:255',
            'responsable'  => 'nullable|string|max:255',
            'descripcion'  => 'nullable|string',
            'insumos'      => 'sometimes|array',
            'insumos.*.insumo_id'    => 'required_with:insumos|exists:insumos,id',
            'insumos.*.cantidad_usada' => 'required_with:insumos|numeric|min:0.001',
        ], [
            'fecha.required'        => 'La fecha es obligatoria.',
            'tipo_labor.required'   => 'El tipo de labor es obligatorio.',
            'insumos.*.insumo_id.exists'       => 'Uno de los insumos no existe.',
            'insumos.*.cantidad_usada.min'      => 'La cantidad de insumo debe ser mayor a cero.',
        ]);

        $labor = DB::transaction(function () use ($data) {
            $insumos = $data['insumos'] ?? [];
            unset($data['insumos']);

            $labor = Labor::create($data);

            if (! empty($insumos)) {
                foreach ($insumos as $item) {
                    $labor->laborInsumos()->create([
                        'insumo_id'     => $item['insumo_id'],
                        'cantidad_usada' => $item['cantidad_usada'],
                    ]);

                    Insumo::where('id', $item['insumo_id'])
                        ->decrement('stock_actual', $item['cantidad_usada']);
                }
            }

            return $labor;
        });

        return response()->json([
            'data' => $labor->load('insumos'),
        ], 201);
    }

    public function show(Labor $labor): JsonResponse
    {
        return response()->json(['data' => $labor->load('insumos')]);
    }

    public function update(Request $request, Labor $labor): JsonResponse
    {
        $data = $request->validate([
            'fecha'       => 'sometimes|date',
            'tipo_labor'  => 'sometimes|string|max:255',
            'cultivo'     => 'nullable|string|max:255',
            'responsable' => 'nullable|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $labor->update($data);

        return response()->json(['data' => $labor->load('insumos')]);
    }

    public function destroy(Labor $labor): JsonResponse
    {
        $labor->delete();

        return response()->json(['message' => 'Labor eliminada correctamente.']);
    }
}
