<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proveedor extends Model
{
    protected $fillable = [
        'nombre',
        'tipo',
        'telefono',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function compras(): HasMany
    {
        return $this->hasMany(Compra::class);
    }
}
