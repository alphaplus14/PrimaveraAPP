<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Compra;
use App\Models\Inventario;
use App\Models\Labor;
use App\Models\LaborWorker;
use App\Models\MovimientoInventario;
use App\Models\Precio;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Datos de demostración con fecha de hoy (y últimas semanas para el gráfico del dashboard).
 * Ejecutar: php artisan db:seed --class=DatosHoySeeder
 */
class DatosHoySeeder extends Seeder
{
    public const TAG = 'DEMO_HOY';

    public function run(): void
    {
        if (Cliente::where('active', true)->count() === 0) {
            $this->call(ClienteSeeder::class);
        }
        if (Precio::count() === 0) {
            $this->call(PrecioSeeder::class);
        }

        $clientes = Cliente::where('active', true)->pluck('id')->all();
        $productos = Producto::where('active', true)->get();
        $proveedores = Proveedor::where('active', true)->pluck('id')->all();

        if ($clientes === [] || $productos->isEmpty() || $proveedores === []) {
            $this->command?->error('Faltan datos base (clientes, productos o proveedores).');

            return;
        }

        $this->limpiarAnterior();

        DB::transaction(function () use ($clientes, $productos, $proveedores) {
            $hoy = Carbon::today();
            $this->asegurarStock($productos);

            // Ventas en las últimas 8 semanas (gráfico del dashboard)
            $totalesSemana = [420000, 510000, 480000, 590000, 640000, 710000, 780000, 950000];
            for ($semana = 7; $semana >= 0; $semana--) {
                $inicio = $hoy->copy()->startOfWeek(Carbon::MONDAY)->subWeeks($semana);
                $meta = $totalesSemana[7 - $semana];
                $acumulado = 0.0;
                $intentos = 0;

                while ($acumulado < $meta * 0.9 && $intentos < 50) {
                    $intentos++;
                    $fecha = $inicio->copy()->addDays(rand(0, 6));
                    if ($fecha->gt($hoy)) {
                        continue;
                    }
                    $acumulado += $this->crearVenta($fecha, $clientes, $productos);
                }
            }

            // Mínimo 25 ventas adicionales de hoy
            for ($i = 0; $i < 25; $i++) {
                $this->crearVenta($hoy, $clientes, $productos);
            }

            // Compras de reventa hoy (reportes Compras + Rentabilidad)
            $nombresCompra = ['Plátano', 'Banano', 'Limón', 'Aguacate', 'Fresa', 'Maracuyá', 'Mango Tommy', 'Papaya'];
            foreach (collect($nombresCompra)->take(8) as $index => $nombre) {
                $producto = $productos->firstWhere('name', $nombre) ?? $productos->random();
                $kg = [30, 22, 15, 12, 8, 10, 18, 14][$index] ?? 10;
                $this->crearCompra($hoy, $proveedores, $producto, $kg, 'resale');
            }

            // Cosechas de hoy (reporte Cosechas)
            $cultivos = ['Plátano', 'Banano', 'Yuca', 'Limón', 'Aguacate', 'Guayaba ácida', 'Tomate de árbol'];
            $colaboradores = ['Carlos', 'María', 'Pedro', 'Ana', 'Jorge', 'Lucía', 'Roberto'];
            foreach (collect($cultivos)->take(6) as $cultivo) {
                $responsibleCol = Schema::hasColumn('farm_tasks', 'responsible') ? 'responsible' : 'assigned_to';
                $now = now();

                $laborId = DB::table('farm_tasks')->insertGetId([
                    'date' => $hoy->toDateString(),
                    'task_type' => 'Cosecha',
                    'crop' => $cultivo,
                    $responsibleCol => $colaboradores[array_rand($colaboradores)],
                    'description' => self::TAG,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $numWorkers = rand(2, 3);
                for ($w = 0; $w < $numWorkers; $w++) {
                    $modo = rand(0, 1) ? 'per_kg' : 'per_day';
                    $kg = $modo === 'per_kg' ? round(rand(15, 55) + rand(0, 9) / 10, 1) : null;
                    $tarifa = $modo === 'per_kg' ? rand(600, 1200) : rand(35000, 55000);
                    $pagado = LaborWorker::computeTotal($modo, $kg, $tarifa);

                    LaborWorker::create([
                        'farm_task_id' => $laborId,
                        'worker_name' => $colaboradores[array_rand($colaboradores)],
                        'payment_mode' => $modo,
                        'quantity_kg' => $kg,
                        'rate' => $tarifa,
                        'total_paid' => $pagado,
                    ]);
                }
            }

            // Ajustes de inventario hoy (reporte Movimientos)
            foreach ($productos->random(min(5, $productos->count())) as $producto) {
                $delta = round((rand(-5, 8) + rand(0, 9) / 10), 1);
                if ($delta == 0.0) {
                    $delta = 2.5;
                }

                MovimientoInventario::create([
                    'product_id' => $producto->id,
                    'type' => 'adjustment',
                    'quantity_kg' => $delta,
                    'date' => $hoy->toDateString(),
                    'reference_id' => null,
                    'reason' => self::TAG.' — ajuste demo',
                ]);

                $inv = Inventario::firstOrCreate(
                    ['product_id' => $producto->id],
                    $this->inventarioDefaults()
                );
                $inv->increment('quantity_kg', $delta);
                $this->touchInventario($inv, $hoy);
            }
        });

        $ventasHoy = Venta::whereDate('date', Carbon::today())->count();
        $comprasHoy = Compra::whereDate('date', Carbon::today())->count();
        $cosechasHoy = Labor::whereDate('date', Carbon::today())
            ->where('task_type', 'like', 'Cosecha%')
            ->count();
        $movHoy = MovimientoInventario::whereDate('date', Carbon::today())->count();

        $this->command?->info("Datos de hoy insertados: {$ventasHoy} ventas, {$comprasHoy} compras, {$cosechasHoy} cosechas, {$movHoy} movimientos.");
    }

    private function limpiarAnterior(): void
    {
        $ventaIds = MovimientoInventario::where('reason', self::TAG)
            ->where('type', 'sale')
            ->pluck('reference_id');

        Venta::whereIn('id', $ventaIds)->delete();

        $compraIds = MovimientoInventario::where('reason', self::TAG)
            ->where('type', 'purchase')
            ->pluck('reference_id');

        Compra::whereIn('id', $compraIds)->delete();
        Compra::where('notes', self::TAG)->delete();

        MovimientoInventario::where('reason', self::TAG)
            ->orWhere('reason', 'like', self::TAG.'%')
            ->delete();

        $laborIds = Labor::where('description', self::TAG)->pluck('id');
        LaborWorker::whereIn('farm_task_id', $laborIds)->delete();
        Labor::whereIn('id', $laborIds)->delete();
    }

    private function stockTimestampColumn(): string
    {
        return Schema::hasColumn('inventories', 'stock_updated_at')
            ? 'stock_updated_at'
            : 'quantity_updated_at';
    }

    private function touchInventario(Inventario $inventario, Carbon $fecha): void
    {
        $col = $this->stockTimestampColumn();
        $inventario->update([$col => $fecha]);
    }

    private function inventarioDefaults(): array
    {
        $defaults = ['quantity_kg' => 0];
        $col = $this->stockTimestampColumn();
        $defaults[$col] = now();

        return $defaults;
    }

    private function asegurarStock($productos): void
    {
        $col = $this->stockTimestampColumn();

        foreach ($productos as $producto) {
            $actual = (float) (Inventario::where('product_id', $producto->id)->value('quantity_kg') ?? 0);
            Inventario::updateOrCreate(
                ['product_id' => $producto->id],
                ['quantity_kg' => max(50, $actual), $col => now()]
            );
        }
    }

    private function crearVenta(Carbon $fecha, array $clientes, $productos): float
    {
        $producto = $productos->random();
        $tipo = rand(0, 1) ? 'retail' : 'wholesale';
        $precio = $this->precio($producto, $tipo);
        $kg = round(rand(3, 25) + rand(0, 9) / 10, 1);
        $total = round($kg * $precio, 2);

        $inventario = Inventario::where('product_id', $producto->id)->first();
        $stock = $inventario ? (float) $inventario->quantity_kg : 0;
        $forzada = $stock < $kg;

        $venta = Venta::create([
            'date' => $fecha->toDateString(),
            'customer_id' => $clientes[array_rand($clientes)],
            'product_id' => $producto->id,
            'quantity_kg' => $kg,
            'sale_type' => $tipo,
            'unit_price' => $precio,
            'total' => $total,
            'forced' => $forzada,
        ]);

        if ($inventario && $stock >= $kg) {
            $inventario->decrement('quantity_kg', $kg);
            $this->touchInventario($inventario, $fecha);
        }

        MovimientoInventario::create([
            'product_id' => $producto->id,
            'type' => 'sale',
            'quantity_kg' => -$kg,
            'date' => $fecha->toDateString(),
            'reference_id' => $venta->id,
            'reason' => self::TAG,
        ]);

        return $total;
    }

    private function crearCompra(Carbon $fecha, array $proveedores, Producto $producto, float $kg, string $tipo): void
    {
        $precio = $this->precio($producto, 'wholesale') * 0.72;
        $total = round($kg * $precio, 2);

        $compra = Compra::create([
            'date' => $fecha->toDateString(),
            'supplier_id' => $proveedores[array_rand($proveedores)],
            'purchase_type' => $tipo,
            'product_id' => $producto->id,
            'quantity_kg' => $kg,
            'unit_price' => $precio,
            'total' => $total,
            'notes' => self::TAG,
        ]);

        $inventario = Inventario::firstOrCreate(
            ['product_id' => $producto->id],
            $this->inventarioDefaults()
        );
        $inventario->increment('quantity_kg', $kg);
        $this->touchInventario($inventario, $fecha);

        MovimientoInventario::create([
            'product_id' => $producto->id,
            'type' => 'purchase',
            'quantity_kg' => $kg,
            'date' => $fecha->toDateString(),
            'reference_id' => $compra->id,
            'reason' => self::TAG,
        ]);
    }

    private function precio(Producto $producto, string $tipo): float
    {
        return (float) (Precio::where('product_id', $producto->id)
            ->where('type', $tipo)
            ->orderByDesc('valid_from')
            ->value('value') ?? 3000);
    }
}
