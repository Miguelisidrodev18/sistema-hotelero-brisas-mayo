<?php

namespace Database\Seeders;

use App\Models\Habitacion;
use App\Models\Sede;
use Illuminate\Database\Seeder;

class HabitacionSeeder extends Seeder
{
    public function run(): void
    {
        $sede1 = Sede::where('slug', 'brisas-i')->first();
        $sede2 = Sede::where('slug', 'brisas-ii')->first();

        if (!$sede1 || !$sede2) return;

        // ── Sede I: Hospedaje (datos del flyer) ──────────────────────
        $sede1Hab = [
            ['numero'=>'01','tipo'=>'matrimonial',       'capacidad'=>2,'precio'=>100,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'02','tipo'=>'matrimonial',       'capacidad'=>2,'precio'=>100,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'04','tipo'=>'matrimonial',       'capacidad'=>2,'precio'=>100,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'05','tipo'=>'matrimonial',       'capacidad'=>2,'precio'=>100,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'07','tipo'=>'matrimonial',       'capacidad'=>2,'precio'=>100,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'08','tipo'=>'doble',             'capacidad'=>2,'precio'=>120,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'09','tipo'=>'matrimonial',       'capacidad'=>2,'precio'=>100,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'10','tipo'=>'doble',             'capacidad'=>2,'precio'=>120,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'11','tipo'=>'triple',            'capacidad'=>3,'precio'=>150,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'12','tipo'=>'doble',             'capacidad'=>2,'precio'=>120,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'13','tipo'=>'matrimonial_queen', 'capacidad'=>2,'precio'=>150,'piso'=>1,'tiene_vista'=>true],
            ['numero'=>'14','tipo'=>'doble',             'capacidad'=>2,'precio'=>120,'piso'=>1,'tiene_vista'=>false],
        ];

        foreach ($sede1Hab as $h) {
            Habitacion::firstOrCreate(
                ['sede_id' => $sede1->id, 'numero' => $h['numero']],
                array_merge($h, ['sede_id' => $sede1->id, 'estado' => 'disponible'])
            );
        }

        // ── Sede II: Hotel (datos del flyer, 4 pisos) ────────────────
        $sede2Hab = [
            // Piso 1
            ['numero'=>'100','tipo'=>'matrimonial_adicional','capacidad'=>3,'precio'=>170,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'101','tipo'=>'matrimonial',          'capacidad'=>2,'precio'=>140,'piso'=>1,'tiene_vista'=>false],
            ['numero'=>'102','tipo'=>'matrimonial_adicional','capacidad'=>3,'precio'=>200,'piso'=>1,'tiene_vista'=>true],
            // Piso 2
            ['numero'=>'200','tipo'=>'matrimonial_king',     'capacidad'=>2,'precio'=>300,'piso'=>2,'tiene_vista'=>true],
            ['numero'=>'201','tipo'=>'matrimonial',          'capacidad'=>2,'precio'=>180,'piso'=>2,'tiene_vista'=>false],
            ['numero'=>'202','tipo'=>'matrimonial_adicional','capacidad'=>3,'precio'=>180,'piso'=>2,'tiene_vista'=>false],
            ['numero'=>'203','tipo'=>'doble',                'capacidad'=>2,'precio'=>160,'piso'=>2,'tiene_vista'=>false],
            ['numero'=>'204','tipo'=>'doble',                'capacidad'=>2,'precio'=>160,'piso'=>2,'tiene_vista'=>false],
            ['numero'=>'205','tipo'=>'matrimonial_adicional','capacidad'=>3,'precio'=>180,'piso'=>2,'tiene_vista'=>false],
            ['numero'=>'206','tipo'=>'matrimonial',          'capacidad'=>2,'precio'=>160,'piso'=>2,'tiene_vista'=>false],
            ['numero'=>'207','tipo'=>'matrimonial_queen',    'capacidad'=>3,'precio'=>250,'piso'=>2,'tiene_vista'=>true],
            // Piso 3
            ['numero'=>'300','tipo'=>'matrimonial_queen',    'capacidad'=>2,'precio'=>280,'piso'=>3,'tiene_vista'=>true],
            ['numero'=>'301','tipo'=>'matrimonial',          'capacidad'=>2,'precio'=>220,'piso'=>3,'tiene_vista'=>true],
            ['numero'=>'302','tipo'=>'matrimonial_queen',    'capacidad'=>2,'precio'=>250,'piso'=>3,'tiene_vista'=>true],
            ['numero'=>'303','tipo'=>'matrimonial_adicional','capacidad'=>3,'precio'=>300,'piso'=>3,'tiene_vista'=>true],
            ['numero'=>'304','tipo'=>'matrimonial_adicional','capacidad'=>3,'precio'=>300,'piso'=>3,'tiene_vista'=>true],
            ['numero'=>'305','tipo'=>'doble',                'capacidad'=>2,'precio'=>160,'piso'=>3,'tiene_vista'=>false],
            ['numero'=>'306','tipo'=>'matrimonial',          'capacidad'=>2,'precio'=>160,'piso'=>3,'tiene_vista'=>false],
            ['numero'=>'307','tipo'=>'matrimonial_king',     'capacidad'=>2,'precio'=>300,'piso'=>3,'tiene_vista'=>true],
            // Piso 4
            ['numero'=>'400','tipo'=>'matrimonial_king',     'capacidad'=>2,'precio'=>300,'piso'=>4,'tiene_vista'=>true],
            ['numero'=>'401','tipo'=>'matrimonial_queen',    'capacidad'=>2,'precio'=>270,'piso'=>4,'tiene_vista'=>true],
            ['numero'=>'402','tipo'=>'matrimonial_queen',    'capacidad'=>2,'precio'=>270,'piso'=>4,'tiene_vista'=>true],
            ['numero'=>'403','tipo'=>'matrimonial_king',     'capacidad'=>2,'precio'=>300,'piso'=>4,'tiene_vista'=>true],
            ['numero'=>'404','tipo'=>'matrimonial',          'capacidad'=>2,'precio'=>250,'piso'=>4,'tiene_vista'=>true],
            ['numero'=>'405','tipo'=>'matrimonial',          'capacidad'=>2,'precio'=>160,'piso'=>4,'tiene_vista'=>false],
            ['numero'=>'406','tipo'=>'matrimonial_queen',    'capacidad'=>2,'precio'=>270,'piso'=>4,'tiene_vista'=>true],
            ['numero'=>'407','tipo'=>'matrimonial_king',     'capacidad'=>2,'precio'=>300,'piso'=>4,'tiene_vista'=>true],
        ];

        foreach ($sede2Hab as $h) {
            Habitacion::firstOrCreate(
                ['sede_id' => $sede2->id, 'numero' => $h['numero']],
                array_merge($h, ['sede_id' => $sede2->id, 'estado' => 'disponible'])
            );
        }
    }
}
