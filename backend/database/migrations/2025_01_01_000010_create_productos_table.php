<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('category', ['own', 'purchased', 'pulp']);
            $table->string('unit_of_measure')->default('kg');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_fruit_for_pulp')->default(false);
            $table->foreignId('related_pulp_id')->nullable()->constrained('products')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
