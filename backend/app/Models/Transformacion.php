<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transformacion extends Model
{
    protected $fillable = [
        'fecha',
        'producto_origen_id',
        'cantidad_fruta_kg',
        'producto_pulpa_id',
        'cantidad_pulpa_kg',
        'observaciones',
    ];

    protected $casts = [
        'fecha' => 'date',
        'cantidad_fruta_kg' => 'decimal:3',
        'cantidad_pulpa_kg' => 'decimal:3',
    ];

    public function productoOrigen(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_origen_id');
    }

    public function productoPulpa(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_pulpa_id');
    }
}
