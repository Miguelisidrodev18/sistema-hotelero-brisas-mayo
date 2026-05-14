<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\HabitacionController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\SedeController;
use App\Http\Controllers\ReservaController;
use App\Http\Controllers\PagoController;
use Illuminate\Support\Facades\Route;

// Health check público
Route::get('/ping', fn () => response()->json(['status' => 'ok', 'app' => config('app.name')]));

// Endpoints públicos para el landing
Route::get('/habitaciones/disponibles', [HabitacionController::class, 'disponibles']);
Route::get('/sedes/publicas',           [SedeController::class, 'publicas']);

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

    // Gestión de pagos (staff)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::patch('/pagos/{pago}/verificar', [PagoController::class, 'verificar']);
        Route::patch('/pagos/{pago}/rechazar',  [PagoController::class, 'rechazar']);
    });

    // Habitaciones (escritura solo admin/recepcionista)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::put('/habitaciones/{habitacion}', [HabitacionController::class, 'update']);
    });

    // Solo administrador
    Route::middleware('role:administrador')->group(function () {

        // Usuarios CRUD
        Route::get   ('/usuarios',              [UsuarioController::class, 'index']);
        Route::post  ('/usuarios',              [UsuarioController::class, 'store']);
        Route::get   ('/usuarios/{usuario}',    [UsuarioController::class, 'show']);
        Route::put   ('/usuarios/{usuario}',    [UsuarioController::class, 'update']);
        Route::delete('/usuarios/{usuario}',    [UsuarioController::class, 'destroy']);
        Route::patch ('/usuarios/{usuario}/toggle-activo', [UsuarioController::class, 'toggleActivo']);

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
