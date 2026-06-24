<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Transformacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransformacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = in_array((int) $request->per_page, [5, 10, 25]) ? (int) $request->per_page : 10;

        $transformaciones = Transformacion::with(['sourceProduct', 'pulpProduct'])
            ->when($request->desde, fn ($q) => $q->where('date', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('date', '<=', $request->hasta))
            ->orderByDesc('date')
            ->paginate($perPage);

        return response()->json($transformaciones);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'source_product_id' => 'required|exists:products,id',
            'fruit_quantity_kg' => 'required|numeric|min:0.001',
            'pulp_product_id' => 'required|exists:products,id|different:source_product_id',
            'pulp_quantity_packages' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
        ], [
            'source_product_id.required' => 'El producto origen es obligatorio.',
            'fruit_quantity_kg.min' => 'La cantidad de fruta debe ser mayor a cero.',
            'pulp_product_id.required' => 'El producto pulpa es obligatorio.',
            'pulp_product_id.different' => 'El producto pulpa debe ser diferente al origen.',
            'pulp_quantity_packages.required' => 'La cantidad de paquetes es obligatoria.',
            'pulp_quantity_packages.min' => 'Debe haber al menos 1 paquete.',
        ]);

        $data['pulp_quantity_kg'] = $data['fruit_quantity_kg'];

        $transformacion = DB::transaction(function () use ($data) {
            $transformacion = Transformacion::create($data);

            $invOrigen = Inventario::firstOrCreate(
                ['product_id' => $data['source_product_id']],
                ['quantity_kg' => 0]
            );
            $invOrigen->subtractQuantity($data['fruit_quantity_kg']);
            $invOrigen->update(['stock_updated_at' => now()]);

            MovimientoInventario::create([
                'product_id' => $data['source_product_id'],
                'type' => 'transformation',
                'quantity_kg' => -$data['fruit_quantity_kg'], // kg de fruta
                'date' => $data['date'],
                'reference_id' => $transformacion->id,
            ]);

            $invPulpa = Inventario::firstOrCreate(
                ['product_id' => $data['pulp_product_id']],
                ['quantity_kg' => 0]
            );
            $invPulpa->addQuantity($data['pulp_quantity_packages']); // paquetes
            $invPulpa->update(['stock_updated_at' => now()]);

            MovimientoInventario::create([
                'product_id' => $data['pulp_product_id'],
                'type' => 'transformation',
                'quantity_kg' => $data['pulp_quantity_packages'], // paquetes
                'date' => $data['date'],
                'reference_id' => $transformacion->id,
            ]);

            return $transformacion;
        });

        return response()->json([
            'data' => $transformacion->load(['sourceProduct', 'pulpProduct']),
        ], 201);
    }

    public function show(Transformacion $transformacion): JsonResponse
    {
        return response()->json([
            'data' => $transformacion->load(['sourceProduct', 'pulpProduct']),
        ]);
    }
}
