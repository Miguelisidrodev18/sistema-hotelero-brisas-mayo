<?php

namespace Tests\Feature;

use App\Models\CategoriaPlato;
use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Plato;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PedidoPagadosTest extends TestCase
{
    use RefreshDatabase;

    private function crearPedido(array $attrs = []): Pedido
    {
        $categoria = CategoriaPlato::create(['nombre' => 'Fondos', 'orden' => 1, 'activo' => true]);
        $plato = Plato::create([
            'categoria_id' => $categoria->id,
            'nombre'       => 'Lomo Saltado',
            'precio'       => 25,
            'disponible'   => true,
        ]);

        $pedido = Pedido::create(array_merge([
            'codigo'      => strtoupper(Str::random(8)),
            'estado'      => 'pendiente',
            'metodo_pago' => 'efectivo',
            'pagado'      => false,
            'total'       => 25,
        ], $attrs));

        PedidoItem::create([
            'pedido_id'       => $pedido->id,
            'plato_id'        => $plato->id,
            'cantidad'        => 1,
            'precio_unitario' => 25,
            'subtotal'        => 25,
        ]);

        return $pedido;
    }

    public function test_requiere_autenticacion(): void
    {
        $this->getJson('/api/pedidos/pagados')->assertStatus(401);
    }

    public function test_cliente_no_tiene_acceso(): void
    {
        $cliente = User::factory()->create(['role' => 'cliente']);

        $this->actingAs($cliente, 'sanctum')
            ->getJson('/api/pedidos/pagados')
            ->assertStatus(403);
    }

    public function test_contador_no_tiene_acceso(): void
    {
        // El comprobante de caja es solo para admin/recepción, no para otros roles de staff.
        $contador = User::factory()->create(['role' => 'contador']);

        $this->actingAs($contador, 'sanctum')
            ->getJson('/api/pedidos/pagados')
            ->assertStatus(403);
    }

    public function test_cocinero_puede_crearse_pero_no_ve_comprobantes(): void
    {
        // El rol 'cocinero' existe para el panel de Cocina (GET /pedidos), no para caja.
        $cocinero = User::factory()->create(['role' => 'cocinero']);

        $this->actingAs($cocinero, 'sanctum')
            ->getJson('/api/pedidos')
            ->assertStatus(200);

        $this->actingAs($cocinero, 'sanctum')
            ->getJson('/api/pedidos/pagados')
            ->assertStatus(403);
    }

    public function test_recepcionista_solo_ve_pedidos_pagados(): void
    {
        $recepcionista = User::factory()->create(['role' => 'recepcionista']);

        $pagado   = $this->crearPedido(['pagado' => true, 'metodo_pago' => 'tarjeta']);
        $sinPagar = $this->crearPedido(['pagado' => false]);

        $response = $this->actingAs($recepcionista, 'sanctum')
            ->getJson('/api/pedidos/pagados')
            ->assertStatus(200);

        $ids = collect($response->json())->pluck('id');

        $this->assertTrue($ids->contains($pagado->id));
        $this->assertFalse($ids->contains($sinPagar->id));
    }

    public function test_administrador_ve_comprobante_con_items_y_metodo_de_pago(): void
    {
        $admin  = User::factory()->create(['role' => 'administrador']);
        $pedido = $this->crearPedido(['pagado' => true, 'metodo_pago' => 'tarjeta', 'total' => 25]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/pedidos/pagados')
            ->assertStatus(200);

        $item = collect($response->json())->firstWhere('id', $pedido->id);

        $this->assertNotNull($item);
        $this->assertSame('tarjeta', $item['metodo_pago']);
        $this->assertEquals(25, $item['total']);
        $this->assertNotEmpty($item['items']);
        $this->assertSame('Lomo Saltado', $item['items'][0]['plato']['nombre']);
    }

    public function test_pedidos_pagados_se_devuelven_en_orden_ascendente(): void
    {
        $recepcionista = User::factory()->create(['role' => 'recepcionista']);

        $primero  = $this->crearPedido(['pagado' => true]);
        $segundo  = $this->crearPedido(['pagado' => true]);

        $response = $this->actingAs($recepcionista, 'sanctum')
            ->getJson('/api/pedidos/pagados')
            ->assertStatus(200);

        $ids = collect($response->json())->pluck('id')->values()->toArray();

        $this->assertSame([$primero->id, $segundo->id], $ids);
    }
}
