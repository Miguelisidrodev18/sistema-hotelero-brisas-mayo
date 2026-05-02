<?php

namespace Database\Seeders;

use App\Models\Sede;
use Illuminate\Database\Seeder;

class SedeSeeder extends Seeder
{
    public function run(): void
    {
        $sedes = [
            [
                'nombre'          => 'Hospedaje Brisas de Mayo I',
                'slug'            => 'brisas-i',
                'descripcion'     => 'Vista panorámica a la Laguna de Mayo. Incluye desayuno, baño privado con agua tibia caliente y televisión.',
                'direccion'       => 'Jr. Principal s/n',
                'ciudad'          => 'Huancaya, Yauyos',
                'telefono'        => '+51 999 123 456',
                'email'           => 'sede1@brisasdmayo.com',
                'vista_principal' => 'Laguna de Mayo',
                'activo'          => true,
            ],
            [
                'nombre'          => 'Hotel Brisas de Mayo II',
                'slug'            => 'brisas-ii',
                'descripcion'     => 'Vista panorámica a las Cascadas de Cabracancha. Incluye desayuno, baño privado, TV, 2 botellas de agua, termo y pantuflas.',
                'direccion'       => 'Av. Cascadas 456',
                'ciudad'          => 'Huancaya, Yauyos',
                'telefono'        => '+51 999 654 321',
                'email'           => 'sede2@brisasdmayo.com',
                'vista_principal' => 'Cascadas de Cabracancha',
                'activo'          => true,
            ],
        ];

        foreach ($sedes as $data) {
            Sede::firstOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
