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
        User::factory()->create([
            'name' => 'Administrador',
            'email' => 'admin@primavera.com',
            'password' => bcrypt('admin123'),
            'rol' => 'admin',
        ]);

        $this->call([
            ProductoSeeder::class,
        ]);
    }
}
