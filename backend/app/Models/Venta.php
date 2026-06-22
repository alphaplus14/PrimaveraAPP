<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Venta extends Model
{
    protected $table = 'sales';

    protected $fillable = [
        'date',
        'customer_id',
        'product_id',
        'quantity_kg',
        'sale_type',
        'unit_price',
        'total',
        'forced',
    ];

    protected $casts = [
        'date' => 'date',
        'quantity_kg' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'total' => 'decimal:2',
        'forced' => 'boolean',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'customer_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'product_id');
    }
}
