<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proveedor;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Proveedor::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'   => 'required|string|max:100',
            'type'   => 'required|in:neighbor,market,other',
            'phone'  => 'nullable|string|max:20',
            'active' => 'boolean',
        ]);

        return response()->json(['data' => Proveedor::create($data)], 201);
    }

    public function update(Request $request, Proveedor $proveedor)
    {
        $data = $request->validate([
            'name'   => 'sometimes|string|max:100',
            'type'   => 'sometimes|in:neighbor,market,other',
            'phone'  => 'nullable|string|max:20',
            'active' => 'boolean',
        ]);

        $proveedor->update($data);
        return response()->json(['data' => $proveedor]);
    }

    public function destroy(Proveedor $proveedor)
    {
        $proveedor->delete();
        return response()->json(null, 204);
    }
}
