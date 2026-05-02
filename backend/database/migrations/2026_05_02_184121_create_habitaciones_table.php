<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habitaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sede_id')->constrained('sedes')->cascadeOnDelete();
            $table->string('numero', 10);
            $table->enum('tipo', [
                'matrimonial', 'matrimonial_king', 'matrimonial_queen',
                'matrimonial_adicional', 'doble', 'triple',
            ]);
            $table->unsignedTinyInteger('capacidad')->default(2);
            $table->unsignedSmallInteger('precio');
            $table->unsignedTinyInteger('piso')->default(1);
            $table->boolean('tiene_vista')->default(false);
            $table->enum('estado', [
                'disponible', 'ocupada', 'reservada', 'limpieza', 'mantenimiento',
            ])->default('disponible');
            $table->text('descripcion')->nullable();
            $table->timestamps();

            $table->unique(['sede_id', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('habitaciones');
    }
};
