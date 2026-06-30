<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_correcto_devuelve_token(): void
    {
        User::create([
            'name'     => 'Administrador',
            'email'    => 'admin@primavera.com',
            'password' => Hash::make('secret123'),
            'rol'      => 'admin',
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'admin@primavera.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['data' => ['user' => ['id', 'email'], 'token']]);
    }

    public function test_login_con_credenciales_incorrectas_falla(): void
    {
        User::create([
            'name'     => 'Administrador',
            'email'    => 'admin@primavera.com',
            'password' => Hash::make('secret123'),
            'rol'      => 'admin',
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'admin@primavera.com',
            'password' => 'incorrecta',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_login_requiere_email_y_password(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_ruta_protegida_rechaza_sin_token(): void
    {
        $this->getJson('/api/productos')->assertStatus(401);
    }

    public function test_ruta_protegida_acepta_token_valido(): void
    {
        Sanctum::actingAs(User::create([
            'name'     => 'Admin',
            'email'    => 'a@a.com',
            'password' => Hash::make('secret123'),
            'rol'      => 'admin',
        ]));

        $this->getJson('/api/productos')->assertOk();
    }
}
