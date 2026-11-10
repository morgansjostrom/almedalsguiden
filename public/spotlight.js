(() => {
  'use strict';
  const list = document.getElementById('spotlight-list');
  if (!list) return;
  const status = document.getElementById('spotlight-status');
  const previous = document.getElementById('spotlight-previous');
  const next = document.getElementById('spotlight-next');
  const ref = e => [e.id, e.day, e.start].join('|');
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let programs = [], year = '', order = '', loaded = false;
  const cards = new Map();

  function controls() {
    previous.disabled = list.scrollLeft < 2;
    next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
  }
  function card(e) {
    const item = document.createElement('li');
    item.className = 'spotlight-card' + (e.sponsoredDemo ? ' spotlight-sponsored' : '');
    const date = new Date(e.day + 'T12:00:00Z').toLocaleDateString('sv-SE', {day:'numeric', month:'short', year:'numeric', timeZone:'Europe/Stockholm'});
    const url = 'index.html?programEvent=' + encodeURIComponent(ref(e)) + '#programrubrik';
    item.innerHTML = '<div class="spotlight-tags"><span>' + escape(e.subject || e.category) + '</span>' + (e.sponsoredDemo ? '<span class="spotlight-sponsor">Sponsrad</span>' : '') + '</div>' +
      '<p class="spotlight-date"><time datetime="' + escape(e.day + 'T' + e.start) + '">' + escape(date + ' · ' + e.start + (e.end ? '–' + e.end : '')) + '</time></p>' +
      '<h3><a href="' + escape(url) + '">' + window.AlmedalEventI18n.html(e,'title') + '</a></h3>' + window.AlmedalEventI18n.status(e) +
      '<p class="spotlight-description">' + window.AlmedalEventI18n.html(e,'description') + '</p>' +
      '<p class="spotlight-meta">' + escape(e.place || 'Platsangivelse saknas') + '<br><span>Arrangör: ' + escape(e.organizer || 'Ej angivet') + '</span></p>' +
      '<div class="spotlight-actions">' + (window.AlmedalFavorites?.button(e) || '') + '<a class="spotlight-open" href="' + escape(url) + '">Visa program →</a></div>';
    item.addEventListener('click', event => {
      if (event.target.closest('a,button,input,select,textarea,summary') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || window.getSelection()?.toString()) return;
      window.location.assign(url);
    });
    return item;
  }
  function render() {
    if (!loaded) return;
    const counts = window.AlmedalPopularity?.getCounts();
    status.textContent = programs.length ? 'Utforska de mest populära programpunkterna för kommande Almedalsvecka' : 'Inga programpunkter för ' + year + ' har publicerats ännu.';
    const sorted = programs.slice().sort((a,b) => ((counts?.[ref(b)] || 0) - (counts?.[ref(a)] || 0)) || (a.day + a.start).localeCompare(b.day + b.start) || ref(a).localeCompare(ref(b)));
    const newOrder = sorted.map(ref).join(',');
    if (newOrder !== order) {
      const left = list.scrollLeft;
      const focused = list.contains(document.activeElement) ? document.activeElement : null;
      for (const e of sorted) {
        if (!cards.has(ref(e))) cards.set(ref(e), card(e));
        list.append(cards.get(ref(e)));
      }
      order = newOrder;
      if (focused) focused.focus({preventScroll:true});
      list.scrollLeft = left;
    }
    controls();
  }
  previous.onclick = () => list.scrollBy({left:-list.clientWidth * .85, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  next.onclick = () => list.scrollBy({left:list.clientWidth * .85, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  list.addEventListener('scroll', controls, {passive:true});
  window.addEventListener('resize', controls);
  window.addEventListener('popularitychanged', render);
  window.AlmedalProgramData.fetch().then(r => {if (!r.ok) throw Error('program'); return r.json();}).then(events => {
    year = window.AlmedalProgramYears.defaultYear(events);
    const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Stockholm', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
    if (!events.some(e => e.day >= today)) year = String(Number(today.slice(0,4)) + 1);
    programs = events.filter(e => e.day.startsWith(year + '-'));
    loaded = true;
    render();
  }).catch(() => {status.textContent = 'Programmet kunde inte laddas. Försök igen om en stund.'; controls();});
  controls();
})();
