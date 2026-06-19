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
        // Productos propios de la finca (también se pueden comprar a vecinos,
        // pero es el mismo producto — la diferencia está en el proveedor, no en el producto)
        $propios = [
            'Plátano', 'Banano', 'Yuca', 'Limón', 'Mandarina',
            'Naranja', 'Arracacha', 'Fríjol', 'Cidra', 'Aguacate',
            'Café pelado', 'Café mojado',
        ];

        // Productos que SOLO se compran (no se producen en la finca)
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

        foreach ($propios as $nombre) {
            $p = Producto::create([
                'nombre' => $nombre,
                'categoria' => 'propio',
                'unidad_medida' => 'kg',
                'activo' => true,
                'es_fruta_para_pulpa' => in_array($nombre, $frutasParaPulpa),
            ]);
            Inventario::create(['producto_id' => $p->id, 'cantidad_kg' => 0, 'fecha_actualizacion' => now()]);
        }

        foreach ($soloComprados as $nombre) {
            $p = Producto::create([
                'nombre' => $nombre,
                'categoria' => 'comprado',
                'unidad_medida' => 'kg',
                'activo' => true,
                'es_fruta_para_pulpa' => in_array($nombre, $frutasParaPulpa),
            ]);
            Inventario::create(['producto_id' => $p->id, 'cantidad_kg' => 0, 'fecha_actualizacion' => now()]);
        }

        foreach ($pulpasCompradas as $nombre) {
            $p = Producto::create([
                'nombre' => $nombre,
                'categoria' => 'pulpa',
                'unidad_medida' => 'kg',
                'activo' => true,
            ]);
            Inventario::create(['producto_id' => $p->id, 'cantidad_kg' => 0, 'fecha_actualizacion' => now()]);
        }

        foreach ($pulpasPropiasNombres as $nombre) {
            $p = Producto::create([
                'nombre' => $nombre,
                'categoria' => 'pulpa',
                'unidad_medida' => 'kg',
                'activo' => true,
            ]);
            Inventario::create(['producto_id' => $p->id, 'cantidad_kg' => 0, 'fecha_actualizacion' => now()]);
        }

        // Proveedores de ejemplo
        Proveedor::insert([
            ['nombre' => 'Finca propia',  'tipo' => 'otro',    'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Vecino 1',      'tipo' => 'vecino',  'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Galería local', 'tipo' => 'galeria', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
