# データベース設計案：ランチマップ (駅データ.jp & フロントエンド対応版)

## データベース概要
「今日何食べた？」をサクッと記録し、エリア（駅）ごとに情報を共有・検索できるシステムです。
マスタデータとして [駅データ.jp](https://ekidata.jp/) の構造を採用し、フロントエンドの要求（カテゴリ、マップリンク等）に完全対応した設計です。

---

## テーブル定義

### 1. users (ユーザー)
アカウント登録したユーザー情報を保持します。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | BIGINT | PK, Auto Increment | ユーザーID |
| name | VARCHAR(50) | NOT NULL | 表示名 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | メールアドレス |
| password_hash | VARCHAR(255) | NOT NULL | ハッシュ化されたパスワード |
| profile_image | VARCHAR(255) | | プロフィール画像URL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 登録日時 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新日時 |

---

### 2. lunches (ランチ投稿)
投稿されたランチのメインデータです。駅データおよびカテゴリに紐付きます。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | BIGINT | PK, Auto Increment | 投稿ID |
| user_id | BIGINT | FK (users.id), Nullable | 投稿者ID（匿名時はNULL） |
| station_g_cd | INT | INDEX, NOT NULL | 駅グループコード (同一駅の複数路線を統合) |
| category_id | INT | FK (categories.id), NOT NULL | カテゴリID (ラーメン、定食など) |
| shop_name | VARCHAR(100) | NOT NULL | 店名 |
| menu_name | VARCHAR(100) | NOT NULL | メニュー名 |
| price | INT | NOT NULL | 価格（円） |
| image_url | VARCHAR(255) | NOT NULL | ランチ写真のURL |
| latitude | DECIMAL(10, 8) | NOT NULL | 位置情報（緯度） |
| longitude | DECIMAL(11, 8) | NOT NULL | 位置情報（経度） |
| external_map_url | TEXT | | Google Maps 等の外部地図リンク |
| comment | TEXT | | 感想・メモ（任意） |
| status | TINYINT | DEFAULT 1 | 状態 (1:公開, 0:非公開/削除) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 投稿日時 |

---

### 3. categories (カテゴリ/ジャンル)
フロントエンドで選択可能な料理カテゴリを管理します。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | INT | PK, Auto Increment | カテゴリID |
| name | VARCHAR(50) | NOT NULL | カテゴリ名 (例: ラーメン・つけ麺) |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | スラッグ (例: ramen) |
| icon_emoji | VARCHAR(10) | | アイコン用絵文字 (例: 🍜) |
| sort_order | INT | DEFAULT 0 | 表示順 |

---

### 4. prefectures (都道府県)
駅データ.jp `pref.csv` に準拠。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| pref_cd | INT | PK | 都道府県コード (1-47) |
| pref_name | VARCHAR(20) | NOT NULL | 都道府県名 |

---

### 5. lines (路線)
駅データ.jp `line.csv` に準拠。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| line_cd | INT | PK | 路線コード |
| company_cd | INT | NOT NULL | 鉄道会社コード |
| line_name | VARCHAR(100) | NOT NULL | 路線名称 |
| line_color_c | VARCHAR(10) | | 路線カラーコード |
| pref_cd | INT | FK (prefectures.pref_cd) | 代表的な所属都道府県 |
| e_status | INT | | 状態 (0:運用中, 1:運用前, 2:廃止) |
| e_sort | INT | | 並び順 |

---

### 6. stations (駅)
駅データ.jp `station.csv` に準拠。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| station_cd | INT | PK | 駅コード |
| station_g_cd | INT | INDEX | 駅グループコード |
| station_name | VARCHAR(100) | NOT NULL | 駅名称 |
| line_cd | INT | FK (lines.line_cd) | 路線コード |
| pref_cd | INT | FK (prefectures.pref_cd) | 都道府県コード |
| lon | DECIMAL(11, 8) | NOT NULL | 経度 |
| lat | DECIMAL(10, 8) | NOT NULL | 緯度 |
| e_status | INT | | 状態 |
| e_sort | INT | | 並び順 |

---

### 7. likes (いいね)
投稿に対するリアクション。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | BIGINT | PK, Auto Increment | ID |
| lunch_id | BIGINT | FK (lunches.id), NOT NULL | 投稿ID |
| user_id | BIGINT | FK (users.id), Nullable | ユーザーID（匿名時はNULL） |
| ip_address | VARCHAR(45) | | 匿名投稿時の重複防止用IP |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 実行日時 |

### 8. contact_messages (お問い合わせ)
サービスへのご意見・ご感想等のメッセージを保持します。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | BIGINT | PK, Auto Increment | お問い合わせID |
| category | VARCHAR(20) | NOT NULL | カテゴリ (impression, request, bug, deletion, general) |
| body | TEXT | NOT NULL | 本文（1〜1000文字） |
| user_id | BIGINT | FK (users.id), Nullable | ログインユーザーID（未ログイン時はNULL） |
| ip_address | VARCHAR(45) | NOT NULL | 送信元IPアドレス |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 送信日時 |

---

## 設計のポイント

1.  **フロントエンド完全対応**:
    *   UIにある「カテゴリ選択」を `categories` テーブルでマスタ化。
    *   Google Mapリンク保存用に `external_map_url` を追加。
2.  **`station_g_cd` による名寄せ**:
    *   駅データ.jp の多路線同一駅構造に対応し、路線を問わず同一駅の投稿をまとめて表示可能。
3.  **拡張性**:
    *   `status` カラムにより、将来的な「下書き保存」や「管理者による非表示化」にも対応。
