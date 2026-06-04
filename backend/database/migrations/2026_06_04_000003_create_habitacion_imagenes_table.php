<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habitacion_imagenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habitacion_id')->constrained('habitaciones')->cascadeOnDelete();
            $table->string('path', 500);
            $table->unsignedTinyInteger('orden')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->index(['habitacion_id', 'orden']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('habitacion_imagenes');
    }
};
