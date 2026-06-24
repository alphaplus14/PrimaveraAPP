<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transformations', function (Blueprint $table) {
            $table->unsignedInteger('pulp_quantity_packages')->default(0)->after('pulp_product_id');
        });

        DB::table('products')->where('category', 'pulp')->update(['unit' => 'paquete']);
    }

    public function down(): void
    {
        Schema::table('transformations', function (Blueprint $table) {
            $table->dropColumn('pulp_quantity_packages');
        });

        DB::table('products')->where('category', 'pulp')->update(['unit' => 'kg']);
    }
};
