<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventario extends Model
{
    protected $table = 'inventories';

    protected $fillable = [
        'product_id',
        'quantity_kg',
        'stock_updated_at',
    ];

    protected $casts = [
        'quantity_kg'      => 'decimal:3',
        'stock_updated_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'product_id');
    }
}
