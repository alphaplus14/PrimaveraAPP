<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Insumo;
use Illuminate\Http\Request;

class InsumoController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Insumo::where('active', true)->orderBy('name')->get(),
        ]);
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
