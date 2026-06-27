<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Insumo;
use App\Models\Labor;
use App\Models\LaborInsumo;
use App\Models\LaborWorker;
use App\Support\HarvestTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LaborController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = in_array((int) $request->per_page, [5, 10, 15, 25]) ? (int) $request->per_page : 15;

        $tasks = Labor::with(['supplies', 'workers'])
            ->when($request->busqueda, function ($q) use ($request) {
                $term = '%'.$request->busqueda.'%';
                $q->where(function ($q) use ($term) {
                    $q->where('task_type', 'like', $term)
                        ->orWhere('crop', 'like', $term)
                        ->orWhere('responsible', 'like', $term)
                        ->orWhere('description', 'like', $term)
                        ->orWhereHas('supplies', fn ($q) => $q->where('name', 'like', $term))
                        ->orWhereHas('workers', fn ($q) => $q->where('worker_name', 'like', $term));
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
            $this->syncWorkers($task, $data['workers'] ?? [], $data['task_type'], $data['responsible'] ?? null);

            return $task;
        });

        return response()->json(['data' => $task->load(['supplies', 'workers'])], 201);
    }

    public function show(Labor $labor): JsonResponse
    {
        return response()->json(['data' => $labor->load(['supplies', 'workers'])]);
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
            LaborWorker::where('farm_task_id', $labor->id)->delete();

            $labor->update([
                'date'        => $data['date'],
                'task_type'   => $data['task_type'],
                'crop'        => $data['crop'] ?? null,
                'responsible' => $data['responsible'] ?? null,
                'description' => $data['description'] ?? null,
            ]);

            $this->attachSupplies($labor, $data['supplies'] ?? []);
            $this->syncWorkers($labor, $data['workers'] ?? [], $data['task_type'], $data['responsible'] ?? null);

            return $labor->fresh(['supplies', 'workers']);
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
            LaborWorker::where('farm_task_id', $labor->id)->delete();
            $labor->delete();
        });

        return response()->json(null, 204);
    }

    private function validatedTask(Request $request): array
    {
        $data = $request->validate([
            'date'        => 'required|date',
            'task_type'   => 'required|string|max:100',
            'crop'        => 'nullable|string|max:100',
            'responsible' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'supplies'    => 'nullable|array',
            'supplies.*.supply_id'     => 'required|exists:supplies,id',
            'supplies.*.quantity_used' => 'required|numeric|min:0.001',
            'workers'     => 'nullable|array',
            'workers.*.worker_name'    => 'required|string|max:100',
            'workers.*.payment_mode'   => 'required|in:per_kg,per_day',
            'workers.*.quantity_kg'    => 'nullable|numeric|min:0',
            'workers.*.rate'           => 'required|numeric|min:0',
        ]);

        if (HarvestTask::isHarvest($data['task_type'])) {
            $hasWorkers = ! empty($data['workers']);
            $hasResponsible = ! empty(trim($data['responsible'] ?? ''));

            if (! $hasWorkers && ! $hasResponsible) {
                throw ValidationException::withMessages([
                    'workers' => ['En cosecha registra al menos un colaborador o un responsable.'],
                ]);
            }

            foreach ($data['workers'] ?? [] as $index => $worker) {
                if ($worker['payment_mode'] === 'per_kg' && (float) ($worker['quantity_kg'] ?? 0) <= 0) {
                    throw ValidationException::withMessages([
                        "workers.{$index}.quantity_kg" => ['Indica los kg cosechados para este colaborador.'],
                    ]);
                }
            }
        }

        return $data;
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

    private function syncWorkers(Labor $task, array $workers, string $taskType, ?string $responsible): void
    {
        LaborWorker::where('farm_task_id', $task->id)->delete();

        if (! HarvestTask::isHarvest($taskType)) {
            return;
        }

        foreach ($workers as $row) {
            $mode = $row['payment_mode'];
            $qty  = $mode === 'per_kg' ? (float) $row['quantity_kg'] : null;
            $rate = (float) $row['rate'];

            LaborWorker::create([
                'farm_task_id'  => $task->id,
                'worker_name'   => trim($row['worker_name']),
                'payment_mode'  => $mode,
                'quantity_kg'   => $qty,
                'rate'          => $rate,
                'total_paid'    => LaborWorker::computeTotal($mode, $qty, $rate),
            ]);
        }
    }
}
