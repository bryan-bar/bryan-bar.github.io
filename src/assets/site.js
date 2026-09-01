/* bryanbar.com — nav rendering and the redirect-origin banner.
 *
 * Shared by index.html and 404.html. Loaded with a plain <script src>, not
 * fetch(), so it works when the page is opened straight off disk via file://
 * (a fetch() of a local JSON config is blocked by CORS there).
 */
(function () {
  'use strict';

  /* ==========================================================================
   * EDIT HERE — everything configurable about the page lives in this object.
   * ========================================================================== */
  const CONFIG = {
    // The one hostname that is "home". Everything else is an alias or a redirect.
    canonicalHost: 'bryanbar.com',

    // hostname -> how to describe it. Adding a future domain or alias is one line.
    // `local: true` marks a development origin. '' is the file:// case (no hostname).
    knownOrigins: {
      'bryanbar.com':        { label: 'bryanbar.com' },
      'www.bryanbar.com':    { label: 'the www alias' },
      'bryan-bar.com':       { label: 'bryan-bar.com' },
      'www.bryan-bar.com':   { label: 'www.bryan-bar.com' },
      'bryan-bar.github.io': { label: 'bryan-bar.github.io' },
      'localhost':           { label: 'localhost', local: true },
      '127.0.0.1':           { label: '127.0.0.1', local: true },
      '':                    { label: 'a local file', local: true }
    },

    // The nav bar. Keep it short.
    links: [
      { label: 'Terraform Registry', url: 'https://registry.terraform.io/providers/bryan-bar/toolbox/latest' },
      { label: 'edb-terraform', url: 'https://github.com/EnterpriseDB/edb-terraform' },
      { label: 'GitHub', url: 'https://github.com/bryan-bar' }
    ]
  };
  /* ====================== end of configuration ============================= */

  const STORE_FROM = 'bb:arrivedFrom';
  const STORE_HIDE = 'bb:bannerDismissed';
  const MAX_HOST_DISPLAY = 120;

  // sessionStorage throws in some privacy modes — never let that break the page.
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* ignore */ } }
  };

  function describe(host) {
    const entry = CONFIG.knownOrigins[host];
    return entry ? entry.label : null;
  }

  function isLocal(host) {
    const entry = CONFIG.knownOrigins[host];
    return Boolean(entry && entry.local);
  }

  /* ------------------------------------------------------------------ nav -- */

  function renderNav() {
    const list = document.getElementById('nav-list');
    if (!list) return;
    CONFIG.links.forEach(function (link) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'nav__link';
      a.href = link.url;
      a.textContent = link.label;          // text, never innerHTML
      if (/^https?:\/\//i.test(link.url) &&
          link.url.indexOf(CONFIG.canonicalHost) === -1) {
        a.rel = 'noopener';
      }
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  /* --------------------------------------------------------------- banner -- */

  /* Decide what, if anything, the banner should say.
   *
   * Two independent layers, with very different reliability:
   *
   *   Layer A - location.hostname. Always available, cannot fail. Tells us which
   *             endpoint is serving this page right now.
   *   Layer B - a ?from= marker. A 301 does NOT tell the destination page which
   *             hostname the visitor originally typed, and the registrar's
   *             forwarder strips incoming query strings, so this marker only
   *             exists if it was baked into the forward TARGET itself
   *             (bryan-bar.com -> https://bryanbar.com/?from=bryan-bar.com).
   *             If it is absent we silently fall back to Layer A.
   *
   * Returns { kind, host } or null for "say nothing".
   */
  function resolveOrigin() {
    let from = null;

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('from')) {
        from = params.get('from') || '';
        store.set(STORE_FROM, from);
        // Drop ?from= from the address bar but keep the banner on screen.
        params.delete('from');
        const qs = params.toString();
        window.history.replaceState(
          {}, '',
          window.location.pathname + (qs ? '?' + qs : '') + window.location.hash
        );
      }
    } catch (_) { /* URLSearchParams/replaceState unavailable: fall through */ }

    if (from === null) from = store.get(STORE_FROM);

    const host = window.location.hostname; // '' under file://

    if (from && from !== host) return { kind: 'redirected', host: from };
    if (isLocal(host))          return { kind: 'local', host: host };
    if (host !== CONFIG.canonicalHost) return { kind: 'alias', host: host };
    return null;                            // on the canonical host: stay quiet
  }

  function renderBanner() {
    const banner = document.getElementById('origin-banner');
    if (!banner) return;
    if (store.get(STORE_HIDE) === '1') return;

    const origin = resolveOrigin();
    if (!origin) return;

    const text = banner.querySelector('.banner__text');
    const closeBtn = banner.querySelector('.banner__close');
    if (!text) return;

    // A known host gets its friendly label; anything else is shown verbatim.
    // The ?from= value is attacker-controllable, so it is inserted with
    // textContent and never parsed as HTML.
    const friendly = describe(origin.host);
    const shown = origin.host.slice(0, MAX_HOST_DISPLAY);

    const code = document.createElement('code');
    code.textContent = shown || '(none)';

    text.textContent = '';
    if (origin.kind === 'redirected') {
      text.append('You were redirected from ', code,
                  friendly ? ' — this is ' + CONFIG.canonicalHost + ', the home for both.'
                           : ' — an address we do not recognise. This is ' +
                             CONFIG.canonicalHost + '.');
    } else if (origin.kind === 'local') {
      text.append('Local preview of ' + CONFIG.canonicalHost +
                  ' — served from ' + (friendly || 'this machine') + '.');
    } else {
      text.append('Served from ', code,
                  ' — the canonical home is ' + CONFIG.canonicalHost + '.');
    }

    banner.hidden = false;

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        banner.hidden = true;
        store.set(STORE_HIDE, '1');
      });
    }
  }

  /* ------------------------------------------------- p5 load failure note -- */

  function checkSketch() {
    const holder = document.getElementById('sketch-holder');
    if (!holder) return;
    if (typeof window.p5 !== 'undefined' && holder.querySelector('canvas')) return;

    const note = document.createElement('div');
    note.className = 'sketch__fallback';
    note.textContent = 'Under construction — the animation could not load.';
    holder.appendChild(note);
  }

  /* ------------------------------------------------------------------ go -- */

  function init() {
    renderNav();
    renderBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Give the CDN and the sketch a moment before deciding it failed.
  window.addEventListener('load', function () { setTimeout(checkSketch, 400); });
})();
