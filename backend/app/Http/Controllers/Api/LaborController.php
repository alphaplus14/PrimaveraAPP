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
            ->when($request->desde, fn ($q) => $q->where('date', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('date', '<=', $request->hasta))
            ->orderByDesc('date')
            ->paginate(50);

        return response()->json($labores);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'task_type' => 'required|string|max:255',
            'crop' => 'nullable|string|max:255',
            'assigned_to' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'supplies' => 'sometimes|array',
            'supplies.*.supply_id' => 'required_with:supplies|exists:supplies,id',
            'supplies.*.quantity_used' => 'required_with:supplies|numeric|min:0.001',
        ], [
            'date.required' => 'La fecha es obligatoria.',
            'task_type.required' => 'El tipo de labor es obligatorio.',
            'supplies.*.supply_id.exists' => 'Uno de los insumos no existe.',
            'supplies.*.quantity_used.min' => 'La cantidad de insumo debe ser mayor a cero.',
        ]);

        $labor = DB::transaction(function () use ($data) {
            $supplies = $data['supplies'] ?? [];
            unset($data['supplies']);

            $labor = Labor::create($data);

            if (! empty($supplies)) {
                foreach ($supplies as $item) {
                    $labor->laborInsumos()->create([
                        'supply_id' => $item['supply_id'],
                        'quantity_used' => $item['quantity_used'],
                    ]);

                    Insumo::where('id', $item['supply_id'])
                        ->decrement('current_stock', $item['quantity_used']);
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
            'date' => 'sometimes|date',
            'task_type' => 'sometimes|string|max:255',
            'crop' => 'nullable|string|max:255',
            'assigned_to' => 'nullable|string|max:255',
            'description' => 'nullable|string',
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
