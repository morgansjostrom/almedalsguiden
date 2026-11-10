(() => {
  'use strict';
  const frame = document.getElementById('program-preview');
  if (!frame) return;
  const incoming = new URLSearchParams(location.search);
  const params = new URLSearchParams({embed: '1'});
  for (const name of ['event', 'q', 'speakerSearch', 'year', 'day', 'subject', 'subject2', 'category', 'organizer']) {
    if (incoming.has(name)) params.set(name, incoming.get(name) || '');
  }
  for (const [alias, name] of [['programEvent', 'event'], ['programQ', 'q'], ['programDay', 'day']]) {
    if (incoming.has(alias)) params.set(name, incoming.get(alias) || '');
  }
  const event = params.get('event');
  if (event) {
    const day = event.split('|')[1];
    if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
      params.set('day', day);
      params.set('year', day.slice(0, 4));
    }
  }
  if (params.size > 1) {
    frame.src = 'program.html?' + params.toString();
    frame.loading = 'eager';
  }
})();
