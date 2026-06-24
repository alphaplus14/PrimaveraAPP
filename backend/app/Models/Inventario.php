<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventario extends Model
{
    protected $table = 'inventories';

    /**
     * quantity_kg: cantidad en la unidad del producto (kg o paquetes).
     * Ver Producto::stockUnit().
     */
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

    public function addQuantity(float $amount): void
    {
        $this->increment('quantity_kg', $amount);
    }

    public function subtractQuantity(float $amount): void
    {
        $this->decrement('quantity_kg', $amount);
    }
}
