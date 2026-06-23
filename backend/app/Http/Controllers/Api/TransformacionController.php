<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Transformacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransformacionController extends Controller
{
    public function index()
    {
        $transformations = Transformacion::with(['sourceProduct', 'pulpProduct'])
            ->orderByDesc('date')
            ->get();

        return response()->json(['data' => $transformations]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date'               => 'required|date',
            'source_product_id'  => 'required|exists:products,id',
            'fruit_quantity_kg'  => 'required|numeric|min:0.001',
            'pulp_product_id'    => 'required|exists:products,id|different:source_product_id',
            'pulp_quantity_kg'   => 'required|numeric|min:0.001',
            'notes'              => 'nullable|string',
        ]);

        $transformation = DB::transaction(function () use ($data) {
            $transformation = Transformacion::create($data);

            // Decrease source fruit inventory
            $sourceInv = Inventario::where('product_id', $data['source_product_id'])->first();
            if ($sourceInv) {
                $sourceInv->quantity_kg      -= $data['fruit_quantity_kg'];
                $sourceInv->stock_updated_at  = now();
                $sourceInv->save();
            }

            // Increase pulp inventory
            $pulpInv = Inventario::where('product_id', $data['pulp_product_id'])->first();
            if ($pulpInv) {
                $pulpInv->quantity_kg      += $data['pulp_quantity_kg'];
                $pulpInv->stock_updated_at  = now();
                $pulpInv->save();
            }

            // Movement: fruit out
            MovimientoInventario::create([
                'product_id'   => $data['source_product_id'],
                'type'         => 'transformation',
                'quantity_kg'  => -$data['fruit_quantity_kg'],
                'date'         => $data['date'],
                'reference_id' => $transformation->id,
            ]);

            // Movement: pulp in
            MovimientoInventario::create([
                'product_id'   => $data['pulp_product_id'],
                'type'         => 'transformation',
                'quantity_kg'  => $data['pulp_quantity_kg'],
                'date'         => $data['date'],
                'reference_id' => $transformation->id,
            ]);

            return $transformation;
        });

        return response()->json(['data' => $transformation->load(['sourceProduct', 'pulpProduct'])], 201);
    }

    public function show(Transformacion $transformacion)
    {
        return response()->json(['data' => $transformacion->load(['sourceProduct', 'pulpProduct'])]);
    }
}
