<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Insumo extends Model
{
    protected $table = 'supplies';

    protected $fillable = [
        'name',
        'type',
        'unit_of_measure',
        'current_stock',
        'is_active',
    ];

    protected $casts = [
        'current_stock' => 'decimal:3',
        'is_active' => 'boolean',
    ];

    public function laborInsumos(): HasMany
    {
        return $this->hasMany(LaborInsumo::class, 'supply_id');
    }
}
