/* Lightweight i18n loader + language switcher.
 * The page ships with the default language (nb = Norsk bokmål) inline, so it
 * renders fully WITHOUT JavaScript. All strings also live in i18n/<locale>.json
 * keyed by the data-i18n* attributes. When a non-default locale is active
 * (via the header dropdown, a ?lang=xx param, or a saved preference) the loader
 * fetches that file and swaps the text/attributes in. Add a language by
 * dropping a sibling JSON with the same keys and an <option> in the header.
 */
(function () {
  var INLINE = (document.documentElement.lang || 'nb');   // language baked into the HTML
  var params = new URLSearchParams(location.search);
  var LOCALE = params.get('lang') || localStorage.getItem('lang') || INLINE;

  var dict = {};
  window.I18N = dict;
  window.I18N_T = function (key) {
    return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : '';
  };

  function wireSelect() {
    var sel = document.getElementById('langSelect');
    if (!sel) return;
    sel.value = LOCALE;
    sel.addEventListener('change', function () {
      var v = this.value;
      if (v === INLINE) localStorage.removeItem('lang');
      else localStorage.setItem('lang', v);
      var u = new URL(location.href);
      if (v === INLINE) u.searchParams.delete('lang');
      else u.searchParams.set('lang', v);
      location.href = u.toString();   // reload for a clean, fully-applied state
    });
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (Object.prototype.hasOwnProperty.call(dict, k)) el.innerHTML = dict[k];
    });
    document.querySelectorAll('*').forEach(function (el) {
      for (var i = 0; i < el.attributes.length; i++) {
        var a = el.attributes[i];
        if (a.name.indexOf('data-i18n-attr-') === 0) {
          var real = a.name.slice('data-i18n-attr-'.length);
          if (Object.prototype.hasOwnProperty.call(dict, a.value)) {
            el.setAttribute(real, dict[a.value]);
          }
        }
      }
    });
    if (dict['meta.title']) document.title = dict['meta.title'];
    document.documentElement.lang = LOCALE;
    document.documentElement.setAttribute('data-i18n-ready', LOCALE);
  }

  function run() {
    wireSelect();
    if (LOCALE === INLINE) {            // inline copy already correct → no fetch
      document.documentElement.setAttribute('data-i18n-ready', INLINE);
      return;
    }
    fetch('i18n/' + LOCALE + '.json')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        Object.keys(data).forEach(function (k) { dict[k] = data[k]; });
        apply();
      })
      .catch(function (e) {
        console.error('i18n: could not load locale "' + LOCALE + '"', e);
        document.documentElement.setAttribute('data-i18n-ready', INLINE);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
