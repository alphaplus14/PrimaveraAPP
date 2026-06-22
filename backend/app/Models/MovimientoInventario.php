<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoInventario extends Model
{
    protected $table = 'inventory_movements';

    protected $fillable = [
        'product_id',
        'type',
        'quantity_kg',
        'date',
        'reference_id',
        'reason',
    ];

    protected $casts = [
        'quantity_kg' => 'decimal:3',
        'date' => 'date',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'product_id');
    }
}
