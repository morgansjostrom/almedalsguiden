/* The program document is only a renderer inside the homepage. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('embed') === '1' && window.self !== window.top) return;
  params.delete('embed');
  const url = new URL('./', location.href);
  url.search = params.toString();
  url.hash = 'programrubrik';
  location.replace(url.href);
})();