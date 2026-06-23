<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Labor extends Model
{
    protected $table = 'farm_tasks';

    protected $fillable = [
        'date',
        'task_type',
        'crop',
        'responsible',
        'description',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function farmTaskSupplies(): HasMany
    {
        return $this->hasMany(LaborInsumo::class, 'farm_task_id');
    }

    public function supplies(): BelongsToMany
    {
        return $this->belongsToMany(Insumo::class, 'farm_task_supply', 'farm_task_id', 'supply_id')
            ->withPivot('quantity_used')
            ->withTimestamps();
    }
}
