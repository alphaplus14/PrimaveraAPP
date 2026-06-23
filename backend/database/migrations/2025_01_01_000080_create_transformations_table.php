<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transformations', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('source_product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('fruit_quantity_kg', 10, 3);
            $table->foreignId('pulp_product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('pulp_quantity_kg', 10, 3);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transformations');
    }
};
