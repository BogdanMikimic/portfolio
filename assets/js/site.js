/* Progressive enhancement: the portfolio reads the same without JS. This script only adds
   reference codes to mail subjects and counts clicks when analytics is on. */
(() => {
  'use strict';

  // Reference code: #ref=wtw1 tells Bogdan which application led to a visit. Invalid values are ignored;
  // a valid one is remembered for the visit.
  const REF_PATTERN = /^[a-z0-9]{1,12}$/;
  const REF_KEY = 'portfolio-ref';
  const refFromHash = (() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('ref') || '';
    return REF_PATTERN.test(value) ? value : '';
  })();
  let ref = refFromHash;
  try {
    if (refFromHash) window.sessionStorage.setItem(REF_KEY, refFromHash);
    else ref = window.sessionStorage.getItem(REF_KEY) || '';
  } catch (_) { /* storage blocked: the ref lives only in this page's hash */ }
  if (!REF_PATTERN.test(ref)) ref = '';

  // Mail links carry the ref in their subject, so a reply shows which application led to it.
  if (ref) {
    for (const link of document.querySelectorAll('a[data-subject]')) {
      link.href = link.href.split('?')[0] + '?subject=' + encodeURIComponent(`${link.dataset.subject} [${ref}]`);
    }
  }

  // Provider adapter: replace this object to integrate Plausible or Umami.
  const providers = {
    goatcounter: {
      load(endpoint, onReady) {
        const script = document.createElement('script');
        script.src = 'https://gc.zgo.at/count.js';
        script.async = true;
        script.dataset.goatcounter = endpoint;
        script.onload = onReady;
        document.head.appendChild(script);
      },
      count(path) {
        if (typeof window.goatcounter?.count === 'function') {
          window.goatcounter.count({ path, event: true });
        }
      },
    },
  };

  // Events: repo:<slug>, demo:<slug>, contact:email and contact:linkedin on links; ref:<code> once on arrival.
  const TRACKED = /^(?:(?:repo|demo):[a-z0-9-]+|contact:(?:email|linkedin))$/;
  try {
    const analytics = JSON.parse(document.body.dataset.analytics || '{}');
    const provider = providers[analytics.provider];
    if (!analytics.endpoint || !provider) return;
    if (new URL(analytics.endpoint).protocol !== 'https:') return;
    provider.load(analytics.endpoint, () => {
      if (refFromHash) {
        try { provider.count(`ref:${refFromHash}`); } catch (_) { /* blocked analytics never breaks the page */ }
      }
    });
    const track = event => {
      if (event.type === 'auxclick' && event.button !== 1) return;
      const link = event.target.closest('a[data-track]');
      if (!link || !TRACKED.test(link.dataset.track)) return;
      try { provider.count(link.dataset.track); } catch (_) { /* Analytics never prevents navigation. */ }
    };
    document.addEventListener('click', track);
    document.addEventListener('auxclick', track);
  } catch (_) { /* Invalid settings or blocked analytics leave the portfolio usable. */ }
})();
