$(function () {

  /* ===== Like button toggle ===== */
  $(document).on('click', '.lunch-card-like', function (e) {
    e.stopPropagation();
    var $btn = $(this);
    var isLiked = $btn.hasClass('liked');
    var count = parseInt($btn.data('count'));

    if (isLiked) {
      count--;
      $btn.removeClass('liked').data('count', count).text('🤍 ' + count);
    } else {
      count++;
      $btn.addClass('liked').data('count', count).text('❤️ ' + count);
    }
  });

  /* ===== Card click → detail ===== */
  $(document).on('click', '.lunch-card', function () {
    var id = $(this).data('id');
    window.location.href = './detail/index.html?id=' + id;
  });

  /* ===== Toast helper ===== */
  function showToast(msg, type) {
    var cls = type === 'success' ? 'toast-success' : (type === 'error' ? 'toast-error' : '');
    var $toast = $('<div class="toast ' + cls + '">' + msg + '</div>');
    $('#toast-wrap').append($toast);
    setTimeout(function () {
      $toast.fadeOut(300, function () { $(this).remove(); });
    }, 2800);
  }

});
