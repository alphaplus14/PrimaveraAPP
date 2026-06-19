<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ventas', function (Blueprint $table) {
            $table->id();
            $table->date('fecha');
            $table->foreignId('cliente_id')->constrained()->restrictOnDelete();
            $table->foreignId('producto_id')->constrained()->restrictOnDelete();
            $table->decimal('cantidad_kg', 10, 3);
            $table->enum('tipo_venta', ['detal', 'mayorista']);
            $table->decimal('precio_unitario', 10, 2);
            $table->decimal('total', 10, 2);
            $table->boolean('forzado')->default(false)->comment('true si se vendió con stock insuficiente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ventas');
    }
};
