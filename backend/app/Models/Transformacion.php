<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transformacion extends Model
{
    protected $table = 'transformations';

    protected $fillable = [
        'date',
        'source_product_id',
        'fruit_quantity_kg',
        'pulp_product_id',
        'pulp_quantity_packages',
        'pulp_quantity_kg',
        'notes',
    ];

    protected $casts = [
        'date'              => 'date',
        'fruit_quantity_kg'      => 'decimal:3',
        'pulp_quantity_packages' => 'integer',
        'pulp_quantity_kg'       => 'decimal:3',
    ];

    public function sourceProduct(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'source_product_id');
    }

    public function pulpProduct(): Be