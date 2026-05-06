<?php

namespace App\Models;

use Illuminate\Support\Facades\DB;

/**
 * お問い合わせモデル
 */
class ContactModel
{
    /**
     * お問い合わせ保存。生成された ID を返す。
     */
    public function insert(string $category, string $body, ?int $userId, string $ipAddress): int
    {
        return DB::table('contact_messages')->insertGetId([
            'category'   => $category,
            'body'       => $body,
            'user_id'    => $userId,
            'ip_address' => $ipAddress,
            'created_at' => now(),
        ]);
    }

    /**
     * ID でお問い合わせ取得
     */
    public function findById(int $id): ?object
    {
        return DB::table('contact_messages')->where('id', $id)->first();
    }
}
