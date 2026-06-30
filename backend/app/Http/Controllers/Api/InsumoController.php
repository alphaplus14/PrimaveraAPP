<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Insumo;
use Illuminate\Http\Request;

class InsumoController extends Controller
{
    public function index(Request $request)
    {
        $query = Insumo::query()->orderBy('name');

        if (! $request->boolean('todos')) {
            $query->where('active', true);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'type'          => 'required|in:chemical,fertilizer,other',
            'unit'          => 'required|string|max:20',
            'current_stock' => 'nullable|numeric|min:0',
            'active'        => 'boolean',
        ]);

        return response()->json(['data' => Insumo::create($data)], 201);
    }

    public function update(Request $request, Insumo $insumo)
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'type'          => 'sometimes|in:chemical,fertilizer,other',
            'unit'          => 'sometimes|string|max:20',
            'current_stock' => 'nullable|numeric|min:0',
            'active'        => 'boolean',
        ]);

        $insumo->update($data);
        return response()->json(['data' => $insumo]);
    }
}
