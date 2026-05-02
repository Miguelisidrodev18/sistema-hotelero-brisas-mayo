<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name'     => 'Administrador',
                'email'    => 'admin@brisas.com',
                'password' => 'password123',
                'role'     => 'administrador',
            ],
            [
                'name'     => 'Recepcionista',
                'email'    => 'recepcion@brisas.com',
                'password' => 'password123',
                'role'     => 'recepcionista',
            ],
            [
                'name'     => 'Cliente Demo',
                'email'    => 'cliente@brisas.com',
                'password' => 'password123',
                'role'     => 'cliente',
            ],
        ];

        foreach ($users as $data) {
            User::firstOrCreate(['email' => $data['email']], $data);
        }
    }
}
