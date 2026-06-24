<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{
    public function index()
    {
        $sales = Venta::with(['product', 'customer'])
            ->orderByDesc('date')
            ->get();

        return response()->json(['data' => $sales]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date'        => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'product_id'  => 'required|exists:products,id',
            'quantity_kg' => 'required|numeric|min:0.001',
            'sale_type'   => 'required|in:retail,wholesale',
            'unit_price'  => 'required|numeric|min:0',
            'force'       => 'boolean',
        ]);

        $inventory = Inventario::where('product_id', $data['product_id'])->first();

        if (!($data['force'] ?? false) && $inventory && $inventory->quantity_kg < $data['quantity_kg']) {
            return response()->json([
                'message'          => 'Insufficient stock.',
                'available'        => $inventory->quantity_kg,
                'stock_warning'    => true,
            ], 422);
        }

        $data['total']  = $data['quantity_kg'] * $data['unit_price'];
        $data['forced'] = $data['force'] ?? false;
        unset($data['force']);

        $sale = DB::transaction(function () use ($data, $inventory) {
            $sale = Venta::create($data);

            if ($inventory) {
                $inventory->quantity_kg      -= $data['quantity_kg'];
                $inventory->stock_updated_at  = now();
                $inventory->save();
            }

            MovimientoInventario::create([
                'product_id'   => $data['product_id'],
                'type'         => 'sale',
                'quantity_kg'  => -$data['quantity_kg'],
                'date'         => $data['date'],
                'reference_id' => $sale->id,
            ]);

            return $sale;
        });

        return response()->json(['data' => $sale->load(['product', 'customer'])], 201);
    }

    public function show(Venta $venta)
    {
        return response()->json(['data' => $venta->load(['product', 'customer'])]);
    }
}
