<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Insumo;
use App\Models\Labor;
use App\Models\LaborInsumo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LaborController extends Controller
{
    public function index()
    {
        $tasks = Labor::with('supplies')
            ->orderByDesc('date')
            ->get();

        return response()->json(['data' => $tasks]);
    }

    public function store(Request $request)
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
        ]);

        $task = DB::transaction(function () use ($data) {
            $task = Labor::create([
                'date'        => $data['date'],
                'task_type'   => $data['task_type'],
                'crop'        => $data['crop'] ?? null,
                'responsible' => $data['responsible'] ?? null,
                'description' => $data['description'] ?? null,
            ]);

            foreach ($data['supplies'] ?? [] as $item) {
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

            return $task;
        });

        return response()->json(['data' => $task->load('supplies')], 201);
    }

    public function show(Labor $labor)
    {
        return response()->json(['data' => $labor->load('supplies')]);
    }
}
