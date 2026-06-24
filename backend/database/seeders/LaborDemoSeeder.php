<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class LaborDemoSeeder extends Seeder
{
    private const DEMO_TAG = 'DEMO_LABORES';

    private const TIPOS = [
        'Siembra', 'Cosecha', 'Fumigación', 'Fertilización',
        'Poda', 'Riego', 'Limpieza', 'Control de plagas',
    ];

    private const CULTIVOS = [
        'Plátano', 'Banano', 'Yuca', 'Limón', 'Mandarina',
        'Naranja', 'Aguacate', 'Guayaba ácida', 'Tomate de árbol', 'Lulo',
    ];

    private const RESPONSABLES = [
        'Carlos', 'María', 'Pedro', 'Ana', 'Jorge', 'Lucía',
    ];

    private const DETALLES = [
        'Sector norte de la finca',
        'Lote junto al camino principal',
        'Área de cultivo propio',
        'Parcela de reserva',
        'Zona de galería',
        'Terreno bajo sombra',
        null,
    ];

    public function run(): void
    {
        $this->limpiarDemoAnterior();

        $insumos = $this->asegurarInsumosDemo();
        $hoy = Carbon::today();
        $responsibleCol = Schema::hasColumn('farm_tasks', 'responsible') ? 'responsible' : 'assigned_to';
        $now = now();

        for ($i = 0; $i < 20; $i++) {
            $tipo = self::TIPOS[array_rand(self::TIPOS)];
            $detalle = self::DETALLES[array_rand(self::DETALLES)];
            $description = $detalle
                ? self::DEMO_TAG.' — '.$detalle
                : self::DEMO_TAG;

            $laborId = DB::table('farm_tasks')->insertGetId([
                'date' => $hoy->copy()->subDays(rand(0, 60))->toDateString(),
                'task_type' => $tipo,
                'crop' => self::CULTIVOS[array_rand(self::CULTIVOS)],
                $responsibleCol => self::RESPONSABLES[array_rand(self::RESPONSABLES)],
                'description' => $description,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($insumos->isNotEmpty() && rand(0, 99) < 55) {
                $usados = $insumos->random(rand(1, min(2, $insumos->count())));
                foreach ($usados as $insumo) {
                    DB::table('farm_task_supply')->insert([
                        'farm_task_id' => $laborId,
                        'supply_id' => $insumo->id,
                        'quantity_used' => round(rand(5, 50) / 10, 1),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }

        $this->command?->info('20 labores demo insertadas correctamente.');
    }

    private function asegurarInsumosDemo()
    {
        $existentes = DB::table('supplies')
            ->where('name', 'like', self::DEMO_TAG.'%')
            ->get();

        if ($existentes->isNotEmpty()) {
            return $existentes;
        }

        $unitCol = Schema::hasColumn('supplies', 'unit') ? 'unit' : 'unit_of_measure';
        $activeCol = Schema::hasColumn('supplies', 'active') ? 'active' : 'is_active';
        $now = now();

        $catalogo = [
            ['name' => self::DEMO_TAG.' — Abono orgánico', 'type' => 'fertilizer', 'unit' => 'kg'],
            ['name' => self::DEMO_TAG.' — Fungicida', 'type' => 'chemical', 'unit' => 'L'],
            ['name' => self::DEMO_TAG.' — Herbicida', 'type' => 'chemical', 'unit' => 'L'],
            ['name' => self::DEMO_TAG.' — Guantes', 'type' => 'other', 'unit' => 'und'],
        ];

        foreach ($catalogo as $item) {
            DB::table('supplies')->insert([
                'name' => $item['name'],
                'type' => $item['type'],
                $unitCol => $item['unit'],
                'current_stock' => 100,
                $activeCol => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        return DB::table('supplies')
            ->where('name', 'like', self::DEMO_TAG.'%')
            ->get();
    }

    private function limpiarDemoAnterior(): void
    {
        DB::table('farm_tasks')
            ->where('description', self::DEMO_TAG)
            ->orWhere('description', 'like', self::DEMO_TAG.' — %')
            ->delete();
    }
}
