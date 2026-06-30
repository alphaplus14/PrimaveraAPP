<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaborWorker extends Model
{
    protected $table = 'farm_task_workers';

    protected $fillable = [
        'farm_task_id',
        'worker_name',
        'payment_mode',
        'quantity_kg',
        'rate',
        'total_paid',
    ];

    protected $casts = [
        'quantity_kg' => 'decimal:3',
        'rate'        => 'decimal:2',
        'total_paid'  => 'decimal:2',
    ];

    public function labor(): BelongsTo
    {
        return $this->belongsTo(Labor::class, 'farm_task_id');
    }

    public static function computeTotal(string $paymentMode, ?float $quantityKg, float $rate): float
    {
        if ($paymentMode === 'per_kg') {
            return round((float) $quantityKg * $rate, 2);
        }

        return round($rate, 2);
    }
}
