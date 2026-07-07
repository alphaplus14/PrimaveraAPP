<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Venta;
use App\Services\InventarioTransaccionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{
    public function __construct(
        private InventarioTransaccionService $inventario,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = in_array((int) $request->per_page, [5, 10, 15, 25]) ? (int) $request->per_page : 15;

        $sales = Venta::with(['product', 'customer'])
            ->when($request->desde, fn ($q) => $q->where('date', '>=', $request->desde))
            ->when($request->hasta, fn ($q) => $q->where('date', '<=', $request->hasta))
            ->when($request->busqueda, function ($q) use ($request) {
                $term = '%'.$request->busqueda.'%';
                $q->where(function ($q) use ($term) {
                    $q->whereHas('product', fn ($q) => $q->where('name', 'like', $term))
                        ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', $term));
                });
            })
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json($sales);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedSale($request);

        if ($response = $this->creditValidationResponse($data)) {
            return $response;
        }

        if ($response = $this->stockWarningResponse($data)) {
            return $response;
        }

        $sale = $this->persistSale($data);

        return response()->json(['data' => $sale->load(['product', 'customer'])], 201);
    }

    public function show(Venta $venta): JsonResponse
    {
        return response()->json(['data' => $venta->load(['product', 'customer'])]);
    }

    public function update(Request $request, Venta $venta): JsonResponse
    {
        $data = $this->validatedSale($request);

        if ($response = $this->creditValidationResponse($data, $venta)) {
            return $response;
        }

        if ($response = $this->stockWarningResponse($data, $venta)) {
            return $response;
        }

        $sale = DB::transaction(function () use ($data, $venta) {
            $this->inventario->revertirVenta($venta);

            $total = (float) $data['quantity_kg'] * (float) $data['unit_price'];

            $venta->update([
                'date'        => $data['date'],
                'customer_id' => $data['customer_id'],
                'product_id'  => $data['product_id'],
                'quantity_kg' => $data['quantity_kg'],
                'sale_type'   => $data['sale_type'],
                'unit_price'  => $data['unit_price'],
                'total'       => $total,
                'forced'      => $data['forced'] ?? false,
                'is_credit'   => $data['is_credit'] ?? false,
                'amount_paid' => $this->resolveAmountPaid($data, $venta),
            ]);

            $this->inventario->aplicarVenta($venta->fresh());

            return $venta->fresh();
        });

        return response()->json(['data' => $sale->load(['product', 'customer'])]);
    }

    public function destroy(Venta $venta): JsonResponse
    {
        DB::transaction(function () use ($venta) {
            $this->inventario->revertirVenta($venta);
            $venta->delete();
        });

        return response()->json(null, 204);
    }

    private function validatedSale(Request $request): array
    {
        $data = $request->validate([
            'date'        => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'product_id'  => 'required|exists:products,id',
            'quantity_kg' => 'required|numeric|min:0.001',
            'sale_type'   => 'required|in:retail,wholesale',
            'unit_price'  => 'required|numeric|min:0',
            'force'       => 'boolean',
            'is_credit'   => 'boolean',
            'amount_paid' => 'nullable|numeric|min:0',
        ]);

        $data['forced'] = $data['force'] ?? false;
        unset($data['force']);

        return $data;
    }

    private function creditValidationResponse(array $data, ?Venta $venta = null): ?JsonResponse
    {
        if (! ($data['is_credit'] ?? false)) {
            return null;
        }

        $cliente = Cliente::find($data['customer_id']);
        if (! $cliente?->allows_credit) {
            return response()->json([
                'message' => 'Este cliente no tiene habilitado el fiado.',
            ], 422);
        }

        $total = (float) $data['quantity_kg'] * (float) $data['unit_price'];
        $amountPaid = (float) ($data['amount_paid'] ?? 0);

        if ($amountPaid > $total + 0.001) {
            return response()->json([
                'message' => 'El abono no puede superar el total de la venta.',
            ], 422);
        }

        if ($venta && $venta->is_credit) {
            $yaPagado = (float) ($venta->amount_paid ?? 0);
            if ($amountPaid < $yaPagado - 0.001) {
                return response()->json([
                    'message' => 'No se puede reducir el abono por debajo del ya registrado.',
                ], 422);
            }
        }

        return null;
    }

    private function stockWarningResponse(array $data, ?Venta $venta = null): ?JsonResponse
    {
        if ($data['forced'] ?? false) {
            return null;
        }

        $disponible = $this->inventario->stockDisponibleVenta((int) $data['product_id']);

        if ($venta && (int) $data['product_id'] === (int) $venta->product_id) {
            $disponible += (float) $venta->quantity_kg;
        }

        if ($disponible < $data['quantity_kg']) {
            return response()->json([
                'message'       => 'Stock insuficiente.',
                'available'     => $disponible,
                'stock_warning' => true,
            ], 422);
        }

        return null;
    }

    private function persistSale(array $data): Venta
    {
        return DB::transaction(function () use ($data) {
            $sale = Venta::create([
                'date'        => $data['date'],
                'customer_id' => $data['customer_id'],
                'product_id'  => $data['product_id'],
                'quantity_kg' => $data['quantity_kg'],
                'sale_type'   => $data['sale_type'],
                'unit_price'  => $data['unit_price'],
                'total'       => $data['quantity_kg'] * $data['unit_price'],
                'forced'      => $data['forced'] ?? false,
                'is_credit'   => $data['is_credit'] ?? false,
                'amount_paid' => $this->resolveAmountPaid($data),
            ]);

            $this->inventario->aplicarVenta($sale);

            return $sale;
        });
    }

    private function resolveAmountPaid(array $data, ?Venta $venta = null): float
    {
        $total = (float) $data['quantity_kg'] * (float) $data['unit_price'];

        if (! ($data['is_credit'] ?? false)) {
            return $total;
        }

        $solicitado = max(0, (float) ($data['amount_paid'] ?? 0));

        if ($venta && $venta->is_credit) {
            $yaPagado = (float) ($venta->amount_paid ?? 0);
            $solicitado = max($solicitado, $yaPagado);
        }

        return min($total, $solicitado);
    }
}
