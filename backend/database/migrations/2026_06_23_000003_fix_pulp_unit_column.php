<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // La BD real puede tener 'unit_of_measure' (schema original) o 'unit' (schema refactorizado)
        $col = Schema::hasColumn('products', 'unit') ? 'unit' : 'unit_of_measure';

        DB::table('products')
            ->where('category', 'pulp')
            ->update([$col => 'paquete']);
    }

    public function down(): void
    {
        $col = Schema::hasColumn('products', 'unit') ? 'unit' : 'unit_of_measure';

        DB::table('products')
            ->where('category', 'pulp')
            ->update([$col => 'kg']);
    }
};
