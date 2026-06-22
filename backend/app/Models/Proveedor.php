<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proveedor extends Model
{
    protected $table = 'suppliers';

    protected $fillable = [
        'name',
        'type',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function compras(): HasMany
    {
        return $this->hasMany(Compra::class, 'supplier_id');
    }
}
