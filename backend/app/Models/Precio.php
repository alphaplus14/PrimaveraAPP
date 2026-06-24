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
        'value',
        'valid_from',
    ];

    protected $casts = [
        'value'      => 'decimal:2',
        'valid_from' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'product_id');
    }
}
