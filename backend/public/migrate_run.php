<?php
// SEGURIDAD: borra este archivo inmediatamente después de usarlo
$secret = $_GET['secret'] ?? '';
if ($secret !== 'CAMBIA_ESTA_CLAVE_SECRETA') {
    http_response_code(403);
    die('Acceso denegado');
}

define('LARAVEL_START', microtime(true));
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo '<pre>';
$kernel->call('migrate', ['--force' => true]);
echo $kernel->output();
$kernel->call('config:clear');
echo $kernel->output();
echo '</pre>';
echo '<p style="color:red"><strong>BORRA ESTE ARCHIVO YA: api_laravel/public/migrate_run.php</strong></p>';
