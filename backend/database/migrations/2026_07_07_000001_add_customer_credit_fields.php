<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('id_number', 20)->nullable()->after('name');
            $table->string('address')->nullable()->after('phone');
            $table->boolean('allows_credit')->default(false)->after('address');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->boolean('is_credit')->default(false)->after('forced');
            $table->decimal('amount_paid', 10, 2)->nullable()->after('is_credit');
        });

        Schema::create('credit_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->date('date');
            $table->decimal('amount', 10, 2);
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_payments');

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['is_credit', 'amount_paid']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['id_number', 'address', 'allows_credit']);
        });
    }
};
