<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Insumo;
use App\Models\Labor;
use App\Models\LaborInsumo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LaborController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = in_array((int) $request->per_page, [5, 10, 15, 25]) ? (int) $request->per_page : 15;

        $tasks = Labor::with('supplies')
            ->when($request->busqueda, function ($q) use ($request) {
                $term = '%'.$request->busqueda.'%';
                $q->where(function ($q) use ($term) {
                    $q->where('task_type', 'like', $term)
                        ->orWhere('crop', 'like', $term)
                        ->orWhere('responsible', 'like', $term)
                        ->orWhere('description', 'like', $term)
                        ->orWhereHas('supplies', fn ($q) => $q->where('name', 'like', $term));
                });
            })
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedTask($request);

        $task = DB::transaction(function () use ($data) {
            $task = Labor::create([
                'date'        => $data['date'],
                'task_type'   => $data['task_type'],
                'crop'        => $data['crop'] ?? null,
                'responsible' => $data['responsible'] ?? null,
                'description' => $data['description'] ?? null,
            ]);

            $this->attachSupplies($task, $data['supplies'] ?? []);

            return $task;
        });

        return response()->json(['data' => $task->load('supplies')], 201);
    }

    public function show(Labor $labor): JsonResponse
    {
        return response()->json(['data' => $labor->load('supplies')]);
    }

    public function update(Request $request, Labor $labor): JsonResponse
    {
        $data = $this->validatedTask($request);

        $task = DB::transaction(function () use ($data, $labor) {
            $labor->load('supplies');

            foreach ($labor->supplies as $supply) {
                Insumo::where('id', $supply->id)
                    ->increment('current_stock', $supply->pivot->quantity_used);
            }

            LaborInsumo::where('farm_task_id', $labor->id)->delete();

            $labor->update([
                'date'        => $data['date'],
                'task_type'   => $data['task_type'],
                'crop'        => $data['crop'] ?? null,
                'responsible' => $data['responsible'] ?? null,
                'description' => $data['description'] ?? null,
            ]);

            $this->attachSupplies($labor, $data['supplies'] ?? []);

            return $labor->fresh('supplies');
        });

        return response()->json(['data' => $task]);
    }

    public function destroy(Labor $labor): JsonResponse
    {
        DB::transaction(function () use ($labor) {
            $labor->load('supplies');

            foreach ($labor->supplies as $supply) {
                Insumo::where('id', $supply->id)
                    ->increment('current_stock', $supply->pivot->quantity_used);
            }

            LaborInsumo::where('farm_task_id', $labor->id)->delete();
            $labor->delete();
        });

        return response()->json(null, 204);
    }

    private function validatedTask(Request $request): array
    {
        return $request->validate([
            'date'        => 'required|date',
            'task_type'   => 'required|string|max:100',
            'crop'        => 'nullable|string|max:100',
            'responsible' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'supplies'    => 'nullable|array',
            'supplies.*.supply_id'     => 'required|exists:supplies,id',
            'supplies.*.quantity_used' => 'required|numeric|min:0.001',
        ]);
    }

    private function attachSupplies(Labor $task, array $supplies): void
    {
        foreach ($supplies as $item) {
            LaborInsumo::create([
                'farm_task_id'  => $task->id,
                'supply_id'     => $item['supply_id'],
                'quantity_used' => $item['quantity_used'],
            ]);

            $supply = Insumo::find($item['supply_id']);
            if ($supply) {
                $supply->decrement('current_stock', $item['quantity_used']);
            }
        }
    }
}
