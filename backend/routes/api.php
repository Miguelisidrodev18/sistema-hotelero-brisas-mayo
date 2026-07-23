<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\CocheraController;
use App\Http\Controllers\CulqiController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\HabitacionController;
use App\Http\Controllers\HabitacionImagenController;
use App\Http\Controllers\HuespedController;
use App\Http\Controllers\MesaController;
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
use App\Http\Controllers\CodigoDescuentoController;
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

// Recibo de pago y folio de salida — públicos
Route::get('/recibo/{codigo}', [PagoController::class, 'recibo']);
Route::get('/folio/{codigo}',  [PagoController::class, 'folio']);

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
    Route::get   ('/reservas/grupo/{grupoId}',        [ReservaController::class, 'porGrupo']);
    Route::get   ('/reservas/{reserva}',              [ReservaController::class, 'show']);
    Route::put   ('/reservas/{reserva}',              [ReservaController::class, 'update']);
    Route::patch ('/reservas/{reserva}/confirmar',    [ReservaController::class, 'confirmar']);
    Route::patch ('/reservas/{reserva}/checkin',      [ReservaController::class, 'checkin']);
    Route::get   ('/reservas/{reserva}/resumen',      [ReservaController::class, 'resumen']);
    Route::patch ('/reservas/{reserva}/checkout',     [ReservaController::class, 'checkout']);
    Route::patch ('/reservas/{reserva}/cancelar',     [ReservaController::class, 'cancelar']);

    // Pagos
    Route::get   ('/reservas/{reserva}/pago',         [PagoController::class, 'show']);
    Route::post  ('/reservas/{reserva}/pago',         [PagoController::class, 'store']);

    // Saldo pendiente — solo staff (cobro presencial en check-in)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::post('/reservas/{reserva}/pago/saldo', [PagoController::class, 'pagarSaldo']);
    });

    // Pago online con Culqi
    Route::post  ('/culqi/charge',                    [CulqiController::class, 'charge']);

    // Pedidos del restaurante
    Route::post  ('/pedidos',                          [PedidoController::class, 'store']);
    Route::post  ('/pedidos/{pedido}/culqi',           [PedidoCulqiController::class, 'charge']);
    Route::post  ('/pedidos/{pedido}/pagar',           [PedidoController::class, 'pagar']);

    // Cocina (admin + recepcionista + cocinero + mozo) — ver pedidos activos
    Route::middleware('role:administrador,recepcionista,cocinero,mozo')->group(function () {
        Route::get   ('/pedidos',                      [PedidoController::class, 'index']);
        Route::get   ('/pedidos/todos',                [PedidoController::class, 'todos']);
        Route::patch ('/pedidos/{pedido}/entregado',   [PedidoController::class, 'entregado']);
    });

    // Cocina — preparar y marcar listo (tarea exclusiva de cocina)
    Route::middleware('role:administrador,recepcionista,cocinero')->group(function () {
        Route::patch ('/pedidos/{pedido}/preparando',  [PedidoController::class, 'preparando']);
        Route::patch ('/pedidos/{pedido}/listo',       [PedidoController::class, 'listo']);
    });

    // Comprobantes de pedidos pagados — admin/recepción (caja)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::get('/pedidos/pagados', [PedidoController::class, 'pagados']);
    });

    // Mesas del restaurante — mozo gestiona asignación y estado
    Route::middleware('role:administrador,recepcionista,mozo')->group(function () {
        Route::get   ('/mesas',                 [MesaController::class, 'index']);
        Route::patch ('/mesas/{mesa}/ocupar',   [MesaController::class, 'ocupar']);
        Route::patch ('/mesas/{mesa}/liberar',  [MesaController::class, 'liberar']);
    });

    // Mesas — CRUD solo administrador
    Route::middleware('role:administrador')->group(function () {
        Route::post  ('/mesas',          [MesaController::class, 'store']);
        Route::put   ('/mesas/{mesa}',   [MesaController::class, 'update']);
        Route::delete('/mesas/{mesa}',   [MesaController::class, 'destroy']);
    });

    // Huéspedes de reserva
    Route::post  ('/reservas/{reserva}/huespedes',           [HuespedController::class, 'store']);
    Route::delete('/reservas/{reserva}/huespedes/{huesped}', [HuespedController::class, 'destroy']);

    // Servicios adicionales de reserva (staff)
    Route::get   ('/reservas/{reserva}/servicios',    [ServicioController::class, 'deReserva']);
    Route::post  ('/reservas/{reserva}/servicios',    [ServicioController::class, 'agregarAReserva']);
    Route::delete('/reservas/{reserva}/servicios/{rs}', [ServicioController::class, 'quitarDeReserva']);

    // Servicios catálogo (lectura para staff)
    Route::get   ('/servicios',                       [ServicioController::class, 'index']);

    // Validar código de descuento (staff)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::post('/codigos-descuento/validar', [CodigoDescuentoController::class, 'validar']);
    });

    // Recepción — panel del día, caja diaria y búsqueda de clientes
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::get('/recepcion/hoy',   [RecepcionController::class, 'hoy']);
        Route::get('/recepcion/caja',  [RecepcionController::class, 'cajaDiaria']);

        // Consulta DNI / RUC — accesible para recepción
        Route::get('/recepcion/documento/{numero}', [ConfiguracionController::class, 'buscarDocumento']);

        // Buscar clientes para reservas presenciales
        Route::get('/recepcion/clientes', function (\Illuminate\Http\Request $request) {
            $q = $request->input('search', '');
            return response()->json(
                \App\Models\User::where('role', 'cliente')
                    ->where(fn ($query) =>
                        $query->where('name',     'like', "%{$q}%")
                              ->orWhere('email',    'like', "%{$q}%")
                              ->orWhere('dni',      'like', "%{$q}%")
                              ->orWhere('telefono', 'like', "%{$q}%")
                    )
                    ->orderBy('name')
                    ->limit(15)
                    ->get(['id','name','email','dni','telefono'])
            );
        });

        // Registrar cliente rápido (walk-in) — si el email ya existe lo reutiliza
        Route::post('/recepcion/clientes', function (\Illuminate\Http\Request $request) {
            $data = $request->validate([
                'name'     => 'required|string|max:100',
                'email'    => 'nullable|email',
                'telefono' => 'nullable|string|max:20',
                'dni'      => 'nullable|string|max:15',
            ]);

            // Si el email ya existe como cliente, devolver ese usuario (no crear duplicado)
            if (!empty($data['email'])) {
                $existente = \App\Models\User::where('email', $data['email'])->first();
                if ($existente && $existente->role === 'cliente') {
                    return response()->json($existente->only(['id','name','email','dni','telefono']), 200);
                }
                // Si existe pero no es cliente, ignorar el email y generar uno temporal
                if ($existente) {
                    $data['email'] = null;
                }
            }

            // Verificar si ya existe un cliente con el mismo DNI
            if (!empty($data['dni'])) {
                $porDni = \App\Models\User::where('dni', $data['dni'])->where('role','cliente')->first();
                if ($porDni) {
                    return response()->json($porDni->only(['id','name','email','dni','telefono']), 200);
                }
            }

            $emailFinal = $data['email']
                ?? strtolower(str_replace([' ','\''], '.', $data['name'])) . '.' . rand(100,999) . '@walk-in.brisas';

            $cliente = \App\Models\User::create([
                'name'     => $data['name'],
                'email'    => $emailFinal,
                'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(16)),
                'role'     => 'cliente',
                'telefono' => $data['telefono'] ?? null,
                'dni'      => $data['dni'] ?? null,
                'activo'   => true,
            ]);
            return response()->json($cliente->only(['id','name','email','dni','telefono']), 201);
        });
    });

    // Gestión de pagos (staff)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::get  ('/pagos',                  [PagoController::class, 'index']);
        Route::patch('/pagos/{pago}/verificar', [PagoController::class, 'verificar']);
        Route::patch('/pagos/{pago}/rechazar',  [PagoController::class, 'rechazar']);
    });

    // Habitaciones (escritura solo admin/recepcionista)
    Route::middleware('role:administrador,recepcionista')->group(function () {
        Route::put   ('/habitaciones/{habitacion}',                        [HabitacionController::class, 'update']);
        Route::post  ('/habitaciones/{habitacion}/imagenes',               [HabitacionImagenController::class, 'store']);
        Route::delete('/habitaciones/{habitacion}/imagenes/{imagen}',      [HabitacionImagenController::class, 'destroy']);
        Route::patch ('/habitaciones/{habitacion}/imagenes/orden',         [HabitacionImagenController::class, 'reordenar']);
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
        Route::post  ('/platos/upload-imagen',            [PlatoController::class, 'subirImagen']);
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

        // Códigos de descuento CRUD
        Route::get   ('/codigos-descuento',                                 [CodigoDescuentoController::class, 'index']);
        Route::post  ('/codigos-descuento',                                 [CodigoDescuentoController::class, 'store']);
        Route::patch ('/codigos-descuento/{codigoDescuento}/toggle',        [CodigoDescuentoController::class, 'toggleActivo']);
        Route::delete('/codigos-descuento/{codigoDescuento}',               [CodigoDescuentoController::class, 'destroy']);
        Route::get   ('/codigos-descuento/{codigoDescuento}/reservas',      [CodigoDescuentoController::class, 'reservasDeCodigo']);

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
        Route::get   ('/sedes',                [SedeController::class, 'index']);
        Route::post  ('/sedes',                [SedeController::class, 'store']);
        Route::post  ('/sedes/upload-imagen',  [SedeController::class, 'subirImagen']);
        Route::get   ('/sedes/{sede}',         [SedeController::class, 'show']);
        Route::put   ('/sedes/{sede}',         [SedeController::class, 'update']);
        Route::delete('/sedes/{sede}',         [SedeController::class, 'destroy']);

        // Configuración
        Route::get('/configuracion',           [ConfiguracionController::class, 'index']);
        Route::put('/configuracion',           [ConfiguracionController::class, 'update']);
        Route::get('/configuracion/ruc/{ruc}', [ConfiguracionController::class, 'buscarRuc']);
    });
});
