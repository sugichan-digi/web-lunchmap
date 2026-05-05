/* ===== Lunchmap Page Script ===== */

$(function () {

  /* URLパラメータから駅名取得 */
  var params = new URLSearchParams(window.location.search);
  var station = params.get('station') || '渋谷';

  $('#station-header-title').text(station + '駅 周辺');
  $('#area-info-name').text(station + '駅');
  $('#area-info-count').text($('.lunch-card').length + '件のランチ');

  /* FABクリック → 投稿ページへ */
  $('#fab-post').on('click', function () {
    window.location.href = '../post/index.html?station=' + encodeURIComponent(station);
  });

  /* ===== Sort Tabs ===== */
  $('#sort-tabs').on('click', '.sort-tab', function () {
    $('#sort-tabs .sort-tab').removeClass('active');
    $(this).addClass('active');

    var sort = $(this).data('sort');
    sortCards(sort);
  });

  function sortCards(sort) {
    var $grid = $('#card-grid');
    var $cards = $grid.find('.lunch-card').toArray();

    $cards.sort(function (a, b) {
      if (sort === 'popular') {
        return parseInt($(b).data('likes')) - parseInt($(a).data('likes'));
      } else if (sort === 'cheap') {
        return parseInt($(a).data('price')) - parseInt($(b).data('price'));
      } else {
        /* 新着順: dateの降順 */
        return parseInt($(b).data('date')) - parseInt($(a).data('date'));
      }
    });

    $grid.empty();
    $.each($cards, function (i, card) {
      $grid.append(card);
    });
  }

  /* ===== いいねトグル ===== */
  $(document).on('click', '.lunch-card-like', function (e) {
    e.stopPropagation();
    var $btn = $(this);
    var isLiked = $btn.hasClass('liked');
    var count = parseInt($btn.data('count'));

    if (isLiked) {
      count--;
      $btn.removeClass('liked').data('count', count).text('🤍 ' + count);
      /* data-likes も更新してソート精度を保つ */
      $btn.closest('.lunch-card').data('likes', count);
    } else {
      count++;
      $btn.addClass('liked').data('count', count).text('❤️ ' + count);
      $btn.closest('.lunch-card').data('likes', count);
    }
  });

  /* ===== カードクリック → 詳細ページ ===== */
  $(document).on('click', '.lunch-card', function () {
    var id = $(this).data('id');
    window.location.href = '../detail/index.html?id=' + id + '&station=' + encodeURIComponent(station);
  });

});
