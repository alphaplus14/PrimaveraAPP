<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('quantity_kg', 10, 3);
            $table->enum('sale_type', ['retail', 'wholesale']);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total', 10, 2);
            $table->boolean('forced')->default(false)->comment('true if sold with insufficient stock');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
