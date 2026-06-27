<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Precio;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PriceReviewController extends Controller
{
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        return response()->json([
            'data' => [
                'needs_review'            => $this->needsReview($user, $today),
                'last_price_review_date'  => $user->last_price_review_date?->toDateString(),
                'today'                   => $today,
            ],
        ]);
    }

    public function revisionDiaria(): JsonResponse
    {
        $today = now()->toDateString();

        $products = Producto::where('active', true)
            ->orderBy('name')
            ->get()
            ->map(function (Producto $product) use ($today) {
                $retail    = $product->currentPrice('retail');
                $wholesale = $product->currentPrice('wholesale');

                return [
                    'id'       => $product->id,
                    'name'     => $product->name,
                    'category' => $product->category,
                    'unit'     => $product->stockUnit(),
                    'retail'    => $retail ? [
                        'value'      => (float) $retail->value,
                        'valid_from' => $retail->valid_from->toDateString(),
                    ] : null,
                    'wholesale' => $wholesale ? [
                        'value'      => (float) $wholesale->value,
                        'valid_from' => $wholesale->valid_from->toDateString(),
                    ] : null,
                ];
            });

        return response()->json(['data' => $products, 'meta' => ['date' => $today]]);
    }

    public function complete(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prices'                  => 'nullable|array',
            'prices.*.product_id'     => 'required|exists:products,id',
            'prices.*.retail'         => 'nullable|numeric|min:0',
            'prices.*.wholesale'      => 'nullable|numeric|min:0',
        ]);

        $today = now()->toDateString();
        $user  = $request->user();

        DB::transaction(function () use ($data, $today, $user) {
            foreach ($data['prices'] ?? [] as $row) {
                $product = Producto::find($row['product_id']);
                if (! $product) {
                    continue;
                }

                if (isset($row['retail']) && $this->shouldCreatePrice($product, 'retail', (float) $row['retail'])) {
                    Precio::create([
                        'product_id' => $product->id,
                        'type'       => 'retail',
                        'value'      => $row['retail'],
                        'valid_from' => $today,
                    ]);
                }

                if (isset($row['wholesale']) && $this->shouldCreatePrice($product, 'wholesale', (float) $row['wholesale'])) {
                    Precio::create([
                        'product_id' => $product->id,
                        'type'       => 'wholesale',
                        'value'      => $row['wholesale'],
                        'valid_from' => $today,
                    ]);
                }
            }

            $user->update(['last_price_review_date' => $today]);
        });

        return response()->json([
            'data' => $this->userPayload($user->fresh()),
            'message' => 'Precios de hoy guardados correctamente.',
        ]);
    }

    public function skip(Request $request): JsonResponse
    {
        $today = now()->toDateString();
        $user  = $request->user();
        $user->update(['last_price_review_date' => $today]);

        return response()->json([
            'data' => $this->userPayload($user->fresh()),
            'message' => 'Revisión omitida hasta mañana.',
        ]);
    }

    private function needsReview(User $user, string $today): bool
    {
        if ($user->last_price_review_date === null) {
            return true;
        }

        return $user->last_price_review_date->toDateString() < $today;
    }

    private function shouldCreatePrice(Producto $product, string $type, float $newValue): bool
    {
        $current = $product->currentPrice($type);

        if ($current === null) {
            return true;
        }

        return abs((float) $current->value - $newValue) > 0.001;
    }

    private function userPayload(User $user): array
    {
        return [
            'id'                     => $user->id,
            'name'                   => $user->name,
            'email'                  => $user->email,
            'rol'                    => $user->rol,
            'two_factor_enabled'     => $user->hasEnabledTwoFactorAuthentication(),
            'last_price_review_date' => $user->last_price_review_date?->toDateString(),
        ];
    }
}
