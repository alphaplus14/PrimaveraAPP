<?php

namespace Database\Seeders;

use App\Models\Cliente;
use Illuminate\Database\Seeder;

class ClienteSeeder extends Seeder
{
    public function run(): void
    {
        $clientes = [
            ['name' => 'Cliente particular', 'type' => 'individual', 'phone' => null],
            ['name' => 'Restaurante El Campo', 'type' => 'restaurant', 'phone' => '3001234567'],
            ['name' => 'Tienda Don Pedro', 'type' => 'store', 'phone' => '3109876543'],
            ['name' => 'Galería central', 'type' => 'market', 'phone' => '3205551234'],
        ];

        foreach ($clientes as $cliente) {
            Cliente::firstOrCreate(
                ['name' => $cliente['name']],
                [
                    'type' => $cliente['type'],
                    'phone' => $cliente['phone'],
                    'is_active' => true,
                ]
            );
        }
    }
}
