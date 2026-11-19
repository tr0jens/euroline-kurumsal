/* Euroline · sayfanın kendi davranışları.
   Motor (scrollcraft.js) dokunulmadan kalır; bu dosya --sc-p değerini okuyup
   imza hareketi (açılan pencere), seri bölümleri, renk seçimi
   ve sayaçları sürer. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIn = function (t) { return t * t * t; };
  // Kol yaylanması: sürenin %70’inde 90°’nin 3,5° ötesine varır, kalan sürede geri oturur (aşım ≤ 4°).
  var yay = function (t) { return t < .7 ? easeInOut(t / .7) * (1 + 3.5 / 90) : 1 + (3.5 / 90) * (1 - easeInOut((t - .7) / .3)); };
  var readP = function (el) { return parseFloat(getComputedStyle(el).getPropertyValue('--sc-p')) || 0; };

  // Hareket azaltıldığında açılış tek ekrana iner: pencere açık, kamera içeride.
  if (reduce) {
    var hero = document.getElementById('acilis');
    if (hero) hero.setAttribute('data-sc-span', '1');
  }

  // ---------- kesintisiz kaydırma (Lenis) ----------
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    var t = id.length > 1 ? document.querySelector(id) : document.body;
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.6 });
    else t.scrollIntoView();
    if (id !== '#top' && t.focus) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
  });

  if (window.ScrollCraft) ScrollCraft.mount(document.body);

  // ---------- 1 · eşik ----------
  var esik = document.querySelector('[data-esik]');
  var esikAct = document.getElementById('acilis');
  var disMetin = document.querySelector('.esik__metin--dis');
  // Hareket azaltıldığında dış metin hiç görünmez; slogan iç metinde başlığın altında zaten var.
  function layoutEsik() {
    if (!esik) return;
    var w = esik.clientWidth, h = esik.clientHeight;
    var phone = w < 760;
    var ah = phone ? Math.min(h * 0.5, w * 0.95) : Math.min(h * 0.66, 720);
    var aw = ah * (phone ? 0.74 : 0.8);
    var cx = phone ? w * 0.5 : w * 0.66;
    var cy = phone ? h * 0.36 : h * 0.47;
    var ax = cx - aw / 2, ay = cy - ah / 2;
    var s = esik.style;
    s.setProperty('--aw', aw.toFixed(1) + 'px');
    s.setProperty('--ah', ah.toFixed(1) + 'px');
    s.setProperty('--ax', ax.toFixed(1) + 'px');
    s.setProperty('--ay', ay.toFixed(1) + 'px');
    s.setProperty('--ox', cx.toFixed(1) + 'px');
    s.setProperty('--oy', cy.toFixed(1) + 'px');
    // aperture ekranı tamamen geçene kadar gereken ölçek
    esik._dollyMax = Math.max(w / aw, h / ah) * 1.15; // ekranı doldurmaya yetecek kadar; fazlası Chrome'da dev katman çizdirip geri kaydırmada bozulmaya yol açıyordu
  }
  var lastEsik = -1;
  function renderEsik(p) {
    if (!esik) return;
    if (reduce) p = 0.46;
    if (Math.abs(p - lastEsik) < 0.0004) return;
    lastEsik = p;
    // Sıra: kol 90° döner ve oturur, kanat ancak ondan sonra açılır (sağ 0.03–0.09 → 0.09; sol 0.10–0.16 → 0.16).
    var kol = yay(seg(p, 0.03, 0.09));
    var kolSol = yay(seg(p, 0.1, 0.16));
    var openSag = easeInOut(seg(p, 0.09, 0.42));
    var openSol = easeInOut(seg(p, 0.16, 0.48));
    var open = openSol;
    var isik = easeOut(seg(p, 0.1, 0.5));
    var dolly = easeIn(seg(p, 0.4, 0.86));
    var dMax = esik._dollyMax || 6;
    var s = esik.style;
    s.setProperty('--kol', (kol * -90).toFixed(2) + 'deg');
    s.setProperty('--kol-sol', (kolSol * 90).toFixed(2) + 'deg');
    s.setProperty('--ac-sag', (openSag * -64).toFixed(2) + 'deg');
    s.setProperty('--ac-sol', (openSol * -64).toFixed(2) + 'deg');
    s.setProperty('--isik', isik.toFixed(3));
    s.setProperty('--open', open.toFixed(3));
    s.setProperty('--open-sag', openSag.toFixed(3));
    s.setProperty('--open-sol', openSol.toFixed(3));
    s.setProperty('--oda-o', reduce ? '1' : (1 - seg(p, 0.7, 0.84)).toFixed(3));
    s.setProperty('--dolly', (1 + dolly * (dMax - 1)).toFixed(3));
    s.setProperty('--dis-s', (1.28 - easeOut(seg(p, 0.35, 0.9)) * 0.28).toFixed(3));
    s.setProperty('--dis-b', ((1 - isik) * 3 + (1 - seg(p, 0.45, 0.8)) * 1.2).toFixed(2) + 'px');
    s.setProperty('--ic', reduce ? '1' : (1 - seg(p, 0.16, 0.27)).toFixed(3));
    var d = reduce ? 0 : easeOut(seg(p, 0.8, 0.94));
    s.setProperty('--dis', d.toFixed(3));
    if (disMetin) disMetin.classList.toggle('is-on', d > 0.5);
    if (disMetin) {
      disMetin.setAttribute('aria-hidden', d > 0.5 ? 'false' : 'true');
      var db = disMetin.querySelector('a'); if (db) db.tabIndex = d > 0.5 ? 0 : -1;
    }
  }

  var dil = window.EUROLINE && window.EUROLINE.lang;

  // ---------- 4 · seriler ----------
  var seriler = document.querySelector('[data-seriler]');
  var serilerAct = seriler && seriler.closest('[data-sc-act]');
  var imgs = seriler ? seriler.querySelectorAll('.seriler__cam img') : [];
  var panels = seriler ? seriler.querySelectorAll('.seri') : [];
  var items = seriler ? seriler.querySelectorAll('.seriler__liste li') : [];
  var N = imgs.length, curSeri = -1;
  var seriPencere = seriler ? seriler.querySelector('[data-seri-pencere] .pp') : null;
  var SURME = N - 1; // Sürline son sırada
  function renderSeriler(p) {
    if (!N) return;
    // ilk %6 ve son %8 tutma payı; arada her seri eşit pay alır
    var t = seg(p, 0.06, 0.92) * (N - 1);
    var idx = clamp(Math.round(t - 0.15), 0, N - 1);
    for (var k = 1; k < N; k++) {
      var local = reduce ? (t >= k - 0.5 ? 1 : 0) : easeInOut(seg(t, k - 0.62, k - 0.08));
      var im = imgs[k];
      if (reduce) { im.style.clipPath = 'none'; im.style.opacity = local; im.style.transform = 'none'; }
      else {
        im.style.clipPath = 'inset(' + ((1 - local) * 100).toFixed(2) + '% 0 0 0)';
        im.style.transform = 'scale(' + (1.08 - local * 0.08).toFixed(4) + ')';
      }
    }
    if (!reduce) imgs[0].style.transform = 'scale(' + (1.08 - Math.min(t, 1) * 0.08).toFixed(4) + ')';
    if (idx !== curSeri) {
      curSeri = idx;
      for (var i = 0; i < panels.length; i++) panels[i].classList.toggle('on', i === idx);
      for (var j = 0; j < items.length; j++) items[j].classList.toggle('on', j === idx);
      pencereGit(idx, false);
    }
  }

  // Seri penceresi: kaydırmadan bağımsız, zamanlı hareket. Seri değişince pencere kapanır,
  // kapalıyken o serinin rengini alır, sonra kol döner ve kanatlar hafif bir salınımla açılır.
  // Sürline'da sağ kanat kayar. Renk: listedeki li'nin data-renk değeri.
  var seriKasa = seriler ? seriler.querySelector('[data-seri-pencere]') : null;
  var pen = { o: 0, hedef: -1, gosterilen: -1, tekrar: false, adim: null, gorunur: false };
  var KAPAN_MS = 650, AC_MS = 1700, BEKLE_MS = 180;
  // Açılış eğrisi: yumuşak başlar, sürenin %72'sinde %3,5 öteye salınır, kalan sürede yerine oturur
  var acEgri = function (k) { return k < .72 ? easeInOut(k / .72) * 1.035 : 1.035 - .035 * easeInOut((k - .72) / .28); };
  function pencereGit(i, tekrar) {
    if (!seriPencere) return;
    pen.hedef = i;
    if (tekrar && i === pen.gosterilen) pen.tekrar = true;
    if (pen.adim && pen.adim.tip === 'ac' && (pen.hedef !== pen.gosterilen || pen.tekrar)) pen.adim = null; // açılırken yarıda kapanmaya geçer
  }
  function pencereUygula(o) {
    var ps = seriPencere.style;
    if (seriPencere.classList.contains('pp--surme')) {
      ps.setProperty('--kay', Math.min(o, 1.03).toFixed(4)); ps.setProperty('--ac-sol', '0deg'); ps.setProperty('--ac-sag', '0deg'); ps.setProperty('--kolt', '0');
      return;
    }
    // Önce kol döner (o: 0–0,22), sonra kanatlar açılır; sağ kanat bir tık geriden gelir
    var kolt = yay(clamp(o / 0.22, 0, 1));
    var acSol = Math.max(0, (o - 0.22) / 0.78), acSag = Math.max(0, (o - 0.28) / 0.72);
    ps.setProperty('--kolt', kolt.toFixed(3)); ps.setProperty('--kay', '0');
    ps.setProperty('--ac-sol', (acSol * -58).toFixed(2) + 'deg'); ps.setProperty('--ac-sag', (acSag * -58).toFixed(2) + 'deg');
  }
  function seriGiydir(i) {
    var li = items[i];
    seriKasa.setAttribute('data-renk', (li && li.getAttribute('data-renk')) || 'beyaz');
    seriPencere.classList.toggle('pp--surme', i === SURME);
    pen.gosterilen = i;
  }
  function pencereTick(now) {
    if (!seriPencere || pen.hedef < 0) return;
    var a = pen.adim;
    if (reduce) { // hareket yok: renk değişir, pencere kapalı kalır
      if (pen.gosterilen !== pen.hedef) { seriGiydir(pen.hedef); pencereUygula(0); }
      return;
    }
    if (!a) {
      var degisecek = pen.gosterilen !== pen.hedef || pen.tekrar;
      if (degisecek && pen.o > 0.001) a = pen.adim = { tip: 'kapan', t0: now, bas: pen.o };
      else if (degisecek || (pen.o < 0.999 && pen.gorunur)) {
        if (!pen.gorunur) { if (pen.gosterilen !== pen.hedef) seriGiydir(pen.hedef); pencereUygula(0); return; }
        seriGiydir(pen.hedef); pen.tekrar = false;
        a = pen.adim = { tip: 'ac', t0: now + BEKLE_MS, bas: pen.o };
      } else return;
    }
    if (a.tip === 'kapan') {
      var kk = clamp((now - a.t0) / (KAPAN_MS * Math.max(a.bas, 0.35)), 0, 1);
      pen.o = a.bas * (1 - easeInOut(kk));
      if (kk >= 1) { pen.o = 0; pen.adim = null; }
    } else {
      var ka = clamp((now - a.t0) / (AC_MS * (1 - a.bas)), 0, 1);
      pen.o = a.bas + (1 - a.bas) * acEgri(ka);
      if (ka >= 1) { pen.o = 1; pen.adim = null; }
    }
    pencereUygula(pen.o);
  }
  if (seriKasa) {
    // Ekrandan çıkınca kapanır; geri gelince yeniden açılır
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          pen.gorunur = e.isIntersecting;
          if (!e.isIntersecting && seriPencere) { pen.adim = null; pen.o = 0; pencereUygula(0); }
        });
      }, { threshold: 0.35 }).observe(seriKasa);
    } else pen.gorunur = true;
    // Pencereye dokununca aynı seri kapanıp yeniden açılır
    seriKasa.addEventListener('click', function () { if (curSeri >= 0) pencereGit(curSeri, true); });
  }
  // Listeden seri seçimi: o serinin kaydırma aralığına gider, pencere kapanıp yeni renkte açılır
  function seriyeGit(i) {
    if (!serilerAct) return;
    var p = 0.06 + 0.86 * (i + 0.2) / (N - 1);
    if (i === 0) p = 0.02;
    var y = serilerAct.offsetTop + (serilerAct.offsetHeight - innerHeight) * Math.min(p, 0.97);
    if (i === curSeri) pencereGit(i, true);
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  Array.prototype.forEach.call(items, function (li, i) {
    var b = li.querySelector('button');
    if (b) b.addEventListener('click', function () { seriyeGit(i); });
  });

  // ---------- 7 · kapanış güneşi ----------
  var kapanis = document.querySelector('[data-kapanis]');
  var kapanisAct = kapanis && kapanis.closest('[data-sc-act]');
  function renderKapanis(p) {
    if (!kapanis) return;
    kapanis.style.setProperty('--gp', reduce ? '1' : easeOut(seg(p, 0, 0.7)).toFixed(3));
  }

  // ---------- üst çubuk rengi ----------
  var bar = document.querySelector('[data-bar]');
  var kesitAct = document.getElementById('kesit');
  function renderBar() {
    if (!bar || !esikAct) return;
    var y = window.scrollY, vh = window.innerHeight;
    var heroEnd = esikAct.offsetTop + esikAct.offsetHeight - vh * 0.5;
    var inKesit = kesitAct && y + 40 > kesitAct.offsetTop && y + 40 < kesitAct.offsetTop + kesitAct.offsetHeight - vh * 0.2;
    var hp = readP(esikAct);
    var inHero = y < heroEnd;
    bar.classList.toggle('is-ink', inHero && hp > 0.18 && hp < 0.66);
    bar.classList.toggle('is-photo', inHero && hp >= 0.66);
    bar.classList.toggle('is-light', y > heroEnd && !inKesit);
    bar.classList.toggle('is-night', !!inKesit);
  }

  // ---------- tek döngü ----------
  function tick() {
    if (esikAct) renderEsik(readP(esikAct));
    if (serilerAct) renderSeriler(readP(serilerAct));
    pencereTick(performance.now());
    if (kapanisAct) renderKapanis(readP(kapanisAct));
    renderBar();
    requestAnimationFrame(tick);
  }
  layoutEsik();
  addEventListener('resize', function () { layoutEsik(); lastEsik = -1; });
  requestAnimationFrame(tick);

  // ---------- 5 · renk seçimi ----------
  var ornek = document.querySelector('[data-renk-ornek]');
  document.querySelectorAll('input[name="renk"]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (!ornek || !r.checked) return;
      ornek.setAttribute('data-renk', r.value);
    });
  });

  // ---------- 6 · sayaçlar (Türkçe binlik ayırıcı) ----------
  var SAYI_DILI = { tr: 'tr-TR', en: 'en-US', ru: 'ru-RU', ar: 'ar-u-nu-latn' };
  var fmt = new Intl.NumberFormat(SAYI_DILI[dil ? dil.current() : 'tr'] || 'tr-TR');
  var says = document.querySelectorAll('[data-say]');
  function say(el) {
    var to = parseFloat(el.getAttribute('data-say'));
    if (reduce) { el.textContent = fmt.format(to); return; }
    var t0 = null;
    (function f(now) {
      if (t0 === null) t0 = now;
      var t = Math.min((now - t0) / 1600, 1);
      el.textContent = fmt.format(Math.round(to * easeOut(t)));
      if (t < 1) requestAnimationFrame(f);
    })(performance.now());
  }
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { say(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    says.forEach(function (el) { io.observe(el); });
  }

  // ---------- plaka ve panel ----------
  // Katalog / teklif bağlantıları: mesaj sözlükten gelir, dil değişince yeniden kodlanır.
  // data-teklif-on="bayi" gibi bir önek verilirse metinler <önek>.wa_mesaj / .mail_konu / .mail_govde anahtarlarından gelir (varsayılan: plaka).
  function teklifKur() {
    if (!dil) return;
    document.querySelectorAll('[data-teklif]').forEach(function (a) {
      var on = a.getAttribute('data-teklif-on') || 'plaka';
      if (a.getAttribute('data-teklif') === 'wa') {
        a.setAttribute('href', 'https://wa.me/905557099408?text=' + encodeURIComponent(dil.t(on + '.wa_mesaj')));
      } else {
        a.setAttribute('href', 'mailto:ckizilay@eurolinepvc.com?subject=' + encodeURIComponent(dil.t(on + '.mail_konu')) +
          '&body=' + encodeURIComponent(dil.t(on + '.mail_govde')));
      }
    });
  }
  teklifKur();
  // Panel katman şeması: bölüm görününce katmanlar ayrılır (hareket azaltıldıysa CSS zaten açık tutar).
  var sema = document.querySelector('[data-panel-sema]');
  if (sema) {
    if (reduce || !('IntersectionObserver' in window)) sema.classList.add('is-ac');
    else {
      new IntersectionObserver(function (es, o) {
        es.forEach(function (e) { if (e.isIntersecting) { sema.classList.add('is-ac'); o.disconnect(); } });
      }, { threshold: 0.45 }).observe(sema);
    }
  }

  // ---------- dil değişimi ----------
  // i18n.js metinleri yazar; burada yalnızca JS'in kurduğu parçalar (teklif bağlantıları, sayı biçimi) yenilenir.
  document.addEventListener('euroline:lang', function () {
    teklifKur();
    fmt = new Intl.NumberFormat(SAYI_DILI[dil.current()] || 'tr-TR');
    says.forEach(function (el) { el.textContent = fmt.format(parseFloat(el.getAttribute('data-say'))); });
    lastEsik = -1;
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* eski tarayıcı */ }
  });

  // ---------- sessiz video döngüleri ----------
  var donguler = document.querySelectorAll('video[data-dongu]');
  if (donguler.length && !reduce && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.muted = true; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    donguler.forEach(function (v) { vio.observe(v); });
  }

  // ---------- katalog indirme ----------
  // claude.ai önizlemesinde sayfa doğrudan dosya indiremez; orada indirme
  // izni (downloads) üzerinden kaydederiz. Gerçek sitede bağlantı normal çalışır.
  var dl = null;
  if (window.claude && typeof window.claude.use === 'function') {
    window.claude.use('downloads').then(function (ns) { dl = ns; }, function () {});
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[download]');
    if (!a || !dl) return;
    e.preventDefault();
    var name = a.getAttribute('href').split('/').pop();
    fetch(a.getAttribute('href'))
      .then(function (r) { if (!r.ok) throw new Error('fetch'); return r.blob(); })
      .then(function (b) { return dl.save({ filename: name, data: b }); })
      .catch(function (err) {
        if (err && (err.code === 'declined' || err.code === 'rate_limited')) return;
        window.open(a.href, '_blank', 'noopener');
      });
  });
})();
