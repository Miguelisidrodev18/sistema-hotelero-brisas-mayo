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
        Schema::table('pagos', function (Blueprint $table) {
            // adelanto=50% inicial del cliente, saldo=resto cobrado por recepción, total=pago completo
            $table->enum('tipo_pago', ['adelanto', 'saldo', 'total'])
                  ->default('total')
                  ->after('monto');
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropColumn('tipo_pago');
        });
    }
};
