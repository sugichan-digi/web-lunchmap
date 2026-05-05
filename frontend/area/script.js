/* ===== Area Page Script ===== */

/* ダミーデータ: 都道府県 → 路線 → 駅 */
var DATA = {
  tokyo: {
    label: '東京都',
    lines: {
      yamanote: {
        label: 'JR山手線',
        stations: ['品川', '大崎', '五反田', '目黒', '恵比寿', '渋谷', '原宿', '代々木', '新宿', '新大久保', '高田馬場', '目白', '池袋', '大塚', '巣鴨', '駒込', '田端', '西日暮里', '日暮里', '鶯谷', '上野', '御徒町', '秋葉原', '神田', '東京', '有楽町', '新橋', '浜松町', '田町', '高輪ゲートウェイ']
      },
      chuo: {
        label: 'JR中央線',
        stations: ['東京', '神田', '御茶ノ水', '四ツ谷', '新宿', '中野', '荻窪', '吉祥寺', '三鷹', '立川', '国分寺', '西国分寺', '八王子']
      },
      ginza: {
        label: '東京メトロ銀座線',
        stations: ['渋谷', '表参道', '外苑前', '青山一丁目', '赤坂見附', '溜池山王', '虎ノ門', '新橋', '銀座', '京橋', '日本橋', '三越前', '神田', '末広町', '上野広小路', '上野', '稲荷町', '田原町', '浅草']
      },
      toyoko: {
        label: '東急東横線',
        stations: ['渋谷', '代官山', '中目黒', '祐天寺', '学芸大学', '都立大学', '自由が丘', '田園調布', '多摩川', '新丸子', '武蔵小杉', '元住吉', '日吉', '綱島', '大倉山', '菊名', '妙蓮寺', '白楽', '東白楽', '反町', '横浜']
      }
    }
  },
  osaka: {
    label: '大阪府',
    lines: {
      midosuji: {
        label: '大阪メトロ御堂筋線',
        stations: ['江坂', '東三国', '新大阪', '西中島南方', '中津', '梅田', '淀屋橋', '本町', '心斎橋', 'なんば', '大国町', '動物園前', '天王寺', '昭和町', '西田辺', '長居', 'あびこ', '北花田', '新金岡', 'なかもず']
      },
      jr_osaka: {
        label: 'JR大阪環状線',
        stations: ['大阪', '福島', '野田', '西九条', '弁天町', '大正', '芦原橋', '今宮', '新今宮', '天王寺', '寺田町', '桃谷', '鶴橋', '玉造', '森ノ宮', '大阪城公園', '京橋', '桜ノ宮', '天満', '大阪']
      }
    }
  },
  kanagawa: {
    label: '神奈川県',
    lines: {
      tokyu_den: {
        label: '東急田園都市線',
        stations: ['渋谷', '池尻大橋', '三軒茶屋', '駒沢大学', '桜新町', '用賀', '二子玉川', '二子新地', '高津', '溝の口', '梶が谷', '宮崎台', '宮前平', '鷺沼', 'たまプラーザ', 'あざみ野', '江田', '市が尾', '藤が丘', '青葉台', '田奈', '長津田']
      },
      jr_yokohama: {
        label: 'JR横浜線',
        stations: ['横浜', '東神奈川', '大口', '菊名', '新横浜', '小机', '鴨居', '中山', '十日市場', '長津田', '成瀬', '町田']
      }
    }
  }
};

/* デフォルトデータ（その他の都道府県用） */
var DEFAULT_LINES = {
  jr_local: {
    label: 'JR在来線',
    stations: ['中央駅', '北口駅', '南口駅', '東口駅', '西口駅', '市役所前駅']
  }
};

$(function () {

  var selectedPref = null;
  var selectedLine = null;

  /* URLパラメータ読み取り */
  var params = new URLSearchParams(window.location.search);
  var mode = params.get('mode');

  /* 戻るボタン */
  $('#back-btn').on('click', function () {
    if (selectedLine) {
      showPanel('line');
    } else if (selectedPref) {
      showPanel('pref');
    } else {
      window.location.href = '../index.html';
    }
  });

  /* 都道府県クリック */
  $(document).on('click', '.area-item[data-pref]', function () {
    var pref = $(this).data('pref');
    selectedPref = pref;
    var prefData = DATA[pref] || { label: $(this).text(), lines: DEFAULT_LINES };

    /* パンくず更新 */
    $('#bc-pref').text(prefData.label);
    $('#breadcrumb').show();
    $('#bc-sep-1').hide();
    $('#bc-line').hide();

    /* 路線リスト構築 */
    var $list = $('#line-list').empty();
    $.each(prefData.lines, function (lineKey, lineData) {
      var $item = $('<button class="area-list-item" data-line="' + lineKey + '">' +
        '<span>' + lineData.label + '</span>' +
        '<span class="area-list-item-arrow">›</span>' +
        '</button>');
      $list.append($item);
    });

    $('#line-panel-header').text('路線を選んでください — ' + prefData.label);
    showPanel('line');
    updateStep(2);
  });

  /* 路線クリック */
  $(document).on('click', '.area-list-item[data-line]', function () {
    var lineKey = $(this).data('line');
    var pref = DATA[selectedPref] || { label: selectedPref, lines: DEFAULT_LINES };
    var lineData = (pref.lines || DEFAULT_LINES)[lineKey] || DEFAULT_LINES.jr_local;
    selectedLine = lineKey;

    /* パンくず更新 */
    $('#bc-sep-1').show();
    $('#bc-line').text(lineData.label).show();

    /* 駅リスト構築 */
    var $list = $('#station-list').empty();
    $.each(lineData.stations, function (i, stationName) {
      var $item = $('<a class="area-list-item" href="../lunchmap/index.html?station=' + encodeURIComponent(stationName) + '">' +
        '<span>' + stationName + '駅</span>' +
        '<span class="area-list-item-arrow">›</span>' +
        '</a>');
      $list.append($item);
    });

    $('#station-panel-header').text('駅を選んでください — ' + lineData.label);
    showPanel('station');
    updateStep(3);
  });

  function showPanel(name) {
    $('#panel-pref, #panel-line, #panel-station').hide();
    $('#panel-' + name).show();
  }

  function updateStep(active) {
    for (var i = 1; i <= 3; i++) {
      var $step = $('#step-' + i);
      $step.removeClass('active done');
      if (i < active) $step.addClass('done');
      if (i === active) $step.addClass('active');
    }
    /* ステップdone時に番号をチェックマークに */
    $('#step-1 .area-step-num').text(active > 1 ? '✓' : '1');
    $('#step-2 .area-step-num').text(active > 2 ? '✓' : '2');
    $('#step-3 .area-step-num').text('3');
  }

});
