<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Venta extends Model
{
    protected $table = 'ventas';

    protected $fillable = [
        'fecha',
        'cliente_id',
        'producto_id',
        'cantidad_kg',
        'tipo_venta',
        'precio_unitario',
        'total',
    ];

    protected $casts = [
        'fecha'           => 'date',
        'cantidad_kg'     => 'decimal:3',
        'precio_unitario' => 'decimal:2',
        'total'           => 'decimal:2',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
