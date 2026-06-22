<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['retail', 'wholesale']);
            $table->decimal('amount', 10, 2);
            $table->date('effective_from');
            $table->timestamps();

            $table->index(['product_id', 'type', 'effective_from']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prices');
    }
};
