<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:100'],
            'email'    => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'dni'      => ['sometimes', 'nullable', 'string', 'max:20', 'unique:users,dni,' . $user->id],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'password_actual' => ['required', 'string'],
            'password'        => ['required', 'confirmed', Password::min(8)],
        ]);

        if (!Hash::check($request->password_actual, $request->user()->password)) {
            return response()->json(['message' => 'La contraseña actual es incorrecta.'], 422);
        }

        $request->user()->update(['password' => $request->password]);

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }
}
