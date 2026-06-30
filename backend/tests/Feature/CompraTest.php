<?php

namespace Tests\Feature;

use App\Models\Insumo;
use App\Models\Inventario;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompraTest extends TestCase
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

    private function crearProveedor(): Proveedor
    {
        return Proveedor::create([
            'name'   => 'Vecino 1',
            'type'   => 'neighbor',
            'active' => true,
        ]);
    }

    public function test_compra_reventa_aumenta_inventario_de_producto(): void
    {
        $this->autenticar();
        $proveedor = $this->crearProveedor();
        $producto = Producto::create([
            'name'          => 'Maracuyá',
            'category'      => 'purchased',
            'unit'          => 'kg',
            'active'        => true,
            'is_pulp_fruit' => false,
        ]);
        Inventario::create(['product_id' => $producto->id, 'quantity_kg' => 0]);

        $response = $this->postJson('/api/compras', [
            'date'          => '2026-06-30',
            'supplier_id'   => $proveedor->id,
            'purchase_type' => 'resale',
            'product_id'    => $producto->id,
            'quantity_kg'   => 20,
            'unit_price'    => 3000,
        ]);

        $response->assertCreated();
        $this->assertEquals(20, Inventario::where('product_id', $producto->id)->first()->quantity_kg);
        $this->assertDatabaseHas('inventory_movements', [
            'product_id'  => $producto->id,
            'type'        => 'purchase',
            'quantity_kg' => 20,
        ]);
    }

    public function test_compra_insumo_aumenta_stock_de_insumo_y_no_inventario(): void
    {
        $this->autenticar();
        $proveedor = $this->crearProveedor();
        $insumo = Insumo::create([
            'name'          => 'Abono orgánico',
            'type'          => 'fertilizer',
            'unit'          => 'kg',
            'current_stock' => 0,
            'active'        => true,
        ]);

        $response = $this->postJson('/api/compras', [
            'date'          => '2026-06-30',
            'supplier_id'   => $proveedor->id,
            'purchase_type' => 'farm_supply',
            'supply_id'     => $insumo->id,
            'quantity_kg'   => 8,
            'unit_price'    => 1500,
        ]);

        $response->assertCreated();
        $this->assertEquals(8, Insumo::find($insumo->id)->current_stock);
        // No debe generar movimiento de inventario de productos
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    public function test_compra_reventa_exige_producto(): void
    {
        $this->autenticar();
        $proveedor = $this->crearProveedor();

        $response = $this->postJson('/api/compras', [
            'date'          => '2026-06-30',
            'supplier_id'   => $proveedor->id,
            'purchase_type' => 'resale',
            'quantity_kg'   => 5,
            'unit_price'    => 1000,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('product_id');
    }
}
