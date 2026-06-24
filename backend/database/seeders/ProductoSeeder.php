<?php

namespace Database\Seeders;

use App\Models\Inventario;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Support\ProductPulpLinker;
use Illuminate\Database\Seeder;

class ProductoSeeder extends Seeder
{
    public function run(): void
    {
        // Products grown on the farm
        $own = [
            'Plátano', 'Banano', 'Yuca', 'Limón', 'Mandarina',
            'Naranja', 'Arracacha', 'Fríjol', 'Cidra', 'Aguacate',
            'Café pelado', 'Café mojado',
        ];

        // Products that are only purchased (not produced on the farm)
        $purchased = [
            'Maracuyá',
            'Guayaba dulce', 'Guayaba ácida', 'Mango Tommy',
            'Fresa', 'Tomate de árbol', 'Tomate chonto',
            'Lulo', 'Limón pajarito', 'Papaya',
        ];

        $purchasedPulps = ['Mora (pulpa)', 'Guanábana (pulpa)', 'Maracuyá (pulpa)'];

        $pulpFruits = ProductPulpLinker::fruitNames();
        $ownPulpNames = ProductPulpLinker::pulpNames();

        foreach ($own as $name) {
            $p = Producto::create([
                'name'          => $name,
                'category'      => 'own',
                'unit'          => 'kg',
                'active'        => true,
                'is_pulp_fruit' => in_array($name, $pulpFruits),
            ]);
            Inventario::create(['product_id' => $p->id, 'quantity_kg' => 0, 'stock_updated_at' => now()]);
        }

        foreach ($purchased as $name) {
            $p = Producto::create([
                'name'          => $name,
                'category'      => 'purchased',
                'unit'          => 'kg',
                'active'        => true,
                'is_pulp_fruit' => in_array($name, $pulpFruits),
            ]);
            Inventario::create(['product_id' => $p->id, 'quantity_kg' => 0, 'stock_updated_at' => now()]);
        }

        foreach ($purchasedPulps as $name) {
            $p = Producto::create([
                'name'     => $name,
                'category' => 'pulp',
                'unit'     => 'paquete',
                'active'   => true,
            ]);
            Inventario::create(['product_id' => $p->id, 'quantity_kg' => 0, 'stock_updated_at' => now()]);
        }

        foreach ($ownPulpNames as $name) {
            $p = Producto::create([
                'name'     => $name,
                'category' => 'pulp',
                'unit'     => 'paquete',
                'active'   => true,
            ]);
            Inventario::create(['product_id' => $p->id, 'quantity_kg' => 0, 'stock_updated_at' => now()]);
        }

        ProductPulpLinker::link(strict: true);

        // Sample suppliers
        Proveedor::insert([
            ['name' => 'Finca propia',  'type' => 'other',    'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Vecino 1',      'type' => 'neighbor', 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Galería local', 'type' => 'market',   'active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
