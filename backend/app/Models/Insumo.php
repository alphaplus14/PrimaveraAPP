<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Insumo extends Model
{
    protected $table = 'insumos';

    protected $fillable = [
        'nombre',
        'tipo',
        'unidad_medida',
        'stock_actual',
        'activo',
    ];

    protected $casts = [
        'stock_actual' => 'decimal:3',
        'activo'       => 'boolean',
    ];

    public function laborInsumos(): HasMany
    {
        return $this->hasMany(LaborInsumo::class, 'insumo_id');
    }
}
