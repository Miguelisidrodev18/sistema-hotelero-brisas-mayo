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
        Schema::create('cochera_reservas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cochera_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('reserva_id')->nullable()->constrained()->nullOnDelete();
            $table->string('codigo', 12)->unique();
            $table->date('fecha_entrada');
            $table->date('fecha_salida');
            $table->decimal('precio_noche', 8, 2)->default(0);
            $table->decimal('precio_total', 10, 2)->default(0);
            $table->enum('estado', ['pendiente', 'confirmada', 'activa', 'finalizada', 'cancelada'])->default('pendiente');
            $table->string('placa', 20)->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cochera_reservas');
    }
};
