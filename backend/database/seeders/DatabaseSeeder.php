<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@primavera.com'],
            [
                'name' => 'Administrador',
                'password' => bcrypt('admin123'),
                'rol' => 'admin',
            ]
        );

        $this->call([
            ProductoSeeder::class,
            PrecioSeeder::class,
            ClienteSeeder::class,
        ]);
    }
}
