<?php

use App\Support\ProductPulpLinker;
use Illuminate\Database\Migrations\Migration;

/**
 * Backfill para bases de datos que ya tenían productos antes del seeder.
 * En migrate:fresh --seed el vínculo lo hace ProductoSeeder; aquí solo aplica si hay filas.
 */
return new class extends Migration
{
    public function up(): void
    {
        ProductPulpLinker::link(strict: false);
    }

    public function down(): void
    {
        ProductPulpLinker::unlink();
    }
};
