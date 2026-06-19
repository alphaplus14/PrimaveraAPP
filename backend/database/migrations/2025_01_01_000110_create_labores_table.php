<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labores', function (Blueprint $table) {
            $table->id();
            $table->date('fecha');
            $table->string('tipo_labor');
            $table->string('cultivo')->nullable();
            $table->string('responsable')->nullable();
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labores');
    }
};
