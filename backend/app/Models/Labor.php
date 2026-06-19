<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Labor extends Model
{
    protected $fillable = [
        'fecha',
        'tipo_labor',
        'cultivo',
        'responsable',
        'descripcion',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function laborInsumos(): HasMany
    {
        return $this->hasMany(LaborInsumo::class);
    }

    public function insumos(): BelongsToMany
    {
        return $this->belongsToMany(Insumo::class, 'labor_insumo')
            ->withPivot('cantidad_usada')
            ->withTimestamps();
    }
}
