# bryanbar.com

Source for [bryanbar.com](https://bryanbar.com). Plain static HTML, CSS and
JavaScript — no build step, no generator, no toolchain. `bryan-bar.com` is the
same site, reached by a redirect.

## Layout

```
index.html           the page
404.html             not-found page
assets/
  style.css          tokens, layout, both themes
  site.js            navigation and the redirect banner
  sketch.js          the construction scene
.nojekyll            skip Jekyll processing
CNAME                custom domain
```

## Running it locally

```bash
python3 -m http.server 8000
```

Then <http://localhost:8000/>. Opening `index.html` straight off disk also
works — that is why configuration lives in a `.js` file rather than a `.json`
one fetched at runtime, since `fetch()` of a local file is blocked by CORS under
`file://`.

Two things that will otherwise waste your time:

- `python3 -m http.server` sends no `Cache-Control`, so a plain reload happily
  serves stale JavaScript. **Hard-reload** when the page looks unchanged.
- It also serves its own plain-text 404 for a missing path and never falls back
  to `404.html`; that mapping is Pages behaviour. Open `/404.html` directly.

## How it is published

Served straight from the repository root: **Settings → Pages → Source**, the
`dev` branch, `/ (root)`. Pages' branch source only offers `/ (root)` or
`/docs`, so anything else would need an Actions workflow; the root needs none.

## The scene

A tower crane builds `bryanbar` from lettered plates — `bryan` on the left tower,
`bar` on the right, each reading top to bottom. A dozer reverses into a stack of
concrete pipes, the pipes roll into the towers, and everything comes down. The
crane then clears the pipes, rebuilds their pyramid, and lays the letters back
out along the ground, spelling the word again.

Some of it is less arbitrary than it looks:

- **Two conserved rosters.** Eight letters and ten pipes exist for the life of
  the page. Nothing is ever created or destroyed, and both return to their
  starting arrangement every cycle.
- **The fall is integrated about the contact edge**, not the centre of mass, with
  the moment of inertia included — which is what makes a piece creep, then whip
  over, instead of spinning like a thrown frisbee.
- **Pipes roll without slipping**, so rotation is coupled to travel and they
  cannot read as sliding discs.
- **Nothing is random.** Variation comes from a hash of the cycle number, so the
  animation is reproducible — which is what makes it testable.
- `window.__DIAG` and `window.__setVT` are deliberate test seams. `__DIAG.at(t)`
  returns every piece's pose at any instant, so the checks assert against
  numbers rather than pixels.

It respects `prefers-reduced-motion` with a single composed still frame, and
follows the light or dark theme.
