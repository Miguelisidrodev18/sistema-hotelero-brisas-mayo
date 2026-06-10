<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->foreignId('codigo_descuento_id')
                  ->nullable()
                  ->after('descuento_motivo')
                  ->constrained('codigos_descuento')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\CodigoDescuento::class);
            $table->dropColumn('codigo_descuento_id');
        });
    }
};
