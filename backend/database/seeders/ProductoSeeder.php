<?php

namespace Database\Seeders;

use App\Models\Inventario;
use App\Models\Producto;
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

        $comprados = [
            'Plátano (vecino)', 'Banano (vecino)', 'Limón (vecino)',
            'Maracuyá (vecino)', 'Aguacate (vecino)',
            'Guayaba dulce', 'Guayaba ácida', 'Mango Tommy',
            'Fresa', 'Tomate de árbol', 'Tomate chonto',
            'Lulo', 'Limón pajarito', 'Papaya',
        ];

        $pulpasCompradas = ['Mora (pulpa)', 'Guanábana (pulpa)', 'Maracuyá (pulpa)'];

        $frutasParaPulpa = ['Guayaba ácida', 'Tomate de árbol', 'Guayaba dulce', 'Lulo'];

        // Crear productos propios
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

        // Crear productos comprados
        foreach ($comprados as $nombre) {
            $esFruta = in_array($nombre, $frutasParaPulpa);
            $p = Producto::create([
                'nombre' => $nombre,
                'categoria' => 'comprado',
                'unidad_medida' => 'kg',
                'activo' => true,
                'es_fruta_para_pulpa' => $esFruta,
            ]);
            Inventario::create(['producto_id' => $p->id, 'cantidad_kg' => 0, 'fecha_actualizacion' => now()]);
        }

        // Crear pulpas compradas
        foreach ($pulpasCompradas as $nombre) {
            $p = Producto::create([
                'nombre' => $nombre,
                'categoria' => 'pulpa',
                'unidad_medida' => 'kg',
                'activo' => true,
            ]);
            Inventario::create(['producto_id' => $p->id, 'cantidad_kg' => 0, 'fecha_actualizacion' => now()]);
        }

        // Crear pulpas propias
        $pulpasPropiasNombres = [
            'Pulpa guayaba ácida', 'Pulpa tomate de árbol',
            'Pulpa guayaba dulce', 'Pulpa lulo',
        ];
        foreach ($pulpasPropiasNombres as $nombre) {
            $p = Producto::create([
                'nombre' => $nombre,
                'categoria' => 'pulpa',
                'unidad_medida' => 'kg',
                'activo' => true,
            ]);
            Inventario::create(['producto_id' => $p->id, 'cantidad_kg' => 0, 'fecha_actualizacion' => now()]);
        }
    }
}
