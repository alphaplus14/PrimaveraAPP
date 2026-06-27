<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Compra extends Model
{
    protected $table = 'purchases';

    protected $fillable = [
        'date',
        'supplier_id',
        'purchase_type',
        'product_id',
        'supply_id',
        'quantity_kg',
        'unit_price',
        'total',
        'notes',
    ];

    protected $casts = [
        'date'        => 'date',
        'quantity_kg' => 'decimal:3',
        'unit_price'  => 'decimal:2',
        'total'       => 'decimal:2',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'supplier_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'product_id');
    }

    public function supply(): BelongsTo
    {
        return $this->belongsTo(Insumo::class, 'supply_id');
    }

    public function isFarmSupply(): bool
    {
        return $this->purchase_type === 'farm_supply';
    }
}
