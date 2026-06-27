<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = ['products', 'suppliers', 'customers', 'supplies'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table)
                && Schema::hasColumn($table, 'is_active')
                && ! Schema::hasColumn($table, 'active')) {
                DB::statement("ALTER TABLE `{$table}` CHANGE `is_active` `active` TINYINT(1) NOT NULL DEFAULT 1");
            }
        }

        if (Schema::hasTable('products')
            && Schema::hasColumn('products', 'is_fruit_for_pulp')
            && ! Schema::hasColumn('products', 'is_pulp_fruit')) {
            DB::statement(
                'ALTER TABLE `products` CHANGE `is_fruit_for_pulp` `is_pulp_fruit` TINYINT(1) NOT NULL DEFAULT 0'
            );
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products')
            && Schema::hasColumn('products', 'is_pulp_fruit')
            && ! Schema::hasColumn('products', 'is_fruit_for_pulp')) {
            DB::statement(
                'ALTER TABLE `products` CHANGE `is_pulp_fruit` `is_fruit_for_pulp` TINYINT(1) NOT NULL DEFAULT 0'
            );
        }

        foreach ($this->tables as $table) {
            if (Schema::hasTable($table)
                && Schema::hasColumn($table, 'active')
                && ! Schema::hasColumn($table, 'is_active')) {
                DB::statement("ALTER TABLE `{$table}` CHANGE `active` `is_active` TINYINT(1) NOT NULL DEFAULT 1");
            }
        }
    }
};
