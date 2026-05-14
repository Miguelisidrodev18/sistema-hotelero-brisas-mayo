<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('habitacion_id')->constrained('habitaciones')->cascadeOnDelete();
            $table->foreignId('sede_id')->constrained('sedes')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->date('fecha_entrada');
            $table->date('fecha_salida');
            $table->unsignedTinyInteger('num_huespedes')->default(1);

            $table->unsignedInteger('precio_noche');
            $table->unsignedInteger('precio_total');

            $table->enum('estado', [
                'pendiente', 'confirmada', 'checkin', 'finalizada', 'cancelada', 'expirada',
            ])->default('pendiente');

            $table->string('codigo', 12)->unique();
            $table->text('notas')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservas');
    }
};
