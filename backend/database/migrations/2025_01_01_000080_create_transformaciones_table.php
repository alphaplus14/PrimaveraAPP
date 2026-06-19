<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transformaciones', function (Blueprint $table) {
            $table->id();
            $table->date('fecha');
            $table->foreignId('producto_origen_id')->constrained('productos')->restrictOnDelete();
            $table->decimal('cantidad_fruta_kg', 10, 3);
            $table->foreignId('producto_pulpa_id')->constrained('productos')->restrictOnDelete();
            $table->decimal('cantidad_pulpa_kg', 10, 3);
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transformaciones');
    }
};
