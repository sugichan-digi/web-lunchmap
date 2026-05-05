/* ===== Post Page Script ===== */

$(function () {

  /* URLパラメータから駅名取得 */
  var params = new URLSearchParams(window.location.search);
  var station = params.get('station');

  if (station) {
    $('#station-badge').text('📍 ' + station + '駅');
    $('#modal-back-btn').attr('data-station', station);
  } else {
    $('#station-badge-bar').addClass('station-badge-bar--no-station');
  }

  /* 閉じるボタン */
  $('#close-btn').on('click', function () {
    if (station) {
      window.location.href = '../lunchmap/index.html?station=' + encodeURIComponent(station);
    } else {
      window.history.back();
    }
  });

  /* ===== 写真アップロード ===== */
  $('#upload-area').on('click', function () {
    $('#photo-input').trigger('click');
  });

  $('#photo-input').on('change', function () {
    var file = this.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
      $('#photo-preview').attr('src', e.target.result).show();
      $('#upload-area').hide();
      $('#photo-error').hide();
    };
    reader.readAsDataURL(file);
  });

  /* ドラッグ&ドロップ */
  $('#upload-area').on('dragover', function (e) {
    e.preventDefault();
    $(this).addClass('dragover');
  }).on('dragleave', function () {
    $(this).removeClass('dragover');
  }).on('drop', function (e) {
    e.preventDefault();
    $(this).removeClass('dragover');
    var file = e.originalEvent.dataTransfer.files[0];
    if (file && file.type.match('image.*')) {
      var reader = new FileReader();
      reader.onload = function (ev) {
        $('#photo-preview').attr('src', ev.target.result).show();
        $('#upload-area').hide();
      };
      reader.readAsDataURL(file);
    }
  });

  /* ===== 投稿者切り替え ===== */
  $('.poster-btn').on('click', function () {
    $('.poster-btn').removeClass('active');
    $(this).addClass('active');

    if ($(this).data('type') === 'login') {
      window.location.href = '../auth/index.html?redirect=post';
    }
  });

  /* ===== フォームバリデーション & 送信 ===== */
  $('#post-form').on('submit', function (e) {
    e.preventDefault();
    var valid = true;

    /* 写真チェック */
    if ($('#photo-preview').is(':hidden')) {
      $('#photo-error').show();
      valid = false;
    } else {
      $('#photo-error').hide();
    }

    /* 店名 */
    if (!$('#shop-name').val().trim()) {
      $('#shop-error').show();
      valid = false;
    } else {
      $('#shop-error').hide();
    }

    /* メニュー名 */
    if (!$('#menu-name').val().trim()) {
      $('#menu-error').show();
      valid = false;
    } else {
      $('#menu-error').hide();
    }

    /* 値段 */
    if (!$('#price').val()) {
      $('#price-error').show();
      valid = false;
    } else {
      $('#price-error').hide();
    }

    /* カテゴリ */
    if (!$('#category').val()) {
      $('#category-error').show();
      valid = false;
    } else {
      $('#category-error').hide();
    }

    if (!valid) {
      /* 最初のエラーへスクロール */
      var $firstErr = $('.form-error:visible').first();
      if ($firstErr.length) {
        $('html, body').animate({ scrollTop: $firstErr.offset().top - 80 }, 300);
      }
      return;
    }

    /* 送信成功（ダミー） */
    $('#success-modal').addClass('active');
    $('body').addClass('modal-open');
  });

  /* ===== モーダル操作 ===== */
  $('#modal-close-btn').on('click', function () {
    closeModal();
  });

  $('#modal-back-btn').on('click', function () {
    closeModal();
    if (station) {
      window.location.href = '../lunchmap/index.html?station=' + encodeURIComponent(station);
    } else {
      window.location.href = '../index.html';
    }
  });

  $('#success-modal').on('click', function (e) {
    if ($(e.target).is('#success-modal')) closeModal();
  });

  function closeModal() {
    $('#success-modal').removeClass('active');
    $('body').removeClass('modal-open');
  }

});
