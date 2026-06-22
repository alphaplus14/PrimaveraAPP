<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Producto extends Model
{
    protected $table = 'products';

    protected $fillable = [
        'name',
        'category',
        'unit_of_measure',
        'is_active',
        'is_fruit_for_pulp',
        'related_pulp_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_fruit_for_pulp' => 'boolean',
    ];

    public function pulpaRelacionada(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'related_pulp_id');
    }

    public function inventario(): HasOne
    {
        return $this->hasOne(Inventario::class, 'product_id');
    }

    public function precios(): HasMany
    {
        return $this->hasMany(Precio::class, 'product_id');
    }

    public function precioActual(string $type): ?Precio
    {
        return $this->precios()
            ->where('type', $type)
            ->where('effective_from', '<=', now()->toDateString())
            ->orderByDesc('effective_from')
            ->first();
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoInventario::class, 'product_id');
    }

    public function compras(): HasMany
    {
        return $this->hasMany(Compra::class, 'product_id');
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'product_id');
    }
}
