<?php

namespace App\Services;

use App\Models\ContactModel;
use App\Data\ContactInput;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * お問い合わせサービス
 */
class ContactService
{
    /**
     * コンストラクタ
     */
    public function __construct(private readonly ContactModel $contactModel) {}

    /**
     * お問い合わせ作成。作成したレコードを返す。
     */
    public function create(ContactInput $input): object
    {
        try {
            $id = DB::transaction(function () use ($input): int {
                return $this->contactModel->insert(
                    $input->category,
                    $input->body,
                    $input->userId,
                    $input->ipAddress,
                );
            });
        } catch (\Throwable $e) {
            Log::channel('error')->error('お問い合わせ保存失敗', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }

        return $this->contactModel->findById($id);
    }
}
