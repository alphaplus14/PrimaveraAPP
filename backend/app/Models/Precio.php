<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Precio extends Model
{
    protected $fillable = [
        'producto_id',
        'tipo',
        'valor',
        'fecha_vigencia_desde',
    ];

    protected $casts = [
        'valor' => 'decimal:2',
        'fecha_vigencia_desde' => 'date',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
