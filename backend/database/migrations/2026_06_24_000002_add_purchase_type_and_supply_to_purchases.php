<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            if (! Schema::hasColumn('purchases', 'purchase_type')) {
                $table->enum('purchase_type', ['resale', 'farm_supply'])
                    ->default('resale')
                    ->after('supplier_id');
            }

            if (! Schema::hasColumn('purchases', 'supply_id')) {
                $table->foreignId('supply_id')
                    ->nullable()
                    ->after('product_id')
                    ->constrained('supplies')
                    ->nullOnDelete();
            }
        });

        if (Schema::hasColumn('purchases', 'product_id')) {
            DB::statement('ALTER TABLE purchases MODIFY product_id BIGINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            if (Schema::hasColumn('purchases', 'supply_id')) {
                $table->dropForeign(['supply_id']);
                $table->dropColumn('supply_id');
            }
            if (Schema::hasColumn('purchases', 'purchase_type')) {
                $table->dropColumn('purchase_type');
            }
        });

        if (Schema::hasColumn('purchases', 'product_id')) {
            DB::statement('ALTER TABLE purchases MODIFY product_id BIGINT UNSIGNED NOT NULL');
        }
    }
};
