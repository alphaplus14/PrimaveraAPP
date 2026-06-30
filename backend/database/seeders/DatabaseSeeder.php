<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // El admin inicial se puede configurar por entorno para no dejar
        // credenciales fijas en producción.
        User::firstOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@primavera.com')],
            [
                'name' => env('ADMIN_NAME', 'Administrador'),
                'password' => bcrypt(env('ADMIN_PASSWORD', 'admin123')),
                'rol' => 'admin',
            ]
        );

        $seeders = [
            ProductoSeeder::class,
            PrecioSeeder::class,
            ClienteSeeder::class,
        ];

        // Los datos de demostración solo se cargan fuera de producción.
        if (! app()->environment('production')) {
            $seeders[] = DashboardDemoSeeder::class;
        }

        $this->call($seeders);
    }
}
