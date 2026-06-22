<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farm_tasks', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('task_type');
            $table->string('crop')->nullable();
            $table->string('assigned_to')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farm_tasks');
    }
};
