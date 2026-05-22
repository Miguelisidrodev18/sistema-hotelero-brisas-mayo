<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cocheras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sede_id')->constrained()->cascadeOnDelete();
            $table->string('numero', 20);
            $table->enum('tipo', ['auto', 'moto', 'discapacitado'])->default('auto');
            $table->enum('estado', ['disponible', 'ocupada', 'reservada', 'mantenimiento'])->default('disponible');
            $table->decimal('precio_noche', 8, 2)->default(0);
            $table->string('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->unique(['sede_id', 'numero']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cocheras');
    }
};
