<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $table = 'customers';

    protected $fillable = [
        'name',
        'type',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'customer_id');
    }
}
