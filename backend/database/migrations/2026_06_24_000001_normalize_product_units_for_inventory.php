<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bases antiguas pueden tener unit_of_measure en lugar de unit
        if (Schema::hasColumn('products', 'unit_of_measure')) {
            if (! Schema::hasColumn('products', 'unit')) {
                Schema::table('products', function (Blueprint $table) {
                    $table->string('unit')->default('kg')->after('category');
                });
            }

            DB::table('products')
                ->whereNotNull('unit_of_measure')
                ->orderBy('id')
                ->chunkById(100, function ($rows) {
                    foreach ($rows as $row) {
                        DB::table('products')
                            ->where('id', $row->id)
                            ->update(['unit' => $row->unit_of_measure]);
                    }
                });

            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('unit_of_measure');
            });
        }

        // Pulpa: inventario en paquetes (quantity_kg almacena la unidad del producto)
        if (Schema::hasColumn('products', 'unit')) {
            DB::table('products')->where('category', 'pulp')->update(['unit' => 'paquete']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'unit')) {
            DB::table('products')->where('category', 'pulp')->update(['unit' => 'kg']);
        }
    }
};
