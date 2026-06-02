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
        Schema::table('reservas', function (Blueprint $table) {
            $table->enum('origen', ['online', 'presencial', 'llamada'])->default('online')->after('notas');
            $table->decimal('precio_original', 10, 2)->nullable()->after('precio_total');
            $table->decimal('descuento_porcentaje', 5, 2)->nullable()->after('precio_original');
            $table->string('descuento_motivo', 255)->nullable()->after('descuento_porcentaje');
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->dropColumn(['origen', 'precio_original', 'descuento_porcentaje', 'descuento_motivo']);
        });
    }
};
