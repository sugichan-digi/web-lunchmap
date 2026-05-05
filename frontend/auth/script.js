/* ===== Auth Page Script ===== */

$(function () {

  var params = new URLSearchParams(window.location.search);
  var redirectTo = params.get('redirect');

  /* ===== タブ切り替え ===== */
  $('.auth-tab').on('click', function () {
    var tab = $(this).data('tab');
    $('.auth-tab').removeClass('active');
    $(this).addClass('active');

    $('#panel-login, #panel-register').hide();
    $('#panel-' + tab).show();
  });

  /* ===== ログインフォーム ===== */
  $('#login-form').on('submit', function (e) {
    e.preventDefault();
    var valid = true;

    if (!$('#login-email').val().trim()) {
      $('#login-email-error').show(); valid = false;
    } else { $('#login-email-error').hide(); }

    if (!$('#login-pw').val()) {
      $('#login-pw-error').show(); valid = false;
    } else { $('#login-pw-error').hide(); }

    if (!valid) return;

    /* ダミーログイン成功 */
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', 'ランチ太郎');
    localStorage.setItem('userHandle', '@lunchman');

    $('#success-msg').text('ログインしました！');
    showSuccessModal();
  });

  /* ===== 新規登録フォーム ===== */
  $('#register-form').on('submit', function (e) {
    e.preventDefault();
    var valid = true;

    if (!$('#reg-name').val().trim()) {
      $('#reg-name-error').show(); valid = false;
    } else { $('#reg-name-error').hide(); }

    if (!$('#reg-email').val().trim() || !$('#reg-email').val().includes('@')) {
      $('#reg-email-error').show(); valid = false;
    } else { $('#reg-email-error').hide(); }

    if ($('#reg-pw').val().length < 8) {
      $('#reg-pw-error').show(); valid = false;
    } else { $('#reg-pw-error').hide(); }

    if (!valid) return;

    /* ダミー登録成功 */
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', $('#reg-name').val().trim());
    localStorage.setItem('userHandle', '@' + $('#reg-email').val().split('@')[0]);

    $('#success-msg').text('アカウントを作成しました！');
    showSuccessModal();
  });

  function showSuccessModal() {
    $('#success-modal').addClass('active');
    $('body').addClass('modal-open');
  }

  /* リダイレクト先の設定 */
  if (redirectTo === 'post') {
    $('#success-modal .modal-footer .btn-primary').attr('href', '../post/index.html');
    $('#success-modal .modal-footer .btn-primary').text('投稿ページへ');
  }

});
