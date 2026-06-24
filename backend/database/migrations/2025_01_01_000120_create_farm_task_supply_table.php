<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farm_task_supply', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_task_id')->constrained('farm_tasks')->cascadeOnDelete();
            $table->foreignId('supply_id')->constrained('supplies')->restrictOnDelete();
            $table->decimal('quantity_used', 10, 3);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farm_task_supply');
    }
};
