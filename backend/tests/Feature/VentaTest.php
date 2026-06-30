<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\Inventario;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VentaTest extends TestCase
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

    private function crearProductoConStock(float $stock): Producto
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
            'quantity_kg' => $stock,
        ]);

        return $producto;
    }

    private function crearCliente(): Cliente
    {
        return Cliente::create([
            'name'   => 'Tienda La Esquina',
            'type'   => 'store',
            'active' => true,
        ]);
    }

    public function test_venta_descuenta_inventario_y_registra_movimiento(): void
    {
        $this->autenticar();
        $producto = $this->crearProductoConStock(100);
        $cliente = $this->crearCliente();

        $response = $this->postJson('/api/ventas', [
            'date'        => '2026-06-30',
            'customer_id' => $cliente->id,
            'product_id'  => $producto->id,
            'quantity_kg' => 10,
            'sale_type'   => 'retail',
            'unit_price'  => 2500,
        ]);

        $response->assertCreated();

        $this->assertEquals(90, Inventario::where('product_id', $producto->id)->first()->quantity_kg);
        $this->assertDatabaseHas('inventory_movements', [
            'product_id'  => $producto->id,
            'type'        => 'sale',
            'quantity_kg' => -10,
        ]);
        $this->assertDatabaseHas('sales', [
            'product_id' => $producto->id,
            'total'      => 25000,
        ]);
    }

    public function test_venta_sin_stock_suficiente_advierte_y_no_descuenta(): void
    {
        $this->autenticar();
        $producto = $this->crearProductoConStock(5);
        $cliente = $this->crearCliente();

        $response = $this->postJson('/api/ventas', [
            'date'        => '2026-06-30',
            'customer_id' => $cliente->id,
            'product_id'  => $producto->id,
            'quantity_kg' => 10,
            'sale_type'   => 'retail',
            'unit_price'  => 2500,
        ]);

        $response->assertStatus(422)
            ->assertJson(['stock_warning' => true]);

        $this->assertEquals(5, Inventario::where('product_id', $producto->id)->first()->quantity_kg);
        $this->assertDatabaseCount('sales', 0);
    }

    public function test_venta_forzada_permite_pasar_el_stock(): void
    {
        $this->autenticar();
        $producto = $this->crearProductoConStock(5);
        $cliente = $this->crearCliente();

        $response = $this->postJson('/api/ventas', [
            'date'        => '2026-06-30',
            'customer_id' => $cliente->id,
            'product_id'  => $producto->id,
            'quantity_kg' => 10,
            'sale_type'   => 'retail',
            'unit_price'  => 2500,
            'force'       => true,
        ]);

        $response->assertCreated();
        $this->assertEquals(-5, Inventario::where('product_id', $producto->id)->first()->quantity_kg);
    }
}
