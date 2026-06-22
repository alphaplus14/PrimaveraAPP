<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Precio extends Model
{
    protected $table = 'prices';

    protected $fillable = [
        'product_id',
        'type',
        'amount',
        'effective_from',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'effective_from' => 'date',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'product_id');
    }
}
