<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Venta extends Model
{
    protected $fillable = [
        'fecha',
        'cliente_id',
        'producto_id',
        'cantidad_kg',
        'tipo_venta',
        'precio_unitario',
        'total',
        'forzado',
    ];

    protected $casts = [
        'fecha' => 'date',
        'cantidad_kg' => 'decimal:3',
        'precio_unitario' => 'decimal:2',
        'total' => 'decimal:2',
        'forzado' => 'boolean',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
