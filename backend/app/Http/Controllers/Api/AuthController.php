<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ], [
            'email.required'    => 'El correo es obligatorio.',
            'email.email'       => 'El correo no es válido.',
            'password.required' => 'La contraseña es obligatoria.',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son correctas.'],
            ]);
        }

        // Si 2FA está activado y confirmado, emitir challenge
        if ($user->hasEnabledTwoFactorAuthentication()) {
            $token = Str::random(40);
            Cache::put('2fa_pending:' . $token, $user->id, now()->addMinutes(10));

            return response()->json([
                'data' => [
                    'requires_2fa'     => true,
                    'two_factor_token' => $token,
                ],
            ]);
        }

        return $this->issueToken($user);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()]);
    }

    private function issueToken(User $user): JsonResponse
    {
        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => [
                    'id'              => $user->id,
                    'name'            => $user->name,
                    'email'           => $user->email,
                    'rol'             => $user->rol,
                    'two_factor_enabled' => $user->hasEnabledTwoFactorAuthentication(),
                ],
                'token' => $token,
            ],
        ]);
    }
}
