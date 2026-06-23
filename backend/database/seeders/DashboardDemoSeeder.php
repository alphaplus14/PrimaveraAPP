<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Compra;
use App\Models\Inventario;
use App\Models\MovimientoInventario;
use App\Models\Precio;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DashboardDemoSeeder extends Seeder
{
    private const DEMO_TAG = 'DEMO_DASHBOARD';

    public function run(): void
    {
        $clientes = Cliente::where('active', true)->pluck('id')->all();
        $productos = Producto::where('active', true)->get();
        $proveedores = Proveedor::where('active', true)->pluck('id')->all();

        if ($clientes === [] || $productos->isEmpty() || $proveedores === []) {
            $this->command?->warn('Faltan clientes, productos o proveedores. Ejecuta: php artisan db:seed');

            return;
        }

        $this->limpiarDemoAnterior();

        DB::transaction(function () use ($clientes, $productos, $proveedores) {
            $this->configurarStockBajo();
            $this->asegurarStockParaVentas();

            $hoy = Carbon::today();
            $ventasPorSemana = [380000, 450000, 520000, 610000, 580000, 720000, 850000, 920000];

            for ($semana = 7; $semana >= 0; $semana--) {
                $inicioSemana = $hoy->copy()->startOfWeek(Carbon::MONDAY)->subWeeks($semana);
                $metaSemanal = $ventasPorSemana[7 - $semana];
                $acumulado = 0.0;
                $intentos = 0;
                $maxIntentos = 40;

                while ($acumulado < $metaSemanal * 0.85 && $intentos < $maxIntentos) {
                    $intentos++;
                    $fecha = $inicioSemana->copy()->addDays(rand(0, 6));
                    if ($fecha->gt($hoy)) {
                        continue;
                    }

                    $total = $this->crearVenta($fecha, $clientes, $productos);
                    $acumulado += $total;
                }
            }

            // Ventas extra de hoy para el panel "Ventas del día"
            for ($i = 0; $i < 12; $i++) {
                $this->crearVenta($hoy, $clientes, $productos);
            }

            // Compras de hoy
            $productosCompra = $productos->whereIn('name', ['Plátano', 'Banano', 'Limón', 'Aguacate', 'Fresa'])->values();
            foreach ($productosCompra->take(4) as $index => $producto) {
                $kg = [25, 18, 12, 8][$index] ?? 10;
                $precio = $this->precio($producto, 'wholesale') * 0.75;
                $total = round($kg * $precio, 2);

                $compra = Compra::create([
                    'date' => $hoy->toDateString(),
                    'supplier_id' => $proveedores[array_rand($proveedores)],
                    'product_id' => $producto->id,
                    'quantity_kg' => $kg,
                    'unit_price' => $precio,
                    'total' => $total,
                    'notes' => self::DEMO_TAG,
                ]);

                $inventario = Inventario::firstOrCreate(
                    ['product_id' => $producto->id],
                    ['quantity_kg' => 0, 'stock_updated_at' => now()]
                );
                $inventario->increment('quantity_kg', $kg);
                $inventario->update(['stock_updated_at' => now()]);

                MovimientoInventario::create([
                    'product_id' => $producto->id,
                    'type' => 'purchase',
                    'quantity_kg' => $kg,
                    'date' => $hoy->toDateString(),
                    'reference_id' => $compra->id,
                    'reason' => self::DEMO_TAG,
                ]);
            }
        });

        $this->command?->info('Datos demo del dashboard insertados correctamente.');
    }

    private function limpiarDemoAnterior(): void
    {
        $ventaIds = MovimientoInventario::where('reason', self::DEMO_TAG)
            ->where('type', 'sale')
            ->pluck('reference_id');

        Venta::whereIn('id', $ventaIds)->delete();
        MovimientoInventario::where('reason', self::DEMO_TAG)->delete();
        Compra::where('notes', self::DEMO_TAG)->delete();
    }

    private function configurarStockBajo(): void
    {
        $niveles = [
            'Aguacate' => 2.3,
            'Fresa' => 1.2,
            'Maracuyá' => 0,
            'Papaya' => 3.8,
            'Pulpa guayaba ácida' => 0.5,
            'Tomate de árbol' => 0,
            'Mango Tommy' => 4.2,
            'Lulo' => 1.8,
            'Mora (pulpa)' => 0,
            'Guayaba dulce' => 2.1,
        ];

        foreach ($niveles as $nombre => $kg) {
            $producto = Producto::where('name', $nombre)->first();
            if (! $producto) {
                continue;
            }

            Inventario::updateOrCreate(
                ['product_id' => $producto->id],
                ['quantity_kg' => $kg, 'stock_updated_at' => now()->subDays(rand(1, 5))]
            );
        }
    }

    private function asegurarStockParaVentas(): void
    {
        $stockVentas = [
            'Plátano' => 120,
            'Banano' => 90,
            'Limón' => 60,
            'Mandarina' => 35,
            'Naranja' => 28,
            'Yuca' => 40,
        ];

        foreach ($stockVentas as $nombre => $kg) {
            $producto = Producto::where('name', $nombre)->first();
            if (! $producto) {
                continue;
            }

            Inventario::updateOrCreate(
                ['product_id' => $producto->id],
                ['quantity_kg' => $kg, 'stock_updated_at' => now()]
            );
        }
    }

    private function crearVenta(Carbon $fecha, array $clientes, $productos): float
    {
        $producto = $productos->random();
        $tipo = rand(0, 1) ? 'retail' : 'wholesale';
        $precio = $this->precio($producto, $tipo);
        $kg = round(rand(2, 18) + (rand(0, 9) / 10), 1);
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
            $inventario->update(['stock_updated_at' => $fecha]);
        }

        MovimientoInventario::create([
            'product_id' => $producto->id,
            'type' => 'sale',
            'quantity_kg' => -$kg,
            'date' => $fecha->toDateString(),
            'reference_id' => $venta->id,
            'reason' => self::DEMO_TAG,
        ]);

        return $total;
    }

    private function precio(Producto $producto, string $tipo): float
    {
        return (float) (Precio::where('product_id', $producto->id)
            ->where('type', $tipo)
            ->orderByDesc('valid_from')
            ->value('value') ?? 3000);
    }
}
