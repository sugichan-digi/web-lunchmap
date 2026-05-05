/* ===== Mypage Script ===== */

$(function () {

  var isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  var userName = localStorage.getItem('userName') || 'ランチ太郎';
  var userHandle = localStorage.getItem('userHandle') || '@lunchman';

  /* ===== ログイン状態による表示切り替え ===== */
  if (isLoggedIn) {
    $('#logged-in-view').show();
    $('#not-logged-in-view').hide();
    $('#header-login-btn').hide();

    /* ユーザー情報反映 */
    $('#mypage-username').text(userName);
    $('#mypage-handle').text(userHandle);
  } else {
    $('#logged-in-view').hide();
    $('#not-logged-in-view').show();
    $('#header-login-btn').show();
  }

  /* ===== ログアウトボタン ===== */
  $('#logout-btn').on('click', function () {
    $('#logout-modal').addClass('active');
    $('body').addClass('modal-open');
  });

  /* モーダルキャンセル */
  $('#logout-cancel, #logout-cancel-2').on('click', function () {
    closeLogoutModal();
  });

  $('#logout-modal').on('click', function (e) {
    if ($(e.target).is('#logout-modal')) closeLogoutModal();
  });

  /* ログアウト確認 */
  $('#logout-confirm').on('click', function () {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userHandle');
    closeLogoutModal();
    /* 未ログイン状態に切り替え */
    $('#logged-in-view').hide();
    $('#not-logged-in-view').show();
    $('#header-login-btn').show();
    showToast('ログアウトしました');
  });

  function closeLogoutModal() {
    $('#logout-modal').removeClass('active');
    $('body').removeClass('modal-open');
  }

  /* ===== Toast ===== */
  function showToast(msg, type) {
    var cls = type === 'success' ? 'toast-success' : (type === 'error' ? 'toast-error' : '');
    var $toast = $('<div class="toast ' + cls + '">' + msg + '</div>');
    $('#toast-wrap').append($toast);
    setTimeout(function () {
      $toast.fadeOut(300, function () { $(this).remove(); });
    }, 2800);
  }

});
