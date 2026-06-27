<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class IssueSpaToken
{
    public function __invoke(User $user): JsonResponse
    {
        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'rol' => $user->rol,
                    'two_factor_enabled' => $user->hasEnabledTwoFactorAuthentication(),
                    'last_price_review_date' => $user->last_price_review_date?->toDateString(),
                ],
                'token' => $token,
            ],
        ]);
    }
}
