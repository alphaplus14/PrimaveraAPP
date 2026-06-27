<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farm_task_workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_task_id')->constrained('farm_tasks')->cascadeOnDelete();
            $table->string('worker_name', 100);
            $table->enum('payment_mode', ['per_kg', 'per_day']);
            $table->decimal('quantity_kg', 10, 3)->nullable();
            $table->decimal('rate', 12, 2);
            $table->decimal('total_paid', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farm_task_workers');
    }
};
