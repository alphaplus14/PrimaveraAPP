<?php

namespace App\Support;

use App\Models\Producto;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * Vínculos fruta → pulpa propia. Fuente única para seeder y backfill en migraciones.
 */
class ProductPulpLinker
{
    /**
     * @return array<string, string> nombre fruta => nombre pulpa
     */
    public static function pairs(): array
    {
        return [
            'Guayaba ácida'   => 'Pulpa guayaba ácida',
            'Tomate de árbol' => 'Pulpa tomate de árbol',
            'Guayaba dulce'   => 'Pulpa guayaba dulce',
            'Lulo'            => 'Pulpa lulo',
        ];
    }

    /**
     * @return list<string>
     */
    public static function fruitNames(): array
    {
        return array_keys(self::pairs());
    }

    /**
     * @return list<string>
     */
    public static function pulpNames(): array
    {
        return array_values(self::pairs());
    }

    /**
     * Asigna related_pulp_id en frutas que tienen pulpa propia.
     *
     * @param  bool  $strict  Si true, lanza excepción cuando falta fruta o pulpa.
     */
    public static function link(bool $strict = false): void
    {
        if (! Schema::hasColumn('products', 'related_pulp_id')) {
            if ($strict) {
                throw new RuntimeException('La columna products.related_pulp_id no existe.');
            }

            Log::warning('ProductPulpLinker: columna related_pulp_id ausente; se omite el vínculo.');

            return;
        }

        foreach (self::pairs() as $fruitName => $pulpName) {
            $fruit = Producto::query()->where('name', $fruitName)->first();
            $pulp = Producto::query()
                ->where('name', $pulpName)
                ->where('category', 'pulp')
                ->first();

            if (! $fruit || ! $pulp) {
                $message = "Vínculo fruta-pulpa no aplicado: «{$fruitName}» → «{$pulpName}»";

                if ($strict) {
                    throw new RuntimeException($message);
                }

                Log::warning($message, [
                    'fruit_found' => (bool) $fruit,
                    'pulp_found'  => (bool) $pulp,
                ]);

                continue;
            }

            $updates = ['related_pulp_id' => $pulp->id];

            if (Schema::hasColumn('products', 'is_pulp_fruit')) {
                $updates['is_pulp_fruit'] = true;
            }

            $fruit->update($updates);
        }
    }

    public static function unlink(): void
    {
        Producto::query()
            ->whereIn('name', self::fruitNames())
            ->update(['related_pulp_id' => null]);
    }
}
