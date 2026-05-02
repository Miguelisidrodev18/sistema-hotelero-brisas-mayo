<?php

namespace Database\Seeders;

use App\Models\Configuracion;
use Illuminate\Database\Seeder;

class ConfiguracionSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            ['clave' => 'empresa_nombre',    'valor' => 'Hotel Brisas de Mayo', 'tipo' => 'text',  'descripcion' => 'Nombre de la empresa'],
            ['clave' => 'empresa_ruc',        'valor' => '',                     'tipo' => 'text',  'descripcion' => 'RUC de la empresa'],
            ['clave' => 'empresa_direccion',  'valor' => 'Huancaya, Yauyos',     'tipo' => 'text',  'descripcion' => 'Dirección fiscal'],
            ['clave' => 'empresa_telefono',   'valor' => '+51 999 123 456',      'tipo' => 'text',  'descripcion' => 'Teléfono principal'],
            ['clave' => 'empresa_email',      'valor' => 'contacto@brisasdmayo.com', 'tipo' => 'text', 'descripcion' => 'Correo principal'],
            ['clave' => 'empresa_logo',       'valor' => '/images/Logo-hotel.jpeg', 'tipo' => 'image','descripcion' => 'Logo de la empresa'],
            ['clave' => 'moneda_simbolo',     'valor' => 'S/',                   'tipo' => 'text',  'descripcion' => 'Símbolo de moneda'],
            ['clave' => 'tipo_cambio_dolar',  'valor' => '3.75',                 'tipo' => 'text',  'descripcion' => 'Tipo de cambio referencial'],
            ['clave' => 'check_in_hora',      'valor' => '14:00',                'tipo' => 'text',  'descripcion' => 'Hora de check-in'],
            ['clave' => 'check_out_hora',     'valor' => '12:00',                'tipo' => 'text',  'descripcion' => 'Hora de check-out'],
        ];

        foreach ($configs as $config) {
            Configuracion::firstOrCreate(['clave' => $config['clave']], $config);
        }
    }
}
