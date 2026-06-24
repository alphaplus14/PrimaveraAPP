<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Laravel\Fortify\Actions\ConfirmTwoFactorAuthentication;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;

class TwoFactorController extends Controller
{
    /** Verificar código OTP durante el login (challenge) */
    public function challenge(Request $request): JsonResponse
    {
        $request->validate([
            'two_factor_token' => 'required|string',
            'code'             => 'required|string',
        ]);

        $cacheKey = '2fa_pending:' . $request->two_factor_token;
        $userId   = Cache::get($cacheKey);

        if (! $userId) {
            return response()->json(['message' => 'El código expiró o no es válido. Inicia sesión de nuevo.'], 422);
        }

        $user = User::findOrFail($userId);

        $code = str_replace(' ', '', $request->code);

        // Intentar con recovery code primero
        if (strlen($code) !== 6) {
            $valid = collect($user->recoveryCodes())->contains($code);
            if ($valid) {
                // Regenerar recovery codes después de usar uno
                app(GenerateNewRecoveryCodes::class)($user);
                Cache::forget($cacheKey);
                return $this->issueToken($user);
            }
            return response()->json(['message' => 'Código de recuperación no válido.'], 422);
        }

        if (! $user->hasValidTwoFactorCode($code)) {
            return response()->json(['message' => 'El código es incorrecto o ya expiró.'], 422);
        }

        Cache::forget($cacheKey);
        return $this->issueToken($user);
    }

    /** Activar 2FA — devuelve QR code SVG y clave manual */
    public function enable(Request $request): JsonResponse
    {
        $user = $request->user();

        app(EnableTwoFactorAuthentication::class)($user);

        return response()->json([
            'data' => [
                'qr_code'    => $user->twoFactorQrCodeSvg(),
                'secret_key' => decrypt($user->two_factor_secret),
            ],
        ]);
    }

    /** Confirmar 2FA con código del autenticador */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        try {
            app(ConfirmTwoFactorAuthentication::class)($user, $request->code);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Código incorrecto. Verifica tu app autenticadora.'], 422);
        }

        $recoveryCodes = $user->recoveryCodes();

        return response()->json([
            'data' => [
                'message'        => '2FA activado correctamente.',
                'recovery_codes' => $recoveryCodes,
            ],
        ]);
    }

    /** Desactivar 2FA */
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|current_password',
        ]);

        app(DisableTwoFactorAuthentication::class)($request->user());

        return response()->json(['data' => ['message' => '2FA desactivado.']]);
    }

    /** Ver recovery codes */
    public function recoveryCodes(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->recoveryCodes(),
        ]);
    }

    /** Regenerar recovery codes */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        app(GenerateNewRecoveryCodes::class)($request->user());

        return response()->json([
            'data' => $request->user()->recoveryCodes(),
        ]);
    }

    /** Estado actual del 2FA del usuario autenticado */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'data' => [
                'enabled'   => $user->hasEnabledTwoFactorAuthentication(),
                'confirmed' => ! is_null($user->two_factor_confirmed_at),
            ],
        ]);
    }

    private function issueToken(User $user): JsonResponse
    {
        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => [
                    'id'                 => $user->id,
                    'name'               => $user->name,
                    'email'              => $user->email,
                    'rol'                => $user->rol,
                    'two_factor_enabled' => $user->hasEnabledTwoFactorAuthentication(),
                ],
                'token' => $token,
            ],
        ]);
    }
}
