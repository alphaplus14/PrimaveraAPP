<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->enum('categoria', ['propio', 'comprado', 'pulpa']);
            $table->string('unidad_medida')->default('kg');
            $table->boolean('activo')->default(true);
            $table->boolean('es_fruta_para_pulpa')->default(false);
            $table->foreignId('pulpa_relacionada_id')->nullable()->constrained('productos')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
