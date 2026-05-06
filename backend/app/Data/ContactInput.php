<?php

namespace App\Data;

/**
 * お問い合わせ入力値オブジェクト
 */
readonly class ContactInput
{
    /**
     * コンストラクタ
     */
    public function __construct(
        public string $category,
        public string $body,
        public ?int   $userId,
        public string $ipAddress,
    ) {}
}
