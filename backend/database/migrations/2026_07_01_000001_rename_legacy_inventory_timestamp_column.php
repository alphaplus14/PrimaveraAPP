<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('inventories')) {
            return;
        }

        if (Schema::hasColumn('inventories', 'quantity_updated_at')
            && ! Schema::hasColumn('inventories', 'stock_updated_at')) {
            DB::statement(
                'ALTER TABLE `inventories` CHANGE `quantity_updated_at` `stock_updated_at` TIMESTAMP NULL DEFAULT NULL'
            );
        } elseif (! Schema::hasColumn('inventories', 'stock_updated_at')) {
            Schema::table('inventories', function (Blueprint $table) {
                $table->timestamp('stock_updated_at')->nullable()->after('quantity_kg');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('inventories')) {
            return;
        }

        if (Schema::hasColumn('inventories', 'stock_updated_at')
            && ! Schema::hasColumn('inventories', 'quantity_updated_at')) {
            DB::statement(
                'ALTER TABLE `inventories` CHANGE `stock_updated_at` `quantity_updated_at` TIMESTAMP NULL DEFAULT NULL'
            );
        }
    }
};
