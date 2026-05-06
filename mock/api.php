<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define('DATA_DIR',          __DIR__ . '/data');
define('USERS_FILE',        DATA_DIR . '/users.json');
define('SESSIONS_FILE',     DATA_DIR . '/sessions.json');
define('LUNCHES_FILE',      DATA_DIR . '/lunches.json');
define('LIKES_FILE',        DATA_DIR . '/likes.json');
define('CATEGORIES_FILE',   DATA_DIR . '/categories.json');
define('PREFECTURES_FILE',  DATA_DIR . '/prefectures.json');
define('LINES_FILE',        DATA_DIR . '/lines.json');
define('STATIONS_FILE',     DATA_DIR . '/stations.json');
define('CONTACTS_FILE',     DATA_DIR . '/contacts.json');

// ===== JSON Helpers =====

function jsonOk(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function jsonError(string $message, int $status = 400): never
{
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function requestBody(): array
{
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function readJson(string $file): array
{
    if (!file_exists($file)) return [];
    return json_decode(file_get_contents($file), true) ?? [];
}

function writeJson(string $file, array $data): void
{
    file_put_contents($file, json_encode(array_values($data), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function nextId(array $items): int
{
    return empty($items) ? 1 : max(array_column($items, 'id')) + 1;
}

// ===== Auth Helpers =====

function getBearerToken(): ?string
{
    $auth = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? '') : '');

    if (preg_match('/^Bearer\s+(\S+)$/i', $auth, $m)) {
        return $m[1];
    }
    return null;
}

function requireAuth(): int
{
    $token = getBearerToken();
    if (!$token) jsonError('認証が必要です', 401);

    $sessions = readJson(SESSIONS_FILE);
    foreach ($sessions as $s) {
        if ($s['token'] === $token && strtotime($s['expires_at']) > time()) {
            return (int)$s['user_id'];
        }
    }
    jsonError('セッションが無効または期限切れです', 401);
}

function optionalAuth(): ?int
{
    $token = getBearerToken();
    if (!$token) return null;

    $sessions = readJson(SESSIONS_FILE);
    foreach ($sessions as $s) {
        if ($s['token'] === $token && strtotime($s['expires_at']) > time()) {
            return (int)$s['user_id'];
        }
    }
    return null;
}

function createSession(int $userId): string
{
    $token    = bin2hex(random_bytes(32));
    $sessions = readJson(SESSIONS_FILE);
    $sessions = array_filter($sessions, fn($s) => strtotime($s['expires_at']) > time());
    $sessions[] = [
        'token'      => $token,
        'user_id'    => $userId,
        'expires_at' => date('c', strtotime('+30 days')),
        'created_at' => date('c'),
    ];
    writeJson(SESSIONS_FILE, $sessions);
    return $token;
}

// ===== Routing =====

$pathInfo = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$parts    = array_values(array_filter(explode('/', trim($pathInfo, '/'))));
$seg0     = $parts[0] ?? '';
$seg1     = $parts[1] ?? '';
$seg2     = $parts[2] ?? '';
$id       = isset($parts[1]) && is_numeric($parts[1]) ? (int)$parts[1] : null;
$method   = $_SERVER['REQUEST_METHOD'];

match ($seg0) {
    'health'      => jsonOk(['status' => 'ok', 'timestamp' => date('c')]),
    'auth'        => handleAuth($seg1, $method),
    'categories'  => handleCategories($method),
    'prefectures' => handlePrefectures($method),
    'lines'       => handleLines($method),
    'stations'    => handleStations($method),
    'lunches'     => handleLunches($method, $id, $seg2),
    'mypage'      => handleMypage($seg1, $method),
    'users'       => handleUsers($method, $id),
    'contacts'    => handleContacts($method),
    default       => jsonError('Not Found', 404),
};

// ===== /auth =====

function handleAuth(string $action, string $method): never
{
    match ($action) {
        'register' => ($method === 'POST' ? authRegister() : jsonError('Method Not Allowed', 405)),
        'login'    => ($method === 'POST' ? authLogin()    : jsonError('Method Not Allowed', 405)),
        'logout'   => ($method === 'POST' ? authLogout()   : jsonError('Method Not Allowed', 405)),
        default    => jsonError('Not Found', 404),
    };
}

function authRegister(): never
{
    $body     = requestBody();
    $name     = trim($body['name'] ?? '');
    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$name)                                         jsonError('表示名を入力してください');
    if (!$email)                                        jsonError('メールアドレスを入力してください');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))     jsonError('メールアドレスの形式が正しくありません');
    if (mb_strlen($password) < 8)                       jsonError('パスワードは8文字以上で入力してください');

    $users = readJson(USERS_FILE);
    foreach ($users as $u) {
        if (strtolower($u['email'] ?? '') === strtolower($email)) {
            jsonError('このメールアドレスはすでに登録されています', 409);
        }
    }

    $id      = nextId($users);
    $now     = date('c');
    $users[] = [
        'id'            => $id,
        'name'          => $name,
        'email'         => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'profile_image' => null,
        'created_at'    => $now,
        'updated_at'    => $now,
    ];
    writeJson(USERS_FILE, $users);

    $token = createSession($id);
    jsonOk([
        'token' => $token,
        'user'  => ['id' => $id, 'name' => $name, 'email' => $email],
    ], 201);
}

function authLogin(): never
{
    $body     = requestBody();
    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$email)    jsonError('メールアドレスを入力してください');
    if (!$password) jsonError('パスワードを入力してください');

    $users = readJson(USERS_FILE);
    $found = null;
    foreach ($users as $u) {
        if (strtolower($u['email'] ?? '') === strtolower($email)) {
            $found = $u;
            break;
        }
    }

    if (!$found || !password_verify($password, $found['password_hash'])) {
        jsonError('メールアドレスまたはパスワードが正しくありません', 401);
    }

    $token = createSession($found['id']);
    jsonOk([
        'token' => $token,
        'user'  => ['id' => $found['id'], 'name' => $found['name'], 'email' => $found['email']],
    ]);
}

function authLogout(): never
{
    $token    = getBearerToken();
    $sessions = readJson(SESSIONS_FILE);
    $sessions = array_filter($sessions, fn($s) => $s['token'] !== $token);
    writeJson(SESSIONS_FILE, $sessions);
    jsonOk(['success' => true]);
}

// ===== /categories =====

function handleCategories(string $method): never
{
    if ($method !== 'GET') jsonError('Method Not Allowed', 405);
    $categories = readJson(CATEGORIES_FILE);
    usort($categories, fn($a, $b) => $a['sort_order'] - $b['sort_order']);
    jsonOk(['data' => $categories]);
}

// ===== /prefectures =====

function handlePrefectures(string $method): never
{
    if ($method !== 'GET') jsonError('Method Not Allowed', 405);
    $prefs = readJson(PREFECTURES_FILE);
    usort($prefs, fn($a, $b) => $a['pref_cd'] - $b['pref_cd']);
    jsonOk(['data' => $prefs]);
}

// ===== /lines =====

function handleLines(string $method): never
{
    if ($method !== 'GET') jsonError('Method Not Allowed', 405);

    $lines = readJson(LINES_FILE);
    $lines = array_filter($lines, fn($l) => $l['e_status'] === 0);

    $prefCd = isset($_GET['pref_cd']) ? (int)$_GET['pref_cd'] : null;
    if ($prefCd !== null) {
        $lines = array_filter($lines, fn($l) => $l['pref_cd'] === $prefCd);
    }

    usort($lines, fn($a, $b) => $a['e_sort'] - $b['e_sort']);
    jsonOk(['data' => array_values($lines)]);
}

// ===== /stations =====

function handleStations(string $method): never
{
    if ($method !== 'GET') jsonError('Method Not Allowed', 405);

    $stations = readJson(STATIONS_FILE);
    $stations = array_filter($stations, fn($s) => $s['e_status'] === 0);

    $lineCd = isset($_GET['line_cd']) ? (int)$_GET['line_cd'] : null;
    if ($lineCd !== null) {
        $stations = array_filter($stations, fn($s) => $s['line_cd'] === $lineCd);
    }

    // 同一 station_g_cd のユニークな駅だけ返す（最初のエントリを代表として使用）
    $seen   = [];
    $result = [];
    foreach ($stations as $s) {
        if (!isset($seen[$s['station_g_cd']])) {
            $seen[$s['station_g_cd']] = true;
            $result[] = $s;
        }
    }

    usort($result, fn($a, $b) => $a['e_sort'] - $b['e_sort']);
    jsonOk(['data' => array_values($result)]);
}

// ===== /lunches =====

function handleLunches(string $method, ?int $id, string $seg2): never
{
    // /lunches/:id/likes
    if ($id !== null && $seg2 === 'likes') {
        handleLikes($method, $id);
    }

    // /lunches/:id
    if ($id !== null) {
        match ($method) {
            'GET'    => lunchesShow($id),
            'DELETE' => lunchesDelete($id),
            default  => jsonError('Method Not Allowed', 405),
        };
    }

    // /lunches
    match ($method) {
        'GET'  => lunchesIndex(),
        'POST' => lunchesCreate(),
        default => jsonError('Method Not Allowed', 405),
    };
}

function attachLikesCounts(array $lunches): array
{
    $likes      = readJson(LIKES_FILE);
    $countMap   = [];
    foreach ($likes as $l) {
        $countMap[$l['lunch_id']] = ($countMap[$l['lunch_id']] ?? 0) + 1;
    }
    foreach ($lunches as &$lunch) {
        $lunch['likes_count'] = $countMap[$lunch['id']] ?? 0;
    }
    unset($lunch);
    return $lunches;
}

function lunchesIndex(): never
{
    $lunches = readJson(LUNCHES_FILE);

    // 公開中のみ
    $lunches = array_filter($lunches, fn($l) => $l['status'] === 1);

    // フィルター: station_g_cd
    if (isset($_GET['station_g_cd'])) {
        $gcd     = (int)$_GET['station_g_cd'];
        $lunches = array_filter($lunches, fn($l) => $l['station_g_cd'] === $gcd);
    }

    // フィルター: category_id
    if (isset($_GET['category_id'])) {
        $catId   = (int)$_GET['category_id'];
        $lunches = array_filter($lunches, fn($l) => $l['category_id'] === $catId);
    }

    $lunches = array_values($lunches);
    $lunches = attachLikesCounts($lunches);

    // カテゴリ名を付加
    $categories = readJson(CATEGORIES_FILE);
    $catMap     = array_column($categories, null, 'id');
    foreach ($lunches as &$l) {
        $l['category_name']  = $catMap[$l['category_id']]['name'] ?? '';
        $l['category_emoji'] = $catMap[$l['category_id']]['icon_emoji'] ?? '';
    }
    unset($l);

    // ソート
    $sort = $_GET['sort'] ?? 'new';
    usort($lunches, function ($a, $b) use ($sort) {
        if ($sort === 'popular') return $b['likes_count'] - $a['likes_count'];
        if ($sort === 'cheap')   return $a['price'] - $b['price'];
        return strcmp($b['created_at'], $a['created_at']); // new (default)
    });

    // ページネーション
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 10;
    $total   = count($lunches);
    $lunches = array_slice($lunches, ($page - 1) * $perPage, $perPage);

    jsonOk([
        'data'        => $lunches,
        'total'       => $total,
        'page'        => $page,
        'per_page'    => $perPage,
        'total_pages' => (int)ceil($total / $perPage),
    ]);
}

function lunchesShow(int $id): never
{
    $lunches = readJson(LUNCHES_FILE);
    $found   = null;
    foreach ($lunches as $l) {
        if ($l['id'] === $id && $l['status'] === 1) { $found = $l; break; }
    }
    if (!$found) jsonError('投稿が見つかりません', 404);

    [$found] = attachLikesCounts([$found]);

    // カテゴリ情報付加
    $categories = readJson(CATEGORIES_FILE);
    $catMap     = array_column($categories, null, 'id');
    $found['category_name']  = $catMap[$found['category_id']]['name'] ?? '';
    $found['category_emoji'] = $catMap[$found['category_id']]['icon_emoji'] ?? '';

    // 投稿者名付加
    if ($found['user_id'] !== null) {
        $users   = readJson(USERS_FILE);
        $userMap = array_column($users, null, 'id');
        $user    = $userMap[$found['user_id']] ?? null;
        $found['user_name'] = $user ? $user['name'] : '退会済みユーザー';
    } else {
        $found['user_name'] = '匿名ユーザー';
    }

    // ログインユーザーがいいね済みか
    $userId = optionalAuth();
    if ($userId !== null) {
        $likes = readJson(LIKES_FILE);
        $liked = false;
        foreach ($likes as $lk) {
            if ($lk['lunch_id'] === $id && $lk['user_id'] === $userId) { $liked = true; break; }
        }
        $found['is_liked'] = $liked;
    } else {
        $found['is_liked'] = false;
    }

    jsonOk(['data' => $found]);
}

function lunchesCreate(): never
{
    $userId = optionalAuth();
    $body   = requestBody();

    $shopName  = trim($body['shop_name'] ?? '');
    $menuName  = trim($body['menu_name'] ?? '');
    $price     = isset($body['price']) ? (int)$body['price'] : 0;
    $catId     = isset($body['category_id']) ? (int)$body['category_id'] : 0;
    $stName    = trim($body['station_name'] ?? '');
    $imageUrl  = trim($body['image_url'] ?? '');
    $latitude  = isset($body['latitude'])  ? (float)$body['latitude']  : null;
    $longitude = isset($body['longitude']) ? (float)$body['longitude'] : null;
    $comment   = trim($body['comment'] ?? '');
    $mapUrl    = trim($body['external_map_url'] ?? '');

    if (!$shopName)            jsonError('店名を入力してください');
    if (!$menuName)            jsonError('メニュー名を入力してください');
    if ($price < 1)            jsonError('価格を入力してください');
    if ($catId < 1)            jsonError('カテゴリを選択してください');
    if (!$stName)              jsonError('駅名を入力してください');
    if (!$imageUrl)            jsonError('写真URLを入力してください');
    if ($latitude === null)    jsonError('位置情報（緯度）を入力してください');
    if ($longitude === null)   jsonError('位置情報（経度）を入力してください');

    // station_name → station_g_cd を解決
    $stations = readJson(STATIONS_FILE);
    $stGcd    = null;
    foreach ($stations as $s) {
        if ($s['station_name'] === $stName) { $stGcd = $s['station_g_cd']; break; }
    }
    if ($stGcd === null) jsonError('駅が見つかりません', 404);

    // カテゴリ存在確認
    $cats   = readJson(CATEGORIES_FILE);
    $catIds = array_column($cats, 'id');
    if (!in_array($catId, $catIds, true)) jsonError('カテゴリが見つかりません', 404);

    $lunches   = readJson(LUNCHES_FILE);
    $newLunch  = [
        'id'               => nextId($lunches),
        'user_id'          => $userId,
        'station_g_cd'     => $stGcd,
        'category_id'      => $catId,
        'shop_name'        => $shopName,
        'menu_name'        => $menuName,
        'price'            => $price,
        'image_url'        => $imageUrl,
        'latitude'         => $latitude,
        'longitude'        => $longitude,
        'external_map_url' => $mapUrl ?: null,
        'comment'          => $comment ?: null,
        'status'           => 1,
        'created_at'       => date('c'),
    ];
    $lunches[] = $newLunch;
    writeJson(LUNCHES_FILE, $lunches);

    jsonOk(['data' => $newLunch], 201);
}

function lunchesDelete(int $id): never
{
    $userId  = requireAuth();
    $lunches = readJson(LUNCHES_FILE);
    $found   = null;
    foreach ($lunches as $l) {
        if ($l['id'] === $id) { $found = $l; break; }
    }
    if (!$found || $found['status'] === 0) jsonError('投稿が見つかりません', 404);
    if ($found['user_id'] !== $userId)      jsonError('この投稿を削除する権限がありません', 403);

    foreach ($lunches as &$l) {
        if ($l['id'] === $id) { $l['status'] = 0; break; }
    }
    unset($l);
    writeJson(LUNCHES_FILE, $lunches);

    jsonOk(['success' => true, 'id' => $id]);
}

// ===== /lunches/:id/likes =====

function handleLikes(string $method, int $lunchId): never
{
    if ($method !== 'POST') jsonError('Method Not Allowed', 405);

    // 投稿の存在確認
    $lunches = readJson(LUNCHES_FILE);
    $lunch   = null;
    foreach ($lunches as $l) {
        if ($l['id'] === $lunchId && $l['status'] === 1) { $lunch = $l; break; }
    }
    if (!$lunch) jsonError('投稿が見つかりません', 404);

    $userId = optionalAuth();
    $ip     = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $likes  = readJson(LIKES_FILE);

    // 重複チェック（ログイン済み: user_id / 匿名: ip_address）
    foreach ($likes as $lk) {
        if ($lk['lunch_id'] !== $lunchId) continue;
        if ($userId !== null && $lk['user_id'] === $userId) {
            jsonError('すでにいいね済みです', 409);
        }
        if ($userId === null && $lk['user_id'] === null && $lk['ip_address'] === $ip) {
            jsonError('すでにいいね済みです', 409);
        }
    }

    $likes[] = [
        'id'         => nextId($likes),
        'lunch_id'   => $lunchId,
        'user_id'    => $userId,
        'ip_address' => $userId === null ? $ip : null,
        'created_at' => date('c'),
    ];
    writeJson(LIKES_FILE, $likes);

    $count = count(array_filter($likes, fn($lk) => $lk['lunch_id'] === $lunchId));
    jsonOk(['success' => true, 'likes_count' => $count], 201);
}

// ===== /mypage =====

function handleMypage(string $action, string $method): never
{
    $userId = requireAuth();

    match ($action) {
        'lunches' => ($method === 'GET' ? mypageLunches($userId) : jsonError('Method Not Allowed', 405)),
        default   => jsonError('Not Found', 404),
    };
}

function mypageLunches(int $userId): never
{
    $lunches = readJson(LUNCHES_FILE);
    $lunches = array_filter($lunches, fn($l) => $l['user_id'] === $userId && $l['status'] === 1);
    $lunches = array_values($lunches);
    $lunches = attachLikesCounts($lunches);

    $categories = readJson(CATEGORIES_FILE);
    $catMap     = array_column($categories, null, 'id');
    foreach ($lunches as &$l) {
        $l['category_name']  = $catMap[$l['category_id']]['name'] ?? '';
        $l['category_emoji'] = $catMap[$l['category_id']]['icon_emoji'] ?? '';
    }
    unset($l);

    usort($lunches, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

    jsonOk(['data' => $lunches, 'total' => count($lunches)]);
}

// ===== /contacts =====

function handleContacts(string $method): never
{
    if ($method !== 'POST') jsonError('Method Not Allowed', 405);
    contactsCreate();
}

function contactsCreate(): never
{
    $body     = requestBody();
    $category = trim($body['category'] ?? '');
    $text     = trim($body['body'] ?? '');

    $validCategories = ['impression', 'request', 'bug', 'deletion'];

    if (!$category || !in_array($category, $validCategories, true)) {
        jsonError('カテゴリを選択してください');
    }
    if (!$text) {
        jsonError('お問い合わせ内容を入力してください');
    }
    if (mb_strlen($text) > 1000) {
        jsonError('お問い合わせ内容は1000文字以内で入力してください');
    }

    $userId   = optionalAuth();
    $ip       = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $contacts = readJson(CONTACTS_FILE);

    $newContact = [
        'id'         => nextId($contacts),
        'category'   => $category,
        'body'       => $text,
        'user_id'    => $userId,
        'ip_address' => $ip,
        'created_at' => date('c'),
    ];
    $contacts[] = $newContact;
    writeJson(CONTACTS_FILE, $contacts);

    jsonOk(['data' => $newContact], 201);
}

// ===== /users/:id =====

function handleUsers(string $method, ?int $id): never
{
    if ($method !== 'GET') jsonError('Method Not Allowed', 405);
    if ($id === null) jsonError('ユーザーIDを指定してください', 400);

    $users = readJson(USERS_FILE);
    $found = null;
    foreach ($users as $u) {
        if ($u['id'] === $id) { $found = $u; break; }
    }
    if (!$found) jsonError('ユーザーが見つかりません', 404);

    // 投稿数を付加
    $lunches     = readJson(LUNCHES_FILE);
    $lunchCount  = count(array_filter($lunches, fn($l) => $l['user_id'] === $id && $l['status'] === 1));

    jsonOk([
        'data' => [
            'id'            => $found['id'],
            'name'          => $found['name'],
            'profile_image' => $found['profile_image'],
            'created_at'    => $found['created_at'],
            'lunch_count'   => $lunchCount,
        ],
    ]);
}
