/* Euroline · dil çekirdeği
   Sözlükler (assets/i18n/*.js) window.EUROLINE.i18n.<dil> altına yazılır.
   Arayüz: window.EUROLINE.lang = { VISIBLE_LANGS, current, set, t, apply }
   Öznitelikler: data-i18n (textContent), data-i18n-html (yalnızca <br>/<em> içeren anahtarlar),
   data-i18n-attr="öznitelik:anahtar;öznitelik2:anahtar2".
   Dil sırası: ?lang= → localStorage['euroline-lang'] → tr. */
(function () {
  'use strict';
  var E = window.EUROLINE = window.EUROLINE || {};
  var D = E.i18n = E.i18n || {};
  var ALL = ['tr', 'en', 'ru', 'ar'];
  var VISIBLE_LANGS = ['tr', 'en'];
  var RTL = { ar: true };
  var KEY = 'euroline-lang';
  var LABEL = { tr: 'TR', en: 'EN', ru: 'RU', ar: 'AR' };

  function known(l) { return ALL.indexOf(l) !== -1; }
  function visible(l) { return VISIBLE_LANGS.indexOf(l) !== -1; }

  function fromUrl() {
    try {
      var m = /[?&]lang=([a-z]{2})(?:&|$)/i.exec((window.location || location).search || '');
      var l = m && m[1].toLowerCase();
      return l && known(l) ? l : null;
    } catch (e) { return null; }
  }
  function fromStore() {
    try {
      var l = window.localStorage.getItem(KEY);
      return l && visible(l) ? l : null;
    } catch (e) { return null; }
  }

  var cur = fromUrl() || fromStore() || 'tr';
  var applied = false;

  function t(key) {
    var d = D[cur];
    if (d && d[key] != null) return d[key];
    var f = D.tr;
    return f && f[key] != null ? f[key] : key;
  }

  function setRoot() {
    var de = document.documentElement;
    if (!de) return;
    de.setAttribute('lang', cur);
    de.setAttribute('dir', RTL[cur] ? 'rtl' : 'ltr');
  }

  function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  function buildSwitch(root) {
    var hosts = all(root, '[data-lang-switch]');
    hosts.forEach(function (host) {
      while (host.firstChild) host.removeChild(host.firstChild);
      VISIBLE_LANGS.forEach(function (l, i) {
        if (i) {
          var sep = document.createElement('span');
          sep.setAttribute('aria-hidden', 'true');
          sep.textContent = ' · ';
          host.appendChild(sep);
        }
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-lang', l);
        b.setAttribute('lang', l);
        b.setAttribute('aria-pressed', l === cur ? 'true' : 'false');
        b.textContent = LABEL[l];
        b.addEventListener('click', function () { set(l); });
        host.appendChild(b);
      });
    });
  }

  function apply(root) {
    root = root || document;
    applied = true;
    setRoot();
    all(root, '[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    all(root, '[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    all(root, '[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i > 0) el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
      });
    });
    if (root === document) {
      var tt = t('meta.baslik');
      if (tt) document.title = tt;
    }
    buildSwitch(root);
    all(root, '[data-lang-switch] [data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === cur ? 'true' : 'false');
    });
  }

  function set(l) {
    if (!known(l)) return;
    cur = l;
    try { window.localStorage.setItem(KEY, l); } catch (e) { /* depolama kapalı olabilir */ }
    try {
      if (window.history && window.history.replaceState && window.location) {
        var u = new URL(window.location.href);
        u.searchParams.set('lang', l);
        window.history.replaceState(null, '', u.toString());
      }
    } catch (e) { /* file:// ya da sahte ortam */ }
    apply(document);
    try { document.dispatchEvent(new CustomEvent('euroline:lang', { detail: { lang: l } })); } catch (e) { /* eski tarayıcı */ }
  }

  E.lang = {
    VISIBLE_LANGS: VISIBLE_LANGS,
    current: function () { return cur; },
    set: set,
    t: t,
    apply: apply
  };

  setRoot();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { if (!applied) apply(document); });
  } else {
    apply(document);
  }
})();
