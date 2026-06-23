<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Labor extends Model
{
    protected $table = 'labores';

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
        return $this->hasMany(LaborInsumo::class, 'labor_id');
    }

    public function insumos(): BelongsToMany
    {
        return $this->belongsToMany(Insumo::class, 'labor_insumo', 'labor_id', 'insumo_id')
            ->withPivot('cantidad_usada')
            ->withTimestamps();
    }
}
