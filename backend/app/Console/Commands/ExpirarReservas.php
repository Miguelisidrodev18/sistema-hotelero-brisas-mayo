<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ExpirarReservas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reservas:expirar';
    protected $description = 'Marca como expiradas las reservas pendientes o confirmadas cuya fecha de entrada ya pasó sin hacer check-in';

    public function handle()
    {
        // pendiente: nunca se confirmó el pago. confirmada: se pagó/confirmó pero el
        // huésped nunca llegó a hacer check-in. Ambas quedan "expirada" por igual —
        // si hubiera hecho check-in, el estado ya sería 'checkin', no 'confirmada'.
        $expiradas = \App\Models\Reserva::whereIn('estado', ['pendiente', 'confirmada'])
            ->where('fecha_entrada', '<', now()->toDateString())
            ->get();

        $count = 0;
        foreach ($expiradas as $reserva) {
            $reserva->update(['estado' => 'expirada']);
            // Liberar habitación si estaba reservada
            if ($reserva->habitacion && $reserva->habitacion->estado === 'reservada') {
                $reserva->habitacion->update(['estado' => 'disponible']);
            }
            $count++;
        }

        // Expirar también reservas de cochera pendientes vencidas
        $cocherasExpiradas = \App\Models\CocheraReserva::where('estado', 'pendiente')
            ->where('fecha_entrada', '<', now()->toDateString())
            ->get();

        foreach ($cocherasExpiradas as $cr) {
            $cr->update(['estado' => 'cancelada']);
            if ($cr->cochera && $cr->cochera->estado === 'reservada') {
                $cr->cochera->update(['estado' => 'disponible']);
            }
        }

        $this->info("Reservas expiradas: {$count}. Cocheras liberadas: {$cocherasExpiradas->count()}.");
        return Command::SUCCESS;
    }
}
