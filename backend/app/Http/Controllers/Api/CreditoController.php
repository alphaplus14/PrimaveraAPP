<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\PagoCredito;
use App\Models\Venta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CreditoController extends Controller
{
    public function index(): JsonResponse
    {
        $clientes = Cliente::with([
            'sales' => fn ($q) => $q->with('product')
                ->where('is_credit', true)
                ->orderBy('date'),
        ])
            ->orderBy('name')
            ->get()
            ->map(function (Cliente $cliente) {
                $ventasCredito = $cliente->sales->filter(fn (Venta $v) => $this->saldoVenta($v) > 0.001);

                return [
                    'id'            => $cliente->id,
                    'name'          => $cliente->name,
                    'id_number'     => $cliente->id_number,
                    'phone'         => $cliente->phone,
                    'address'       => $cliente->address,
                    'allows_credit' => $cliente->allows_credit,
                    'balance'       => round($ventasCredito->sum(fn (Venta $v) => $this->saldoVenta($v)), 2),
                    'open_sales'    => $ventasCredito->map(fn (Venta $v) => [
                        'id'          => $v->id,
                        'date'        => $v->date->toDateString(),
                        'total'       => (float) $v->total,
                        'amount_paid' => (float) ($v->amount_paid ?? 0),
                        'balance'     => $this->saldoVenta($v),
                        'product'     => $v->product?->only(['id', 'name']),
                    ])->values(),
                ];
            })
            ->filter(fn ($c) => $c['balance'] > 0.001 || $c['allows_credit'])
            ->values();

        return response()->json([
            'data' => $clientes,
            'meta' => [
                'total_balance' => round($clientes->sum('balance'), 2),
            ],
        ]);
    }

    public function storePayment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'sale_id'     => 'nullable|exists:sales,id',
            'date'        => 'required|date',
            'amount'      => 'required|numeric|min:0.01',
            'notes'       => 'nullable|string|max:255',
        ]);

        $cliente = Cliente::findOrFail($data['customer_id']);
        $restante = (float) $data['amount'];
        $saldoTotalCliente = $this->saldoCliente($cliente);

        if ($saldoTotalCliente <= 0.001) {
            return response()->json([
                'message' => 'Este cliente no tiene saldo pendiente.',
            ], 422);
        }

        if ($restante > $saldoTotalCliente + 0.001) {
            return response()->json([
                'message' => 'El abono supera el saldo pendiente del cliente.',
            ], 422);
        }

        if (! empty($data['sale_id'])) {
            $venta = Venta::where('customer_id', $cliente->id)
                ->where('is_credit', true)
                ->find($data['sale_id']);

            if (! $venta) {
                return response()->json([
                    'message' => 'La venta seleccionada no es válida para abono.',
                ], 422);
            }
        }

        $payment = DB::transaction(function () use ($data, $cliente, &$restante) {
            $payment = PagoCredito::create([
                'customer_id' => $cliente->id,
                'sale_id'     => $data['sale_id'] ?? null,
                'date'        => $data['date'],
                'amount'      => $data['amount'],
                'notes'       => $data['notes'] ?? null,
            ]);

            if (! empty($data['sale_id'])) {
                $venta = Venta::where('customer_id', $cliente->id)
                    ->where('is_credit', true)
                    ->findOrFail($data['sale_id']);
                $saldo = $this->saldoVenta($venta);
                $aplicar = min($restante, $saldo);
                $venta->update(['amount_paid' => (float) ($venta->amount_paid ?? 0) + $aplicar]);
                $restante -= $aplicar;
            } else {
                $ventas = Venta::where('customer_id', $cliente->id)
                    ->where('is_credit', true)
                    ->orderBy('date')
                    ->orderBy('id')
                    ->get();

                foreach ($ventas as $venta) {
                    if ($restante <= 0) {
                        break;
                    }
                    $saldo = $this->saldoVenta($venta);
                    if ($saldo <= 0) {
                        continue;
                    }
                    $aplicar = min($restante, $saldo);
                    $venta->update(['amount_paid' => (float) ($venta->amount_paid ?? 0) + $aplicar]);
                    $restante -= $aplicar;
                }
            }

            return $payment;
        });

        return response()->json([
            'data'    => $payment->load('customer'),
            'message' => 'Abono registrado correctamente.',
        ], 201);
    }

    private function saldoCliente(Cliente $cliente): float
    {
        return (float) Venta::where('customer_id', $cliente->id)
            ->where('is_credit', true)
            ->get()
            ->sum(fn (Venta $v) => $this->saldoVenta($v));
    }

    private function saldoVenta(Venta $venta): float
    {
        if (! $venta->is_credit) {
            return 0.0;
        }

        $pagado = (float) ($venta->amount_paid ?? 0);

        return max(0, (float) $venta->total - $pagado);
    }
}
