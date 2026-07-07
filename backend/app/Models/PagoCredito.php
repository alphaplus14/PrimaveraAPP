<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PagoCredito extends Model
{
    protected $table = 'credit_payments';

    protected $fillable = [
        'customer_id',
        'sale_id',
        'date',
        'amount',
        'notes',
    ];

    protected $casts = [
        'date'   => 'date',
        'amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'customer_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'sale_id');
    }
}
