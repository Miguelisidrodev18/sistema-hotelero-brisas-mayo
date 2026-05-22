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
        Schema::create('tarifas_temporada', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->foreignId('sede_id')->nullable()->constrained('sedes')->nullOnDelete();
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->decimal('factor', 4, 2)->default(1.00); // multiplicador: 1.5 = +50%, 0.8 = -20%
            $table->string('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarifas_temporada');
    }
};
