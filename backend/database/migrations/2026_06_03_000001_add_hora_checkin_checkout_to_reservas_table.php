<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->time('hora_checkin')->default('14:00')->after('fecha_salida');
            $table->time('hora_checkout')->default('12:00')->after('hora_checkin');
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->dropColumn(['hora_checkin', 'hora_checkout']);
        });
    }
};
