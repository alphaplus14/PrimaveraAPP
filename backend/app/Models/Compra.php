<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Compra extends Model
{
    protected $fillable = [
        'fecha',
        'proveedor_id',
        'producto_id',
        'cantidad_kg',
        'precio_unitario',
        'total',
        'observaciones',
    ];

    protected $casts = [
        'fecha' => 'date',
        'cantidad_kg' => 'decimal:3',
        'precio_unitario' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
