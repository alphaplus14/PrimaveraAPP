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

<<<<<<< HEAD
        DB::table('products')->where('category', 'pulp')->update(['unit' => 'paquete']);
=======
        if (Schema::hasColumn('products', 'unit')) {
            DB::table('products')->where('category', 'pulp')->update(['unit' => 'paquete']);
        }
>>>>>>> 3ba27866b9ba67231e6191ef5d9566af9f68058d
    }

    public function down(): void
    {
        Schema::table('transformations', function (Blueprint $table) {
            $table->dropColumn('pulp_quantity_packages');
        });

<<<<<<< HEAD
        DB::table('products')->where('category', 'pulp')->update(['unit' => 'kg']);
=======
        if (Schema::hasColumn('products', 'unit')) {
            DB::table('products')->where('category', 'pulp')->update(['unit' => 'kg']);
        }
>>>>>>> 3ba27866b9ba67231e6191ef5d9566af9f68058d
    }
};
