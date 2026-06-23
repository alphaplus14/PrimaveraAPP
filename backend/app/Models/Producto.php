<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Producto extends Model
{
    protected $table = 'productos';

    protected $fillable = [
        'nombre',
        'categoria',
        'unidad_medida',
        'activo',
        'es_fruta_para_pulpa',
        'pulpa_relacionada_id',
    ];

    protected $casts = [
        'activo'              => 'boolean',
        'es_fruta_para_pulpa' => 'boolean',
    ];

    public function pulpaRelacionada(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'pulpa_relacionada_id');
    }

    public function inventario(): HasOne
    {
        return $this->hasOne(Inventario::class, 'producto_id');
    }

    public function precios(): HasMany
    {
        return $this->hasMany(Precio::class, 'producto_id');
    }

    public function precioActual(string $tipo): ?Precio
    {
        return $this->precios()
            ->where('tipo', $tipo)
            ->where('fecha_vigencia_desde', '<=', now()->toDateString())
            ->orderByDesc('fecha_vigencia_desde')
            ->first();
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoInventario::class, 'producto_id');
    }

    public function compras(): HasMany
    {
        return $this->hasMany(Compra::class, 'producto_id');
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'producto_id');
    }
}
