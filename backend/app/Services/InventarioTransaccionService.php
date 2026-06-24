<?php

namespace App\Services;

use App\Models\Compra;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Venta;

class InventarioTransaccionService
{
    public function revertirVenta(Venta $venta): void
    {
        $inventario = Inventario::where('product_id', $venta->product_id)->first();

        if ($inventario) {
            $inventario->addQuantity((float) $venta->quantity_kg);
            $inventario->stock_updated_at = now();
            $inventario->save();
        }

        MovimientoInventario::query()
            ->where('type', 'sale')
            ->where('reference_id', $venta->id)
            ->delete();
    }

    public function aplicarVenta(Venta $venta): void
    {
        $inventario = Inventario::where('product_id', $venta->product_id)->first();

        if ($inventario) {
            $inventario->subtractQuantity((float) $venta->quantity_kg);
            $inventario->stock_updated_at = now();
            $inventario->save();
        }

        MovimientoInventario::create([
            'product_id'   => $venta->product_id,
            'type'         => 'sale',
            'quantity_kg'  => -$venta->quantity_kg,
            'date'         => $venta->date,
            'reference_id' => $venta->id,
        ]);
    }

    public function stockDisponibleVenta(int $productId): float
    {
        $inventario = Inventario::where('product_id', $productId)->first();

        return $inventario ? (float) $inventario->quantity_kg : 0.0;
    }

    public function revertirCompra(Compra $compra): void
    {
        $inventario = Inventario::where('product_id', $compra->product_id)->first();

        if ($inventario) {
            $inventario->subtractQuantity((float) $compra->quantity_kg);
            $inventario->stock_updated_at = now();
            $inventario->save();
        }

        MovimientoInventario::query()
            ->where('type', 'purchase')
            ->where('reference_id', $compra->id)
            ->delete();
    }

    public function aplicarCompra(Compra $compra): void
    {
        $inventario = Inventario::where('product_id', $compra->product_id)->first();

        if ($inventario) {
            $inventario->addQuantity((float) $compra->quantity_kg);
            $inventario->stock_updated_at = now();
            $inventario->save();
        }

        MovimientoInventario::create([
            'product_id'   => $compra->product_id,
            'type'         => 'purchase',
            'quantity_kg'  => $compra->quantity_kg,
            'date'         => $compra->date,
            'reference_id' => $compra->id,
        ]);
    }
}
