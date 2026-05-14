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
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reserva_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->comment('Cliente que paga');
            $table->foreignId('registrado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('monto', 10, 2);
            $table->enum('metodo_pago', ['efectivo', 'transferencia', 'yape', 'plin', 'tarjeta'])->default('efectivo');
            $table->enum('estado', ['pendiente', 'verificado', 'rechazado', 'devuelto'])->default('pendiente');
            $table->string('referencia', 100)->nullable();
            $table->string('comprobante_url')->nullable();
            $table->text('notas')->nullable();
            $table->timestamp('fecha_pago')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
