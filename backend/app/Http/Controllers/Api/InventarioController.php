<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventarioController extends Controller
{
    public function index()
    {
        $inventories = Inventario::with('product')
            ->orderBy('quantity_kg')
            ->get();

        return response()->json(['data' => $inventories]);
    }

    public function show(Producto $producto)
    {
        $inventory = Inventario::where('product_id', $producto->id)->firstOrFail();
        return response()->json(['data' => $inventory->load('product')]);
    }

    public function adjust(Request $request, Producto $producto)
    {
        $data = $request->validate([
            'quantity_kg' => 'required|numeric',
            'reason'      => 'required|string|max:255',
        ]);

        $inventory = Inventario::where('product_id', $producto->id)->firstOrFail();

        DB::transaction(function () use ($inventory, $data, $producto) {
            $previous                    = $inventory->quantity_kg;
            $inventory->quantity_kg      = $data['quantity_kg'];
            $inventory->stock_updated_at = now();
            $inventory->save();

            MovimientoInventario::create([
                'product_id'  => $producto->id,
                'type'        => 'adjustment',
                'quantity_kg' => $data['quantity_kg'] - $previous,
                'date'        => now()->toDateString(),
                'reason'      => $data['reason'],
            ]);
        });

        return response()->json(['data' => $inventory->load('product')]);
    }
}
