// Share each language payload with same-origin embeds. English stays lazy.
(() => {
  'use strict';
  const pending = {};
  const property = lang => lang === 'sv' ? 'AlmedalSwedishEventTranslations' : 'AlmedalEventTranslations';
  function english() {
    if (window.AlmedalLanguage) return window.AlmedalLanguage.current === 'en';
    try { return localStorage.getItem('almedalskompassen:language') === 'en'; } catch { return false; }
  }
  // English is split into parts under 2 MB; every part must load before anything is shown.
  async function loadEnglish() {
    const r = await fetch('/translations/en-runtime/manifest.json?v=1');
    if (!r.ok) throw Error('Program translations unavailable: en');
    const m = await r.json();
    const parts = await Promise.all(m.chunks.map(c => fetch(c.file + '?v=1').then(x => { if (!x.ok) throw Error('Program translations unavailable: en'); return x.json(); })));
    const all = Object.assign({}, ...parts);
    if (Object.keys(all).length !== m.records) throw Error('Program translations incomplete: en');
    return all;
  }
  function load(lang = 'en') {
    lang = lang === 'sv' ? 'sv' : 'en';
    const key = property(lang);
    if (window[key]) return Promise.resolve(window[key]);
    if (!pending[lang]) {
      let shared;
      try { if (parent !== window && parent.location.origin === location.origin) shared = parent.AlmedalLoadEventTranslations; } catch {}
      pending[lang] = (shared ? shared(lang) : lang === 'en' ? loadEnglish() : new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/translations/events.' + lang + '.js';
        script.onload = () => resolve(window[key]);
        script.onerror = () => { script.remove(); reject(Error('Program translations unavailable: ' + lang)); };
        document.head.append(script);
      })).then(translations => {
        window[key] = translations;
        window.AlmedalEventI18n?.refresh();
        document.dispatchEvent(new CustomEvent('almedal-event-translations-loaded'));
        return translations;
      }).catch(error => { delete pending[lang]; throw error; });
    }
    return pending[lang];
  }
  window.AlmedalLoadEventTranslations = load;
  function ensure() {
    // The smaller Swedish payload also identifies English/mixed originals awaiting Swedish text.
    load('sv').catch(() => {});
    if (english()) load('en').catch(() => {});
  }
  document.addEventListener('almedal-language-changed', ensure);
  window.addEventListener('online', ensure);
  ensure();
})();
