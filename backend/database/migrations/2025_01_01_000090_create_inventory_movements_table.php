<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->enum('type', ['purchase', 'sale', 'transformation', 'adjustment']);
            $table->decimal('quantity_kg', 10, 3)->comment('positive = entry, negative = exit');
            $table->date('date');
            $table->unsignedBigInteger('reference_id')->nullable()->comment('ID of purchase, sale, transformation or adjustment');
            $table->string('reason')->nullable()->comment('required for manual adjustments');
            $table->timestamps();

            $table->index(['product_id', 'date']);
            $table->index(['type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
