<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaborInsumo extends Model
{
    protected $table = 'labor_insumo';

    protected $fillable = [
        'labor_id',
        'insumo_id',
        'cantidad_usada',
    ];

    protected $casts = [
        'cantidad_usada' => 'decimal:3',
    ];

    public function labor(): BelongsTo
    {
        return $this->belongsTo(Labor::class);
    }

    public function insumo(): BelongsTo
    {
        return $this->belongsTo(Insumo::class);
    }
}
