<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\Inventario;
use App\Models\Producto;
use App\Models\User;
use App\Models\Venta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CreditoTest extends TestCase
{
    use RefreshDatabase;

    private function autenticar(): void
    {
        Sanctum::actingAs(User::create([
            'name'     => 'Admin',
            'email'    => 'admin@test.com',
            'password' => Hash::make('secret123'),
            'rol'      => 'admin',
        ]));
    }

    private function clienteConFiado(): Cliente
    {
        return Cliente::create([
            'name'          => 'Cliente Fiado',
            'type'          => 'individual',
            'active'        => true,
            'allows_credit' => true,
        ]);
    }

    private function productoConStock(): Producto
    {
        $producto = Producto::create([
            'name'          => 'Plátano',
            'category'      => 'own',
            'unit'          => 'kg',
            'active'        => true,
            'is_pulp_fruit' => false,
        ]);

        Inventario::create([
            'product_id'  => $producto->id,
            'quantity_kg' => 50,
        ]);

        return $producto;
    }

    public function test_venta_a_credito_rechaza_cliente_sin_fiado(): void
    {
        $this->autenticar();
        $producto = $this->productoConStock();
        $cliente = Cliente::create([
            'name'          => 'Sin fiado',
            'type'          => 'individual',
            'active'        => true,
            'allows_credit' => false,
        ]);

        $response = $this->postJson('/api/ventas', [
            'date'        => '2026-06-30',
            'customer_id' => $cliente->id,
            'product_id'  => $producto->id,
            'quantity_kg' => 5,
            'sale_type'   => 'retail',
            'unit_price'  => 2000,
            'is_credit'   => true,
            'amount_paid' => 0,
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Este cliente no tiene habilitado el fiado.']);

        $this->assertDatabaseCount('sales', 0);
    }

    public function test_venta_a_credito_registra_saldo_pendiente(): void
    {
        $this->autenticar();
        $producto = $this->productoConStock();
        $cliente = $this->clienteConFiado();

        $response = $this->postJson('/api/ventas', [
            'date'        => '2026-06-30',
            'customer_id' => $cliente->id,
            'product_id'  => $producto->id,
            'quantity_kg' => 5,
            'sale_type'   => 'retail',
            'unit_price'  => 2000,
            'is_credit'   => true,
            'amount_paid' => 3000,
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('sales', [
            'customer_id' => $cliente->id,
            'is_credit'   => true,
            'total'       => 10000,
            'amount_paid' => 3000,
        ]);
    }

    public function test_abono_rechaza_monto_mayor_al_saldo(): void
    {
        $this->autenticar();
        $producto = $this->productoConStock();
        $cliente = $this->clienteConFiado();

        Venta::create([
            'date'        => '2026-06-30',
            'customer_id' => $cliente->id,
            'product_id'  => $producto->id,
            'quantity_kg' => 5,
            'sale_type'   => 'retail',
            'unit_price'  => 2000,
            'total'       => 10000,
            'is_credit'   => true,
            'amount_paid' => 0,
            'forced'      => false,
        ]);

        $response = $this->postJson('/api/creditos/abonos', [
            'customer_id' => $cliente->id,
            'date'        => '2026-07-01',
            'amount'      => 15000,
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'El abono supera el saldo pendiente del cliente.']);
    }

    public function test_abono_aplica_a_venta_a_credito(): void
    {
        $this->autenticar();
        $producto = $this->productoConStock();
        $cliente = $this->clienteConFiado();

        $venta = Venta::create([
            'date'        => '2026-06-30',
            'customer_id' => $cliente->id,
            'product_id'  => $producto->id,
            'quantity_kg' => 5,
            'sale_type'   => 'retail',
            'unit_price'  => 2000,
            'total'       => 10000,
            'is_credit'   => true,
            'amount_paid' => 0,
            'forced'      => false,
        ]);

        $response = $this->postJson('/api/creditos/abonos', [
            'customer_id' => $cliente->id,
            'sale_id'     => $venta->id,
            'date'        => '2026-07-01',
            'amount'      => 4000,
        ]);

        $response->assertCreated();

        $this->assertEquals(4000, (float) $venta->fresh()->amount_paid);
        $this->assertDatabaseHas('credit_payments', [
            'customer_id' => $cliente->id,
            'amount'      => 4000,
        ]);
    }
}
