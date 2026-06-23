<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $pares = [
            'Guayaba ácida'   => 'Pulpa guayaba ácida',
            'Tomate de árbol' => 'Pulpa tomate de árbol',
            'Guayaba dulce'   => 'Pulpa guayaba dulce',
            'Lulo'            => 'Pulpa lulo',
        ];

        foreach ($pares as $frutaNombre => $pulpaNombre) {
            $fruta = DB::table('products')->where('name', $frutaNombre)->first();
            $pulpa = DB::table('products')->where('name', $pulpaNombre)->first();

            if ($fruta && $pulpa) {
                DB::table('products')
                    ->where('id', $fruta->id)
                    ->update(['related_pulp_id' => $pulpa->id]);
            }
        }
    }

    public function down(): void
    {
        DB::table('products')
            ->whereIn('name', ['Guayaba ácida', 'Tomate de árbol', 'Guayaba dulce', 'Lulo'])
            ->update(['related_pulp_id' => null]);
    }
};
