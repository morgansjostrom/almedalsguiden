(() => {
  'use strict';
  const endpoint = '/api/popularity';
  let counts = {}, ready = false, paintFrame = null;
  function paint() {
    paintFrame = null;
    document.querySelectorAll('[data-heart-count]').forEach(el => {
      const total = counts[el.dataset.heartCount] || 0;
      const text = ready ? '♥ ' + total : '♥ –';
      if (el.textContent !== text) el.textContent = text;
      el.title = ready ? 'Totalt antal som sparat programpunkten: ' + total : 'Antalet kunde inte hämtas just nu';
      el.setAttribute('aria-label', el.title);
    });
  }
  function queuePaint() { if (paintFrame === null) paintFrame = requestAnimationFrame(paint); }
  function accept(data) {
    if (!data || typeof data.counts !== 'object') throw Error('Bad count response');
    counts = data.counts; ready = true; queuePaint();
    window.dispatchEvent(new CustomEvent('popularitychanged'));
  }
  let shared;
  try { if (parent !== window && parent.location.origin === location.origin) shared = parent.AlmedalPopularity; } catch {}
  if (shared?.subscribe && shared?.report) {
    const unsubscribe = shared.subscribe(accept);
    const report = () => shared.report(window.AlmedalFavorites?.snapshot() || [], window.AlmedalFavorites?.identity?.() || 'guest');
    window.AlmedalPopularity = {getCounts:() => ready ? {...counts} : null};
    window.addEventListener('favoriteschanged', report);
    window.addEventListener('pagehide', unsubscribe, {once:true});
    new MutationObserver(queuePaint).observe(document.body, {childList:true, subtree:true});
    report();
    return;
  }
  const listeners = new Set(), acknowledged = new Map(), queued = new Map();
  let identity = null;
  let busy = false, timer = null, reading = null, lastRead = 0, revision = 0;
  function publish(data) { accept(data); for (const listener of listeners) listener(data); }
  async function refresh() {
    if (document.hidden || Date.now() - lastRead < 60000) return;
    if (reading) return reading;
    const started = revision;
    reading = (async () => {
      try {
        const r = await fetch(endpoint);
        if (!r.ok) throw Error('counts');
        const data = await r.json();
        // An older read must not overwrite a just-completed save.
        if (started === revision) publish(data);
        lastRead = Date.now();
      } catch { queuePaint(); }
      finally { reading = null; }
    })();
    return reading;
  }
  function report(entries, nextIdentity = 'guest') {
    if (identity !== nextIdentity) { acknowledged.clear(); identity = nextIdentity; }
    for (const entry of entries) {
      const known = acknowledged.get(entry.ref), waiting = queued.get(entry.ref);
      if ((!known || entry.updatedAt > known.updatedAt) && (!waiting || entry.updatedAt > waiting.updatedAt)) queued.set(entry.ref, {...entry});
    }
    if (queued.size && !busy) { clearTimeout(timer); timer = setTimeout(flush, 350); }
  }
  async function flush() {
    if (busy || !queued.size) return;
    busy = true;
    const entries = [...queued.values()], sentIdentity = identity; queued.clear();
    try {
      const send = async () => {
        const r = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({entries}), cache:'no-store'});
        if (!r.ok) throw Error('save counts');
        return r.json();
      };
      const data = await (navigator.locks ? navigator.locks.request('almedalsguiden-popularity-write', send) : send());
      if (identity === sentIdentity) for (const entry of entries) acknowledged.set(entry.ref, entry);
      // Discard unchanged events that arrived while this request was pending.
      for (const [ref, entry] of queued) if (entry.updatedAt <= (acknowledged.get(ref)?.updatedAt || 0)) queued.delete(ref);
      revision++; publish(data); lastRead = Date.now();
    } catch {
      for (const entry of entries) if (!queued.has(entry.ref) || queued.get(entry.ref).updatedAt < entry.updatedAt) queued.set(entry.ref, entry);
      queuePaint();
      // Retry after a delay; never spin on a failed server or offline connection.
      clearTimeout(timer); timer = setTimeout(flush, 30000);
      busy = false; return;
    }
    busy = false;
    if (queued.size) { clearTimeout(timer); timer = setTimeout(flush, 350); }
  }
  window.AlmedalPopularity = {
    getCounts:() => ready ? {...counts} : null,
    subscribe(listener) { listeners.add(listener); if (ready) listener({counts}); return () => listeners.delete(listener); },
    report
  };
  const reportLocal = () => report(window.AlmedalFavorites?.snapshot() || [], window.AlmedalFavorites?.identity?.() || 'guest');
  window.addEventListener('favoriteschanged', reportLocal);
  window.addEventListener('online', () => { refresh(); reportLocal(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  new MutationObserver(queuePaint).observe(document.body, {childList:true, subtree:true});
  refresh(); reportLocal();
  // Only reads are periodic. Saves happen when favorites actually change.
  setInterval(refresh, 120000);
})();
