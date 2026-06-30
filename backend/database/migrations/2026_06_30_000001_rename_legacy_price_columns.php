<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('prices')) {
            return;
        }

        $this->rename('amount', 'value', 'DECIMAL(10,2) NOT NULL');
        $this->rename('effective_from', 'valid_from', 'DATE NOT NULL');
    }

    public function down(): void
    {
        if (! Schema::hasTable('prices')) {
            return;
        }

        $this->rename('value', 'amount', 'DECIMAL(10,2) NOT NULL');
        $this->rename('valid_from', 'effective_from', 'DATE NOT NULL');
    }

    private function rename(string $from, string $to, string $mysqlType): void
    {
        if (! Schema::hasColumn('prices', $from) || Schema::hasColumn('prices', $to)) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `prices` CHANGE `{$from}` `{$to}` {$mysqlType}");
        } else {
            Schema::table('prices', function (Blueprint $table) use ($from, $to) {
                $table->renameColumn($from, $to);
            });
        }
    }
};
