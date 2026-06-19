<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained()->restrictOnDelete();
            $table->enum('tipo', ['compra', 'venta', 'transformacion', 'ajuste']);
            $table->decimal('cantidad_kg', 10, 3)->comment('positivo = entrada, negativo = salida');
            $table->date('fecha');
            $table->unsignedBigInteger('referencia_id')->nullable()->comment('ID de compra, venta, transformacion o ajuste');
            $table->string('motivo')->nullable()->comment('requerido para ajustes manuales');
            $table->timestamps();

            $table->index(['producto_id', 'fecha']);
            $table->index(['tipo', 'referencia_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_inventario');
    }
};
