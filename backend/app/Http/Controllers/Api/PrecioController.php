<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Precio;
use App\Models\Producto;
use Illuminate\Http\Request;

class PrecioController extends Controller
{
    public function index(Producto $producto)
    {
        $prices = $producto->prices()
            ->orderByDesc('valid_from')
            ->get()
            ->groupBy('type');

        return response()->json(['data' => $prices]);
    }

    public function store(Request $request, Producto $producto)
    {
        $data = $request->validate([
            'type'       => 'required|in:retail,wholesale',
            'value'      => 'required|numeric|min:0',
            'valid_from' => 'required|date',
        ]);

        $data['product_id'] = $producto->id;
        $price = Precio::create($data);

        return response()->json(['data' => $price], 201);
    }

    public function current(Producto $producto)
    {
        return response()->json([
            'data' => [
                'retail'    => $producto->currentPrice('retail'),
                'wholesale' => $producto->currentPrice('wholesale'),
            ],
        ]);
    }
}
