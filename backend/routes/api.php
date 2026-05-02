<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\HabitacionController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// Health check público
Route::get('/ping', fn () => response()->json(['status' => 'ok', 'app' => config('app.name')]));

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
    Route::get('/habitaciones',         [HabitacionController::class, 'index']);
    Route::get('/sedes',                [HabitacionController::class, 'sedes']);

    // Habitaciones (escritura solo admin/recepcionista)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::put('/habitaciones/{habitacion}', [HabitacionController::class, 'update']);
    });

    // Configuración (solo admin)
    Route::middleware('role:administrador')->group(function () {
        Route::get('/configuracion',          [ConfiguracionController::class, 'index']);
        Route::put('/configuracion',          [ConfiguracionController::class, 'update']);
        Route::get('/configuracion/ruc/{ruc}',[ConfiguracionController::class, 'buscarRuc']);
    });
});
