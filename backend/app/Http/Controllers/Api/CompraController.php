<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompraController extends Controller
{
    public function index()
    {
        $purchases = Compra::with(['product', 'supplier'])
            ->orderByDesc('date')
            ->get();

        return response()->json(['data' => $purchases]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date'        => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id'  => 'required|exists:products,id',
            'quantity_kg' => 'required|numeric|min:0.001',
            'unit_price'  => 'required|numeric|min:0',
            'notes'       => 'nullable|string',
        ]);

        $data['total'] = $data['quantity_kg'] * $data['unit_price'];

        $purchase = DB::transaction(function () use ($data) {
            $purchase = Compra::create($data);

            $inventory = Inventario::where('product_id', $data['product_id'])->first();
            if ($inventory) {
                $inventory->quantity_kg      += $data['quantity_kg'];
                $inventory->stock_updated_at  = now();
                $inventory->save();
            }

            MovimientoInventario::create([
                'product_id'   => $data['product_id'],
                'type'         => 'purchase',
                'quantity_kg'  => $data['quantity_kg'],
                'date'         => $data['date'],
                'reference_id' => $purchase->id,
            ]);

            return $purchase;
        });

        return response()->json(['data' => $purchase->load(['product', 'supplier'])], 201);
    }

    public function show(Compra $compra)
    {
        return response()->json(['data' => $compra->load(['product', 'supplier'])]);
    }
}
