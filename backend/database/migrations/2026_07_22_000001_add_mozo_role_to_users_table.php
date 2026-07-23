<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            // SQLite no soporta ALTER de CHECK constraints — se ignora en tests (:memory:),
            // donde el enum ya se crea con el rol 'mozo' incluido.
            return;
        }

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('cliente', 'recepcionista', 'administrador', 'contador', 'gerente', 'cocinero', 'mozo') NOT NULL DEFAULT 'cliente'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("UPDATE users SET role = 'cliente' WHERE role = 'mozo'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('cliente', 'recepcionista', 'administrador', 'contador', 'gerente', 'cocinero') NOT NULL DEFAULT 'cliente'");
    }
};
