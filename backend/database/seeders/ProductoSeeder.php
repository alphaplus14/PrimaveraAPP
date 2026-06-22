<?php

namespace Database\Seeders;

use App\Models\Inventario;
use App\Models\Producto;
use App\Models\Proveedor;
use Illuminate\Database\Seeder;

class ProductoSeeder extends Seeder
{
    public function run(): void
    {
        $propios = [
            'Plátano', 'Banano', 'Yuca', 'Limón', 'Mandarina',
            'Naranja', 'Arracacha', 'Fríjol', 'Cidra', 'Aguacate',
            'Café pelado', 'Café mojado',
        ];

        $soloComprados = [
            'Maracuyá',
            'Guayaba dulce', 'Guayaba ácida', 'Mango Tommy',
            'Fresa', 'Tomate de árbol', 'Tomate chonto',
            'Lulo', 'Limón pajarito', 'Papaya',
        ];

        $pulpasCompradas = ['Mora (pulpa)', 'Guanábana (pulpa)', 'Maracuyá (pulpa)'];

        $frutasParaPulpa = ['Guayaba ácida', 'Tomate de árbol', 'Guayaba dulce', 'Lulo'];

        $pulpasPropiasNombres = [
            'Pulpa guayaba ácida', 'Pulpa tomate de árbol',
            'Pulpa guayaba dulce', 'Pulpa lulo',
        ];

        $stockInicial = [
            'Plátano' => 50,
            'Banano' => 30,
            'Limón' => 25,
        ];

        foreach ($propios as $name) {
            $p = Producto::create([
                'name' => $name,
                'category' => 'own',
                'unit_of_measure' => 'kg',
                'is_active' => true,
                'is_fruit_for_pulp' => in_array($name, $frutasParaPulpa),
            ]);
            Inventario::create([
                'product_id' => $p->id,
                'quantity_kg' => $stockInicial[$name] ?? 0,
                'quantity_updated_at' => now(),
            ]);
        }

        foreach ($soloComprados as $name) {
            $p = Producto::create([
                'name' => $name,
                'category' => 'purchased',
                'unit_of_measure' => 'kg',
                'is_active' => true,
                'is_fruit_for_pulp' => in_array($name, $frutasParaPulpa),
            ]);
            Inventario::create(['product_id' => $p->id, 'quantity_kg' => 0, 'quantity_updated_at' => now()]);
        }

        foreach ($pulpasCompradas as $name) {
            $p = Producto::create([
                'name' => $name,
                'category' => 'pulp',
                'unit_of_measure' => 'kg',
                'is_active' => true,
            ]);
            Inventario::create(['product_id' => $p->id, 'quantity_kg' => 0, 'quantity_updated_at' => now()]);
        }

        foreach ($pulpasPropiasNombres as $name) {
            $p = Producto::create([
                'name' => $name,
                'category' => 'pulp',
                'unit_of_measure' => 'kg',
                'is_active' => true,
            ]);
            Inventario::create(['product_id' => $p->id, 'quantity_kg' => 0, 'quantity_updated_at' => now()]);
        }

        Proveedor::insert([
            ['name' => 'Finca propia',  'type' => 'other',    'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Vecino 1',      'type' => 'neighbor', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Galería local', 'type' => 'market',   'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
