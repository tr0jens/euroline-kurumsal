/* Euroline · Kesit bölümü.
   Veri: window.EUROLINE.kesitler (assets/js/data/kesitler.js, çizimden üretildi; mm).
   Düz teknik çizim: parçalar rol sınıflarıyla, odacık numaraları sırayla belirir, ölçü okları.
   Sürükleyince SVG'nin 18 katmanı translateZ ile derinlik verir, rotateY en çok 55°; bırakınca yaylanarak düze döner.
   Arayüz: window.EUROLINE.Kesit.mount(el, seriler) -> { goster(id) } */
(function () {
  'use strict';
  var E = window.EUROLINE = window.EUROLINE || {};
  var NS = 'http://www.w3.org/2000/svg';
  var KATMAN = 18, DERINLIK = 1.6, AZAMI = 55, KADEME = 80;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function t(key) { return E.lang && E.lang.t ? E.lang.t(key) : key; }
  function doldur(s, v) { return s.replace(/\{(\w+)\}/g, function (_, k) { return v[k]; }); }
  // ondalık virgül: tr ve ru
  function sayi(n) { var l = E.lang && E.lang.current ? E.lang.current() : 'tr'; return String(n).replace('.', (l === 'tr' || l === 'ru') ? ',' : '.'); }
  function el(ad, at, ebeveyn) {
    var e = document.createElementNS(NS, ad);
    for (var k in at) if (Object.prototype.hasOwnProperty.call(at, k)) e.setAttribute(k, at[k]);
    if (ebeveyn) ebeveyn.appendChild(e);
    return e;
  }

  // Ölçü: uzatma çizgileri, iki ok, ortada etiket (teknik çizim dili)
  function olcuCiz(g, o) {
    var yatay = o.a[1] === o.b[1];
    var ok = 1.6, kanat = 0.55;
    var dx = o.b[0] - o.a[0], dy = o.b[1] - o.a[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / L, uy = dy / L;
    var grup = el('g', { 'class': 'kesit__olcu' }, g);
    [[o.a, o.uzanti[0]], [o.b, o.uzanti[1]]].forEach(function (u) {
      var p = u[0], hedef = u[1];
      if (yatay && hedef !== p[1]) el('line', { x1: p[0], y1: hedef + (hedef < p[1] ? 1 : -1), x2: p[0], y2: p[1] + (hedef < p[1] ? 1.5 : -1.5), 'class': 'kesit__uzanti' }, grup);
      if (!yatay && hedef !== p[0]) el('line', { x1: hedef + (hedef < p[0] ? 1 : -1), y1: p[1], x2: p[0] + (hedef < p[0] ? 1.5 : -1.5), y2: p[1], 'class': 'kesit__uzanti' }, grup);
    });
    el('line', { x1: o.a[0], y1: o.a[1], x2: o.b[0], y2: o.b[1], 'class': 'kesit__olcu-cizgi' }, grup);
    function ucOk(p, yon) {
      var bx = p[0] + ux * ok * yon, by = p[1] + uy * ok * yon;
      el('path', { d: 'M' + p[0] + ' ' + p[1] + 'L' + (bx - uy * kanat) + ' ' + (by + ux * kanat) + 'L' + (bx + uy * kanat) + ' ' + (by - ux * kanat) + 'Z', 'class': 'kesit__ok' }, grup);
    }
    ucOk(o.a, 1); ucOk(o.b, -1);
    var mx = o.etiket_x !== undefined ? o.etiket_x : (o.a[0] + o.b[0]) / 2, my = (o.a[1] + o.b[1]) / 2;
    var yazi = el('text', yatay ? { x: mx, y: my - 1.1, 'text-anchor': 'middle' } : { x: mx + 1.6, y: my, 'dominant-baseline': 'central' }, grup);
    yazi.setAttribute('class', 'kesit__olcu-yazi');
    yazi.setAttribute('data-anahtar', o.etiket_key);
    yazi.setAttribute('data-deger', o.deger);
  }

  function svgKur(s, asil) {
    var svg = el('svg', { viewBox: s.viewBox.join(' '), 'class': 'kesit__katman', focusable: 'false' });
    if (asil) { svg.setAttribute('role', 'img'); svg.classList.add('kesit__asil'); } else svg.setAttribute('aria-hidden', 'true');
    var sira = { cam: 0, kasa: 1, kanat: 2, cita: 3, conta: 4 };
    s.parcalar.slice().sort(function (a, b) { return sira[a.rol] - sira[b.rol]; }).forEach(function (p) {
      if (!asil && (p.rol === 'cam')) return;
      el('path', { d: p.d, 'class': 'kesit__parca kesit__' + p.rol, 'fill-rule': 'evenodd' }, svg);
    });
    if (!asil) return svg;
    var olc = el('g', { 'class': 'kesit__olculer' }, svg);
    s.olculer.forEach(function (o) { olcuCiz(olc, o); });
    var nolar = el('g', { 'class': 'kesit__nolar' }, svg);
    var k = 0, n = 0;
    s.odaciklar.forEach(function (o, i) {
      var g = el('g', { 'class': 'kesit__no kesit__no--' + o.rol, transform: 'translate(' + o.merkez[0] + ' ' + o.merkez[1] + ')' }, nolar);
      g.style.transitionDelay = (i * KADEME) + 'ms';
      el('circle', { r: 2.1 }, g);
      var tx = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g);
      tx.textContent = o.rol === 'kasa' ? ++k : ++n;
    });
    return svg;
  }

  function mount(kok, seriler) {
    var tablist = kok.querySelector('[role="tablist"]');
    var sahne = kok.querySelector('.kesit__sahne');
    var bolum = kok.closest('section') || document;
    var baslik = bolum.querySelector('[data-kesit-baslik]');
    var odacikDt = bolum.querySelector('[data-kesit-odacik-dt]');
    var odacikMetin = bolum.querySelector('[data-kesit-odacik]');
    var genislik = bolum.querySelector('[data-kesit-genislik]');
    var camDt = bolum.querySelector('[data-kesit-cam]');
    var uc = document.createElement('div');
    uc.className = 'kesit__3d';
    uc.style.transform = 'rotateY(0deg)';
    sahne.appendChild(uc);
    var seri = null, gorunur = false, kopyalar = false, aci = 0, hiz = 0, rafId = 0;

    var sekmeler = seriler.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.id = 'kesit-sekme-' + s.id;
      b.setAttribute('aria-controls', sahne.id);
      b.textContent = s.ad;
      b.addEventListener('click', function () { goster(s.id); });
      b.addEventListener('keydown', function (e) {
        var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: seriler.length - 1 }[e.key];
        if (document.documentElement.dir === 'rtl' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) j = e.key === 'ArrowRight' ? i - 1 : i + 1;
        if (j === undefined) return;
        e.preventDefault();
        j = (j + seriler.length) % seriler.length;
        goster(seriler[j].id);
        sekmeler[j].focus();
      });
      tablist.appendChild(b);
      return b;
    });

    function metinler() {
      if (!seri) return;
      var s = seri;
      var v = { ad: s.ad, kasa: s.odacik.kasa, kanat: s.odacik.kanat };
      if (baslik) baslik.textContent = s.ad;
      // odacık sayısı belirtilmeyen seride (null) satır gizlenir
      var sayili = s.odacik.kasa != null && s.odacik.kanat != null;
      if (odacikDt) {
        odacikDt.parentNode.hidden = !sayili;
        odacikDt.textContent = sayili ? s.odacik.kasa + ' / ' + s.odacik.kanat : '';
      }
      if (odacikMetin) odacikMetin.textContent = sayili ? doldur(t('kesit.odacik_metin'), v) : '';
      if (genislik) genislik.textContent = sayi(s.genislik_mm) + ' mm';
      if (camDt) camDt.textContent = (s.cam_mm[0] === s.cam_mm[1] ? s.cam_mm[0] : s.cam_mm.join('/')) + ' mm';
      var asil = uc.querySelector('.kesit__asil');
      if (asil) {
        asil.setAttribute('aria-label', doldur(t(sayili ? 'kesit.svg_alt' : 'kesit.svg_alt_sayisiz'), v));
        Array.prototype.forEach.call(asil.querySelectorAll('[data-anahtar]'), function (x) {
          var d = x.getAttribute('data-deger');
          x.textContent = t(x.getAttribute('data-anahtar')) + (d ? ' ' + sayi(d) : '');
        });
      }
    }

    function numaralar() {
      var nolar = uc.querySelectorAll('.kesit__asil .kesit__no');
      if (reduce || gorunur) Array.prototype.forEach.call(nolar, function (n) { n.classList.add('is-on'); });
    }

    function goster(id) {
      var s = null;
      for (var i = 0; i < seriler.length; i++) if (seriler[i].id === id) s = seriler[i];
      if (!s) return;
      seri = s;
      sekmeler.forEach(function (b, i) {
        var sec = seriler[i] === s;
        b.setAttribute('aria-selected', sec ? 'true' : 'false');
        b.tabIndex = sec ? 0 : -1;
      });
      sahne.setAttribute('aria-labelledby', 'kesit-sekme-' + s.id);
      uc.textContent = '';
      kopyalar = false;
      uc.appendChild(svgKur(s, true));
      metinler();
      // numaralar sırayla: önce gizli çiz, bir kare sonra aç
      requestAnimationFrame(function () { requestAnimationFrame(numaralar); });
    }

    // derinlik katmanları yalnız ilk sürüklemede kurulur
    function katmanlar() {
      if (kopyalar) return;
      kopyalar = true;
      var asil = uc.querySelector('.kesit__asil');
      asil.style.transform = 'translateZ(0)';
      for (var i = 1; i < KATMAN; i++) {
        var k = svgKur(seri, false);
        k.style.transform = 'translateZ(' + (-i * DERINLIK) + 'px)';
        k.classList.add('kesit__kopya');
        uc.insertBefore(k, asil);
      }
    }
    function uygula() { uc.style.transform = 'rotateY(' + (Math.round(aci * 100) / 100) + 'deg)'; }
    function yay() {
      // sönümlü yay: düz görünüme döner
      cancelAnimationFrame(rafId);
      if (reduce) { aci = 0; uygula(); sahne.classList.remove('is-3d'); return; }
      var son = performance.now();
      (function adim(simdi) {
        var dt = Math.min(0.032, (simdi - son) / 1000); son = simdi;
        hiz += (-170 * aci - 15 * hiz) * dt;
        aci += hiz * dt;
        if (Math.abs(aci) < 0.05 && Math.abs(hiz) < 0.5) { aci = 0; hiz = 0; uygula(); sahne.classList.remove('is-3d'); return; }
        uygula();
        rafId = requestAnimationFrame(adim);
      })(son);
    }
    var basX = null, basAci = 0;
    sahne.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      cancelAnimationFrame(rafId);
      basX = e.clientX; basAci = aci; hiz = 0;
      katmanlar();
      sahne.classList.add('is-3d');
      if (sahne.setPointerCapture) try { sahne.setPointerCapture(e.pointerId); } catch (err) { /* yok */ }
    });
    sahne.addEventListener('pointermove', function (e) {
      if (basX === null) return;
      var genis = sahne.getBoundingClientRect().width || 400;
      aci = Math.max(-AZAMI, Math.min(AZAMI, basAci + (e.clientX - basX) / genis * 140));
      uygula();
    });
    function birak() { if (basX === null) return; basX = null; yay(); }
    sahne.addEventListener('pointerup', birak);
    sahne.addEventListener('pointercancel', birak);
    sahne.addEventListener('lostpointercapture', birak);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (x) { if (x.isIntersecting) { gorunur = true; numaralar(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(sahne);
    } else gorunur = true;
    document.addEventListener('euroline:lang', metinler);

    if (seriler.length) goster(seriler[0].id);
    return { goster: goster };
  }

  E.Kesit = { mount: mount };

  function baslat() {
    var kok = document.querySelector('[data-kesit]');
    if (kok && E.kesitler) mount(kok, E.kesitler);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
  else baslat();
})();
