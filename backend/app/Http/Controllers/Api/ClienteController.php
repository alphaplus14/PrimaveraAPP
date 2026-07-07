<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Cliente::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'id_number'     => 'nullable|string|max:20',
            'type'          => 'required|in:store,restaurant,market,individual',
            'phone'         => 'nullable|string|max:20',
            'address'       => 'nullable|string|max:255',
            'allows_credit' => 'boolean',
            'active'        => 'boolean',
        ]);

        return response()->json(['data' => Cliente::create($data)], 201);
    }

    public function show(Cliente $cliente)
    {
        return response()->json(['data' => $cliente]);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'id_number'     => 'nullable|string|max:20',
            'type'          => 'sometimes|in:store,restaurant,market,individual',
            'phone'         => 'nullable|string|max:20',
            'address'       => 'nullable|string|max:255',
            'allows_credit' => 'boolean',
            'active'        => 'boolean',
        ]);

        $cliente->update($data);
        return response()->json(['data' => $cliente]);
    }

    public function destroy(Cliente $cliente)
    {
        $cliente->delete();
        return response()->json(null, 204);
    }
}
