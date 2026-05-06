-- SQL dump generated using DBML (dbml.dbdiagram.io)
-- Database: MySQL
-- Generated at: 2026-05-06T02:18:24.558Z

CREATE TABLE `users` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT COMMENT 'ユーザーID',
  `name` varchar(50) NOT NULL COMMENT '表示名',
  `email` varchar(255) UNIQUE NOT NULL COMMENT 'メールアドレス',
  `password_hash` varchar(255) NOT NULL COMMENT 'ハッシュ化されたパスワード',
  `profile_image` varchar(255) COMMENT 'プロフィール画像URL',
  `created_at` timestamp DEFAULT (now()) COMMENT '登録日時',
  `updated_at` timestamp DEFAULT (now()) COMMENT '更新日時'
);

CREATE TABLE `lunches` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT COMMENT '投稿ID',
  `user_id` bigint COMMENT '投稿者ID（匿名時はNULL）',
  `station_g_cd` int NOT NULL COMMENT '駅グループコード',
  `category_id` int NOT NULL COMMENT 'カテゴリID',
  `shop_name` varchar(100) NOT NULL COMMENT '店名',
  `menu_name` varchar(100) NOT NULL COMMENT 'メニュー名',
  `price` int NOT NULL COMMENT '価格（円）',
  `image_url` varchar(255) NOT NULL COMMENT 'ランチ写真のURL',
  `latitude` decimal(10,8) NOT NULL COMMENT '位置情報（緯度）',
  `longitude` decimal(11,8) NOT NULL COMMENT '位置情報（経度）',
  `external_map_url` text COMMENT 'Google Maps 等の外部地図リンク',
  `comment` text COMMENT '感想・メモ（任意）',
  `status` tinyint DEFAULT 1 COMMENT '状態 (1:公開, 0:非公開/削除)',
  `created_at` timestamp DEFAULT (now()) COMMENT '投稿日時'
);

CREATE TABLE `categories` (
  `id` int PRIMARY KEY AUTO_INCREMENT COMMENT 'カテゴリID',
  `name` varchar(50) NOT NULL COMMENT 'カテゴリ名',
  `slug` varchar(50) UNIQUE NOT NULL COMMENT 'スラッグ',
  `icon_emoji` varchar(10) COMMENT 'アイコン用絵文字',
  `sort_order` int DEFAULT 0 COMMENT '表示順'
);

CREATE TABLE `prefectures` (
  `pref_cd` int PRIMARY KEY COMMENT '都道府県コード (1-47)',
  `pref_name` varchar(20) NOT NULL COMMENT '都道府県名'
);

CREATE TABLE `lines` (
  `line_cd` int PRIMARY KEY COMMENT '路線コード',
  `company_cd` int NOT NULL COMMENT '鉄道会社コード',
  `line_name` varchar(100) NOT NULL COMMENT '路線名称',
  `line_color_c` varchar(10) COMMENT '路線カラーコード',
  `pref_cd` int COMMENT '代表的な所属都道府県',
  `e_status` int COMMENT '状態 (0:運用中, 1:運用前, 2:廃止)',
  `e_sort` int COMMENT '並び順'
);

CREATE TABLE `stations` (
  `station_cd` int PRIMARY KEY COMMENT '駅コード',
  `station_g_cd` int NOT NULL COMMENT '駅グループコード',
  `station_name` varchar(100) NOT NULL COMMENT '駅名称',
  `line_cd` int COMMENT '路線コード',
  `pref_cd` int COMMENT '都道府県コード',
  `lon` decimal(11,8) NOT NULL COMMENT '経度',
  `lat` decimal(10,8) NOT NULL COMMENT '緯度',
  `e_status` int COMMENT '状態',
  `e_sort` int COMMENT '並び順'
);

CREATE TABLE `likes` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
  `lunch_id` bigint COMMENT '投稿ID',
  `user_id` bigint COMMENT 'ユーザーID（匿名時はNULL）',
  `ip_address` varchar(45) COMMENT '匿名投稿時の重複防止用IP',
  `created_at` timestamp DEFAULT (now()) COMMENT '実行日時'
);

CREATE TABLE `contact_messages` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT COMMENT 'お問い合わせID',
  `category` varchar(20) NOT NULL COMMENT 'カテゴリ (impression | request | bug | deletion)',
  `body` text NOT NULL COMMENT '本文（1〜1000文字）',
  `user_id` bigint COMMENT 'ログインユーザーID（未ログイン時はNULL）',
  `ip_address` varchar(45) NOT NULL COMMENT '送信元IPアドレス',
  `created_at` timestamp DEFAULT (now()) COMMENT '送信日時'
);

CREATE INDEX `idx_lunch_station_g` ON `lunches` (`station_g_cd`);

CREATE INDEX `idx_station_g_cd` ON `stations` (`station_g_cd`);

ALTER TABLE `lunches` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `lunches` ADD FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

ALTER TABLE `lines` ADD FOREIGN KEY (`pref_cd`) REFERENCES `prefectures` (`pref_cd`);

ALTER TABLE `stations` ADD FOREIGN KEY (`line_cd`) REFERENCES `lines` (`line_cd`);

ALTER TABLE `stations` ADD FOREIGN KEY (`pref_cd`) REFERENCES `prefectures` (`pref_cd`);

ALTER TABLE `likes` ADD FOREIGN KEY (`lunch_id`) REFERENCES `lunches` (`id`);

ALTER TABLE `likes` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `contact_messages` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `lunches` ADD FOREIGN KEY (`station_g_cd`) REFERENCES `stations` (`station_g_cd`);
