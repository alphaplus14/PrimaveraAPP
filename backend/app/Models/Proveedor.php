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
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function purchases(): HasMany
    {
        return $this->hasMany(Compra::class, 'supplier_id');
    }
}
