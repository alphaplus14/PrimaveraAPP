<?php

namespace Database\Seeders;

use App\Models\Producto;
use App\Models\Transformacion;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TransformacionDemoSeeder extends Seeder
{
    private const DEMO_TAG = 'DEMO_TRANSFORMACIONES';

    private const NOTAS = [
        'Fruta de segunda, buena para pulpa',
        'Lote del fin de semana',
        'Excedente de cosecha',
        'Transformación en cocina',
        'Preparación para venta en galería',
        null,
    ];

    public function run(): void
    {
        $pares = Producto::query()
            ->where('is_fruit_for_pulp', true)
            ->whereNotNull('related_pulp_id')
            ->get(['id', 'related_pulp_id', 'name']);

        if ($pares->isEmpty()) {
            $this->command?->warn('No hay frutas vinculadas a pulpas. Ejecuta: php artisan migrate && php artisan db:seed --class=ProductoSeeder');

            return;
        }

        $this->limpiarDemoAnterior();

        $hoy = Carbon::today();

        for ($i = 0; $i < 30; $i++) {
            $fruta = $pares->random();
            $kg = round(rand(50, 350) / 10, 1); // 5.0 – 35.0 kg
            $kgPorPaquete = rand(15, 25) / 10; // 1.5 – 2.5 kg/paq
            $paquetes = (int) max(1, ceil($kg / $kgPorPaquete));
            $notaExtra = self::NOTAS[array_rand(self::NOTAS)];
            $notes = $notaExtra
                ? self::DEMO_TAG.' — '.$notaExtra
                : self::DEMO_TAG;

            Transformacion::create([
                'date' => $hoy->copy()->subDays(rand(0, 55))->toDateString(),
                'source_product_id' => $fruta->id,
                'fruit_quantity_kg' => $kg,
                'pulp_product_id' => $fruta->related_pulp_id,
                'pulp_quantity_packages' => $paquetes,
                'pulp_quantity_kg' => $kg,
                'notes' => $notes,
            ]);
        }

        $this->command?->info('30 transformaciones demo insertadas correctamente.');
    }

    private function limpiarDemoAnterior(): void
    {
        Transformacion::where('notes', self::DEMO_TAG)
            ->orWhere('notes', 'like', self::DEMO_TAG.' — %')
            ->delete();
    }
}
