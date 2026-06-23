<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventario extends Model
{
    protected $table = 'inventarios';

    protected $fillable = [
        'producto_id',
        'cantidad_kg',
        'fecha_actualizacion',
    ];

    protected $casts = [
        'cantidad_kg'          => 'decimal:3',
        'fecha_actualizacion'  => 'datetime',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
