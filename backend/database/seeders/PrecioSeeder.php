<?php

namespace Database\Seeders;

use App\Models\Precio;
use App\Models\Producto;
use Illuminate\Database\Seeder;

class PrecioSeeder extends Seeder
{
    public function run(): void
    {
        $today = now()->toDateString();

        $byCategory = [
            'own'       => ['retail' => 2500,  'wholesale' => 2000],
            'purchased' => ['retail' => 4500,  'wholesale' => 3600],
            'pulp'      => ['retail' => 12000, 'wholesale' => 10000],
        ];

        $exceptions = [
            'Café pelado' => ['retail' => 18000, 'wholesale' => 15000],
            'Café mojado' => ['retail' => 16000, 'wholesale' => 13500],
            'Aguacate'    => ['retail' => 6000,  'wholesale' => 5000],
            'Fresa'       => ['retail' => 8000,  'wholesale' => 6500],
        ];

        foreach (Producto::where('active', true)->get() as $product) {
            $prices = $exceptions[$product->name] ?? $byCategory[$product->category];

            foreach ($prices as $type => $value) {
                Precio::create([
                    'product_id' => $product->id,
                    'type'       => $type,
                    'value'      => $value,
                    'valid_from' => $today,
                ]);
            }
        }
    }
}
