<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('precios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained()->cascadeOnDelete();
            $table->enum('tipo', ['detal', 'mayorista']);
            $table->decimal('valor', 10, 2);
            $table->date('fecha_vigencia_desde');
            $table->timestamps();

            $table->index(['producto_id', 'tipo', 'fecha_vigencia_desde']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('precios');
    }
};
