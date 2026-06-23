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
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Venta::class, 'customer_id');
    }
}
