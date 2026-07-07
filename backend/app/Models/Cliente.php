<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $table = 'customers';

    protected $fillable = [
        'name',
        'id_number',
        'type',
        'phone',
        'address',
        'allows_credit',
        'active',
    ];

    protected $casts = [
        'active'        => 'boolean',
        'allows_credit' => 'boolean',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Venta::class, 'customer_id');
    }

    public function creditPayments(): HasMany
    {
        return $this->hasMany(PagoCredito::class, 'customer_id');
    }
}
