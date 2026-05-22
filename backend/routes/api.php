<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\CocheraController;
use App\Http\Controllers\CulqiController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\HabitacionController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\PedidoCulqiController;
use App\Http\Controllers\PlatoController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RecepcionController;
use App\Http\Controllers\ReservaController;
use App\Http\Controllers\ServicioController;
use App\Http\Controllers\SedeController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\TarifaTemporadaController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Support\Facades\Route;

// Health check público
Route::get('/ping', fn () => response()->json(['status' => 'ok', 'app' => config('app.name')]));

// Endpoints públicos para el landing
Route::get('/habitaciones/disponibles', [HabitacionController::class, 'disponibles']);
Route::get('/sedes/publicas',           [SedeController::class, 'publicas']);
Route::get('/cocheras/disponibles',     [CocheraController::class, 'disponibles']);

// Menú del restaurante — público
Route::get('/menu', [PlatoController::class, 'menu']);

// Autenticación pública
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Perfil
    Route::put('/profile',          [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);

    // Habitaciones (lectura para todos autenticados)
    Route::get('/habitaciones', [HabitacionController::class, 'index']);

    // Cocheras — acceso para todos los autenticados
    Route::get   ('/cocheras',                              [CocheraController::class, 'index']);
    Route::get   ('/cochera-reservas',                      [CocheraController::class, 'reservasIndex']);
    Route::post  ('/cochera-reservas',                      [CocheraController::class, 'reservasStore']);
    Route::patch ('/cochera-reservas/{cocheraReserva}/activar',  [CocheraController::class, 'activar']);
    Route::patch ('/cochera-reservas/{cocheraReserva}/finalizar',[CocheraController::class, 'finalizar']);
    Route::patch ('/cochera-reservas/{cocheraReserva}/cancelar', [CocheraController::class, 'cancelarReserva']);

    // Reservas — acceso según rol (filtrado interno por controller)
    Route::get   ('/reservas',                        [ReservaController::class, 'index']);
    Route::post  ('/reservas',                        [ReservaController::class, 'store']);
    Route::get   ('/reservas/{reserva}',              [ReservaController::class, 'show']);
    Route::put   ('/reservas/{reserva}',              [ReservaController::class, 'update']);
    Route::patch ('/reservas/{reserva}/confirmar',    [ReservaController::class, 'confirmar']);
    Route::patch ('/reservas/{reserva}/checkin',      [ReservaController::class, 'checkin']);
    Route::patch ('/reservas/{reserva}/checkout',     [ReservaController::class, 'checkout']);
    Route::patch ('/reservas/{reserva}/cancelar',     [ReservaController::class, 'cancelar']);

    // Pagos
    Route::get   ('/reservas/{reserva}/pago',         [PagoController::class, 'show']);
    Route::post  ('/reservas/{reserva}/pago',         [PagoController::class, 'store']);

    // Pago online con Culqi
    Route::post  ('/culqi/charge',                    [CulqiController::class, 'charge']);

    // Pedidos del restaurante
    Route::post  ('/pedidos',                          [PedidoController::class, 'store']);
    Route::post  ('/pedidos/{pedido}/culqi',           [PedidoCulqiController::class, 'charge']);
    Route::post  ('/pedidos/{pedido}/pagar',           [PedidoController::class, 'pagar']);

    // Cocina (admin + recepcionista + cocinero)
    Route::middleware('role:administrador,recepcionista,cocinero')->group(function () {
        Route::get   ('/pedidos',                      [PedidoController::class, 'index']);
        Route::get   ('/pedidos/todos',                [PedidoController::class, 'todos']);
        Route::patch ('/pedidos/{pedido}/preparando',  [PedidoController::class, 'preparando']);
        Route::patch ('/pedidos/{pedido}/listo',       [PedidoController::class, 'listo']);
        Route::patch ('/pedidos/{pedido}/entregado',   [PedidoController::class, 'entregado']);
    });

    // Servicios adicionales de reserva (staff)
    Route::get   ('/reservas/{reserva}/servicios',    [ServicioController::class, 'deReserva']);
    Route::post  ('/reservas/{reserva}/servicios',    [ServicioController::class, 'agregarAReserva']);
    Route::delete('/reservas/{reserva}/servicios/{rs}', [ServicioController::class, 'quitarDeReserva']);

    // Servicios catálogo (lectura para staff)
    Route::get   ('/servicios',                       [ServicioController::class, 'index']);

    // Recepción — panel del día y caja diaria
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::get('/recepcion/hoy',   [RecepcionController::class, 'hoy']);
        Route::get('/recepcion/caja',  [RecepcionController::class, 'cajaDiaria']);
    });

    // Gestión de pagos (staff)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::get  ('/pagos',                  [PagoController::class, 'index']);
        Route::patch('/pagos/{pago}/verificar', [PagoController::class, 'verificar']);
        Route::patch('/pagos/{pago}/rechazar',  [PagoController::class, 'rechazar']);
    });

    // Habitaciones (escritura solo admin/recepcionista)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::put('/habitaciones/{habitacion}', [HabitacionController::class, 'update']);
    });

    // Dashboard gerencial
    Route::middleware('role:administrador,gerente,contador')->group(function () {
        Route::get('/stats/dashboard', [StatsController::class, 'dashboard']);
    });

    // Mantenimiento — solo administrador
    Route::middleware('role:administrador')->group(function () {
        Route::post('/admin/expirar-reservas', function () {
            \Illuminate\Support\Facades\Artisan::call('reservas:expirar');
            $output = trim(\Illuminate\Support\Facades\Artisan::output());
            return response()->json(['message' => $output ?: 'Proceso completado.']);
        });
    });

    // Exportaciones PDF (admin + recepcionista + gerente + contador)
    Route::middleware('role:administrador,recepcionista,gerente,contador')->group(function () {
        Route::get('/export/reservas', [ExportController::class, 'reservasPdf']);
        Route::get('/export/pagos',    [ExportController::class, 'pagosPdf']);
    });

    // Solo administrador
    Route::middleware('role:administrador')->group(function () {

        // Platos y categorías CRUD
        Route::get   ('/platos',                          [PlatoController::class, 'index']);
        Route::post  ('/platos',                          [PlatoController::class, 'store']);
        Route::put   ('/platos/{plato}',                  [PlatoController::class, 'update']);
        Route::delete('/platos/{plato}',                  [PlatoController::class, 'destroy']);

        Route::get   ('/categorias-plato',                [PlatoController::class, 'categorias']);
        Route::post  ('/categorias-plato',                [PlatoController::class, 'storeCat']);
        Route::put   ('/categorias-plato/{cat}',          [PlatoController::class, 'updateCat']);
        Route::delete('/categorias-plato/{cat}',          [PlatoController::class, 'destroyCat']);

        // Servicios CRUD
        Route::post  ('/servicios',             [ServicioController::class, 'store']);
        Route::put   ('/servicios/{servicio}',  [ServicioController::class, 'update']);
        Route::delete('/servicios/{servicio}',  [ServicioController::class, 'destroy']);

        // Tarifas por temporada CRUD
        Route::get   ('/tarifas-temporada',                          [TarifaTemporadaController::class, 'index']);
        Route::post  ('/tarifas-temporada',                          [TarifaTemporadaController::class, 'store']);
        Route::put   ('/tarifas-temporada/{tarifaTemporada}',        [TarifaTemporadaController::class, 'update']);
        Route::delete('/tarifas-temporada/{tarifaTemporada}',        [TarifaTemporadaController::class, 'destroy']);

        // Usuarios CRUD
        Route::get   ('/usuarios',              [UsuarioController::class, 'index']);
        Route::post  ('/usuarios',              [UsuarioController::class, 'store']);
        Route::get   ('/usuarios/{usuario}',    [UsuarioController::class, 'show']);
        Route::put   ('/usuarios/{usuario}',    [UsuarioController::class, 'update']);
        Route::delete('/usuarios/{usuario}',    [UsuarioController::class, 'destroy']);
        Route::patch ('/usuarios/{usuario}/toggle-activo', [UsuarioController::class, 'toggleActivo']);

        // Cocheras CRUD (admin)
        Route::post  ('/cocheras',             [CocheraController::class, 'store']);
        Route::put   ('/cocheras/{cochera}',   [CocheraController::class, 'update']);
        Route::delete('/cocheras/{cochera}',   [CocheraController::class, 'destroy']);

        // Sedes CRUD
        Route::get   ('/sedes',          [SedeController::class, 'index']);
        Route::post  ('/sedes',          [SedeController::class, 'store']);
        Route::get   ('/sedes/{sede}',   [SedeController::class, 'show']);
        Route::put   ('/sedes/{sede}',   [SedeController::class, 'update']);
        Route::delete('/sedes/{sede}',   [SedeController::class, 'destroy']);

        // Configuración
        Route::get('/configuracion',           [ConfiguracionController::class, 'index']);
        Route::put('/configuracion',           [ConfiguracionController::class, 'update']);
        Route::get('/configuracion/ruc/{ruc}', [ConfiguracionController::class, 'buscarRuc']);
    });
});
