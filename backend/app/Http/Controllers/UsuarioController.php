<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn($q) =>
                $q->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%")
                  ->orWhere('dni', 'like', "%$search%")
            );
        }

        return response()->json($query->orderBy('name')->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users',
            'dni'      => 'nullable|string|max:20|unique:users',
            'telefono' => 'nullable|string|max:20',
            'role'     => ['required', Rule::in(['cliente','recepcionista','administrador','contador','gerente'])],
            'password' => 'required|string|min:8',
        ]);

        $data['password'] = Hash::make($data['password']);
        $data['activo']   = true;

        return response()->json(User::create($data), 201);
    }

    public function show(User $usuario)
    {
        return response()->json($usuario);
    }

    public function update(Request $request, User $usuario)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => ['required','email', Rule::unique('users')->ignore($usuario->id)],
            'dni'      => ['nullable','string','max:20', Rule::unique('users')->ignore($usuario->id)],
            'telefono' => 'nullable|string|max:20',
            'role'     => ['required', Rule::in(['cliente','recepcionista','administrador','contador','gerente'])],
            'activo'   => 'boolean',
            'password' => 'nullable|string|min:8',
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $usuario->update($data);
        return response()->json($usuario->fresh());
    }

    public function destroy(User $usuario)
    {
        if ($usuario->id === auth()->id()) {
            return response()->json(['message' => 'No puedes eliminarte a ti mismo.'], 403);
        }
        $usuario->delete();
        return response()->json(['message' => 'Usuario eliminado.']);
    }

    public function toggleActivo(User $usuario)
    {
        if ($usuario->id === auth()->id()) {
            return response()->json(['message' => 'No puedes desactivarte a ti mismo.'], 403);
        }
        $usuario->update(['activo' => !$usuario->activo]);
        return response()->json($usuario->fresh());
    }
}
