/* ===== Contact Page Script ===== */

$(function () {

  var API_BASE = 'http://localhost:8080';
  


  /* ===== 文字数カウント ===== */
  $('#body').on('input', function () {
    var len = $(this).val().length;
    $('#char-count').text(len);
    if (len > 0) $('#body-error').hide();
  });

  /* ===== 戻るボタン ===== */
  $('#back-btn').on('click', function () {
    window.history.back();
  });

  /* ===== フォーム送信 ===== */
  $('#contact-form').on('submit', function (e) {
    e.preventDefault();

    var body     = $('#body').val().trim();
    var valid    = true;

    if (!body) {
      $('#body-error').text('⚠ 内容を入力してください').show();
      valid = false;
    } else if (body.length > 1000) {
      $('#body-error').text('⚠ 内容は1000文字以内で入力してください').show();
      valid = false;
    } else {
      $('#body-error').hide();
    }

    if (!valid) {
      var $firstErr = $('.form-error:visible').first();
      if ($firstErr.length) {
        $('html, body').animate({ scrollTop: $firstErr.offset().top - 80 }, 300);
      }
      return;
    }

    var $btn = $('#submit-btn');
    $btn.prop('disabled', true).text('送信中…');
    $('#api-error').hide();

    var headers = { 'Content-Type': 'application/json' };
    var token   = localStorage.getItem('token');
    if (token) headers['Authorization'] = 'Bearer ' + token;

    $.ajax({
      url:         API_BASE + '/contacts',
      method:      'POST',
      contentType: 'application/json',
      headers:     headers,
      data:        JSON.stringify({ category: 'general', body: body }),
      success: function () {
        window.location.href = '../contact-complete/index.html';
      },
      error: function (xhr) {
        var msg = (xhr.responseJSON && xhr.responseJSON.error)
                  || '送信に失敗しました。しばらく経ってからお試しください。';
        $('#api-error').text('⚠ ' + msg).show();
        $btn.prop('disabled', false).text('送信する');
      }
    });
  });

});
