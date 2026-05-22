<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Expirar reservas pendientes vencidas — corre cada día a las 00:05
Schedule::command('reservas:expirar')->dailyAt('00:05');
