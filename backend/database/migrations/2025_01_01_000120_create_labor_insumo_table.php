<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labor_insumo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('labor_id')->constrained('labores')->cascadeOnDelete();
            $table->foreignId('insumo_id')->constrained('insumos')->restrictOnDelete();
            $table->decimal('cantidad_usada', 10, 3);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labor_insumo');
    }
};
