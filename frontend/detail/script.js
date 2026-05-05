/* ===== Detail Page Script ===== */

/* ダミーデータ */
var POSTS = {
  '1': { emoji: '🍜', shop: '麺処 さくら亭', menu: '特製醤油ラーメン（大盛り）', price: 850, category: 'ラーメン', likes: 12, isNew: true, date: '2026年5月1日', comment: 'スープが濃厚で麺とよく絡みます。大盛り無料なのがうれしい！昼時は並ぶことも多いので、12時前に行くのがおすすめです。' },
  '2': { emoji: '🍱', shop: '定食屋 鈴木食堂', menu: '日替わり定食 Bセット', price: 680, category: '定食', likes: 97, isNew: false, date: '2026年4月29日', comment: '毎日来たくなるお店。ご飯おかわり自由で、おかずの種類も豊富です。お母さんの手料理みたいな優しい味。' },
  '3': { emoji: '🥗', shop: 'Café de Soleil', menu: '季節野菜のグリルプレート', price: 1200, category: '洋食', likes: 8, isNew: false, date: '2026年4月28日', comment: 'ヘルシーで彩りがきれい。野菜の甘みが引き出されていて美味しい。コーヒーもついてこの値段は満足。' },
  '4': { emoji: '🍛', shop: 'スパイスカレー Bombay', menu: 'チキンバターカレー', price: 980, category: 'カレー', likes: 5, isNew: true, date: '2026年5月2日', comment: '先週オープンしたばかり！スパイスが本格的でコクがあります。辛さ調節もできて◎' },
  '5': { emoji: '🍣', shop: '鮨 はな田', menu: '上にぎりセット', price: 1500, category: '寿司', likes: 34, isNew: false, date: '2026年4月25日', comment: 'ランチでこの価格でこのクオリティはすごい。ネタが新鮮で厚みがあります。人気のお店なので予約推奨。' },
  '6': { emoji: '🍝', shop: 'トラットリア 陽', menu: 'ランチパスタ（本日の魚介）', price: 1080, category: 'イタリアン', likes: 21, isNew: false, date: '2026年4月27日', comment: 'アルデンテで素材の味を活かした一皿。魚介の出汁がパスタに絡んで絶品。パンもおいしい。' },
  '7': { emoji: '🥩', shop: '焼肉ランチ 牛蔵', menu: 'カルビランチ（ライス大盛り無料）', price: 1100, category: '焼肉', likes: 43, isNew: false, date: '2026年4月24日', comment: 'ランチだとこの値段でカルビが食べられる！スタッフも感じ良く、一人でも入りやすいです。' },
  '8': { emoji: '🍔', shop: 'Burger Lab SHIBUYA', menu: 'アボカドチーズバーガーセット', price: 1380, category: 'バーガー', likes: 17, isNew: false, date: '2026年4月23日', comment: 'バンズがふわふわでパティがジューシー！アボカドと相性抜群。フライドポテトも厚切りで食べ応えあり。' },
  'new': { emoji: '🍜', shop: '（投稿した店舗）', menu: '（投稿したメニュー）', price: 0, category: 'その他', likes: 0, isNew: true, date: '2026年5月5日', comment: '' }
};

$(function () {

  var params = new URLSearchParams(window.location.search);
  var id = params.get('id') || '1';
  var station = params.get('station') || '渋谷';

  var post = POSTS[id] || POSTS['1'];

  /* ===== 詳細データ描画 ===== */
  $('#detail-emoji').text(post.emoji);
  $('#detail-shop').text(post.shop);
  $('#detail-menu').text(post.menu);
  $('#detail-price').text('¥' + post.price.toLocaleString());
  $('#detail-like-count').text(post.likes);
  $('#detail-area').text(station + '駅 周辺');
  $('#detail-date').text(post.date);
  $('#detail-badge-category').text(post.category);
  $('#detail-comment').text(post.comment || 'コメントなし');

  if (!post.isNew) $('#detail-badge-new').hide();

  /* 価格帯バッジ */
  var priceBadge = post.price <= 800 ? 'リーズナブル' : (post.price <= 1200 ? 'お手頃' : 'プレミアム');
  $('#detail-price-badge').text(priceBadge);

  /* 戻るボタン */
  $('#back-btn').on('click', function () {
    if (document.referrer && document.referrer.indexOf('lunchmap') !== -1) {
      window.history.back();
    } else {
      window.location.href = '../lunchmap/index.html?station=' + encodeURIComponent(station);
    }
  });

  /* 投稿CTAのリンク */
  $('#post-cta-btn').attr('href', '../post/index.html?station=' + encodeURIComponent(station));

  /* ===== いいねボタン ===== */
  var liked = false;

  $('#detail-heart-btn').on('click', function () {
    var $btn = $(this);
    var $icon = $btn.find('.btn-heart-icon');
    var $count = $('#detail-like-count');
    var n = parseInt($count.text());

    liked = !liked;
    $btn.toggleClass('liked').addClass('pop');
    $icon.text(liked ? '❤️' : '🤍');
    $count.text(liked ? n + 1 : n - 1);

    setTimeout(function () { $btn.removeClass('pop'); }, 400);
  });

  /* ===== SNSシェア ===== */
  var pageUrl = window.location.href;
  var shareText = '【' + post.shop + '】' + post.menu + ' ¥' + post.price + ' — ランチマップで見つけました！';

  $('#share-x').attr('href',
    'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(pageUrl)
  );

  $('#share-line').attr('href',
    'https://line.me/R/msg/text/?' + encodeURIComponent(shareText + '\n' + pageUrl)
  );

  /* Google Map リンク（ダミー: 店舗に応じてセット） */
  var mapQuery = encodeURIComponent(post.shop + ' ' + station);
  $('#detail-map-link').attr('href', 'https://www.google.com/maps/search/' + mapQuery);

});
