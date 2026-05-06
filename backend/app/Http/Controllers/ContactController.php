<?php

namespace App\Http\Controllers;

use App\Services\ContactService;
use App\Data\ContactInput;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * お問い合わせコントローラー
 */
class ContactController extends Controller
{
    /**
     * コンストラクタ
     */
    public function __construct(private readonly ContactService $contactService) {}

    /**
     * お問い合わせ送信
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'nullable|in:impression,request,bug,deletion,general',
            'body'     => 'required|string|min:1|max:1000',
        ], [
            'body.required' => 'お問い合わせ内容を入力してください',
            'body.max'      => 'お問い合わせ内容は1000文字以内で入力してください',
        ]);

        $userId = $this->resolveUserId($request->bearerToken());
        
        $contact = $this->contactService->create(new ContactInput(
            category:  $validated['category'] ?? 'general',
            body:      $validated['body'],
            userId:    $userId,
            ipAddress: $request->ip(),
        ));

        Log::channel('access')->info('お問い合わせ送信', [
            'id'       => $contact->id,
            'category' => $contact->category,
            'user_id'  => $contact->user_id,
        ]);

        return response()->json(['data' => $contact], 201);
    }

    /**
     * ベアラートークンからユーザーID解決。無効または未ログイン時は null を返す。
     */
    private function resolveUserId(?string $token): ?int
    {
        if (!$token) {
            return null;
        }

        $session = DB::table('sessions')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        return $session ? (int) $session->user_id : null;
    }
}
