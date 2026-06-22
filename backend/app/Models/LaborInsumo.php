<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaborInsumo extends Model
{
    protected $table = 'farm_task_supply';

    protected $fillable = [
        'farm_task_id',
        'supply_id',
        'quantity_used',
    ];

    protected $casts = [
        'quantity_used' => 'decimal:3',
    ];

    public function labor(): BelongsTo
    {
        return $this->belongsTo(Labor::class, 'farm_task_id');
    }

    public function insumo(): BelongsTo
    {
        return $this->belongsTo(Insumo::class, 'supply_id');
    }
}
