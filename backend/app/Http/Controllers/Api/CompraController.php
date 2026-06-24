<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Services\InventarioTransaccionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompraController extends Controller
{
    public function __construct(
        private InventarioTransaccionService $inventario,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = in_array((int) $request->per_page, [5, 10, 15, 25]) ? (int) $request->per_page : 15;

        $purchases = Compra::with(['product', 'supplier'])
            ->when($request->desde, fn ($q) => $q->where('date', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('date', '<=', $request->hasta))
            ->when($request->busqueda, function ($q) use ($request) {
                $term = '%'.$request->busqueda.'%';
                $q->where(function ($q) use ($term) {
                    $q->whereHas('product', fn ($q) => $q->where('name', 'like', $term))
                        ->orWhereHas('supplier', fn ($q) => $q->where('name', 'like', $term));
                });
            })
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json($purchases);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedPurchase($request);
        $purchase = $this->persistPurchase($data);

        return response()->json(['data' => $purchase->load(['product', 'supplier'])], 201);
    }

    public function show(Compra $compra): JsonResponse
    {
        return response()->json(['data' => $compra->load(['product', 'supplier'])]);
    }

    public function update(Request $request, Compra $compra): JsonResponse
    {
        $data = $this->validatedPurchase($request);

        $purchase = DB::transaction(function () use ($data, $compra) {
            $this->inventario->revertirCompra($compra);

            $compra->update([
                'date'        => $data['date'],
                'supplier_id' => $data['supplier_id'],
                'product_id'  => $data['product_id'],
                'quantity_kg' => $data['quantity_kg'],
                'unit_price'  => $data['unit_price'],
                'total'       => $data['quantity_kg'] * $data['unit_price'],
                'notes'       => $data['notes'] ?? null,
            ]);

            $this->inventario->aplicarCompra($compra->fresh());

            return $compra->fresh();
        });

        return response()->json(['data' => $purchase->load(['product', 'supplier'])]);
    }

    public function destroy(Compra $compra): JsonResponse
    {
        DB::transaction(function () use ($compra) {
            $this->inventario->revertirCompra($compra);
            $compra->delete();
        });

        return response()->json(null, 204);
    }

    private function validatedPurchase(Request $request): array
    {
        return $request->validate([
            'date'        => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id'  => 'required|exists:products,id',
            'quantity_kg' => 'required|numeric|min:0.001',
            'unit_price'  => 'required|numeric|min:0',
            'notes'       => 'nullable|string',
        ]);
    }

    private function persistPurchase(array $data): Compra
    {
        return DB::transaction(function () use ($data) {
            $purchase = Compra::create([
                'date'        => $data['date'],
                'supplier_id' => $data['supplier_id'],
                'product_id'  => $data['product_id'],
                'quantity_kg' => $data['quantity_kg'],
                'unit_price'  => $data['unit_price'],
                'total'       => $data['quantity_kg'] * $data['unit_price'],
                'notes'       => $data['notes'] ?? null,
            ]);

            $this->inventario->aplicarCompra($purchase);

            return $purchase;
        });
    }
}
