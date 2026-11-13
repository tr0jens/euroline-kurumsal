// Folyo renkleri. Kod yalnızca küçük yazıyla gösterilir; marka adı sitede geçmez.
(function (root) {
  var A = 'assets/img/folyo/';
  function r(slug, ad_key, kod, grup) {
    return { slug: slug, ad_key: ad_key, kod: kod, grup: grup, doku: A + slug + '.webp', numune: A + slug + '-n.webp' };
  }
  var R = [
    r('beyaz', 'renkler.beyaz', 'WAQ50-2H', 'standart'),
    r('antrasit-gri', 'renkler.antrasit_gri', 'KDB74-Z8/07', 'standart'),
    r('altin-mese', 'renkler.altin_mese', 'G6001-U4/07', 'standart'),
    r('walnut', 'renkler.walnut', 'UK103-Z8', 'standart'),
    r('maun', 'renkler.maun', 'UJ301-Z8', 'standart'),
    r('jet-black', 'renkler.jet_black', 'KDG62-6H', 'ozel'),
    r('sunset-grey', 'renkler.sunset_grey', 'G0502-Z8', 'ozel'),
    r('black-brown', 'renkler.black_brown', 'KDD17-U4', 'ozel'),
    r('cool-teak', 'renkler.cool_teak', 'G9601-J6', 'ozel'),
    r('anteak-oak', 'renkler.anteak_oak', 'Z1402-J6', 'ozel')
  ];
  (root.EUROLINE = root.EUROLINE || {}).renkler = R;
  if (typeof module !== 'undefined') module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
