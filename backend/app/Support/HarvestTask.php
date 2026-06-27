<?php

namespace App\Support;

class HarvestTask
{
    private const CANONICAL = 'Cosecha';

    public static function isHarvest(?string $taskType): bool
    {
        if ($taskType === null || trim($taskType) === '') {
            return false;
        }

        $normalized = mb_strtolower(trim($taskType));

        return $normalized === mb_strtolower(self::CANONICAL)
            || str_starts_with($normalized, mb_strtolower(self::CANONICAL).' ');
    }
}
