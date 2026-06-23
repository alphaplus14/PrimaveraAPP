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
        'unit',
        'current_stock',
        'active',
    ];

    protected $casts = [
        'current_stock' => 'decimal:3',
        'active'        => 'boolean',
    ];

    public function farmTaskSupplies(): HasMany
    {
        return $this->hasMany(LaborInsumo::class, 'supply_id');
    }
}
