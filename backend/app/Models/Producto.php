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
        'unit',
        'active',
        'is_pulp_fruit',
        'related_pulp_id',
    ];

    protected $casts = [
        'active'        => 'boolean',
        'is_pulp_fruit' => 'boolean',
    ];

    /** Inventario de pulpas se lleva en paquetes; el resto en kg. */
    public function usesPackages(): bool
    {
        return $this->category === 'pulp' || $this->unit === 'paquete';
    }

    public function stockUnit(): string
    {
        return $this->usesPackages() ? 'paquete' : ($this->unit ?? 'kg');
    }

    public function relatedPulp(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'related_pulp_id');
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(Inventario::class, 'product_id');
    }

    public function prices(): HasMany
    {
        return $this->hasMany(Precio::class, 'product_id');
    }

    public function currentPrice(string $type): ?Precio
    {
        return $this->prices()
            ->where('type', $type)
            ->where('valid_from', '<=', now()->toDateString())
            ->orderByDesc('valid_from')
            ->first();
    }

    public function movements(): HasMany
    {
        return $this->hasMany(MovimientoInventario::class, 'product_id');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Compra::class, 'product_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Venta::class, 'product_id');
    }
}
