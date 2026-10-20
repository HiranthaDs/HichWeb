# HICH page transitions

The site uses a brief original HICH curtain between known internal HTML pages. A pink leading edge, staggered wordmark, subtle background grid, SVG asterisk and actual destination label connect the outgoing page to the next one. Phones use a lighter version of the same compositor-friendly motion. Cover and reveal cleanup follow the rendered CSS `animationend` events, with timers only as recovery fallbacks. It is a visual handoff, not a fake loading-progress indicator.

The global implementation lives in `src/PageTransition.jsx` and `src/page-transition.css`. Entering or leaving `/services.html` is intentionally different: `src/ServicesGitTransition.jsx` and `src/services-git-transition.css` render a light Git workflow that merges Discover, Design, Build and Launch into one fast-forward path. The editorial headline, terminal command, branch line, commit chips and completion state share GitHub's familiar light contribution palette. Phones transpose the horizontal history into a compact vertical branch without switching to a dark surface. Coordinated gates, copy, nodes and a green scan complete the handoff; the route-specific controller claims the qualifying click before the global curtain, so the two effects never stack.

Navigation remains native document navigation: real link URLs, browser history, query strings and destination hashes remain intact. A short-lived session-storage marker coordinates the two documents; if storage is unavailable, outgoing navigation still works. Each marker contains only the destination URL, timestamp and, for the services effect, its enter/exit direction. A genuine page exit preserves the marker for the destination document; arrival consumes it immediately.

The component:

- Intercepts only unmodified primary clicks on known same-origin pages.
- Leaves same-page hash links, downloads, external links, new-tab links, unknown routes, telephone/email links and explicit `data-no-transition` links to the browser.
- Closes open native dialogs before drawing the curtain so their top-layer content cannot obscure it.
- Lets Escape cancel a transition before navigation is committed.
- Resets on history restoration, page exit, changed motion preferences, and a failed/cancelled navigation timeout.
- Completely bypasses motion when reduced motion is requested.
- Keeps decorative markup hidden from assistive technology.
- Uses an SVG icon, with no emoji/font-symbol dependency on mobile.
- Promotes transition layers only while an effect is active and animates transform/opacity paths.
- Leaves prerendered content and real links usable when JavaScript is disabled. If the arrival marker runs but hydration fails, its independent 1.8-second timeout releases the curtain.

## Validation

Chrome checks against the production build verified menu-to-page navigation, query/hash preservation, back/forward, standard link bypasses, Escape cancellation, reduced motion, and mobile navigation without horizontal overflow. The services Git workflow transition is checked in both directions at desktop and phone widths: its cover and incoming reveal complete while the global curtain remains idle. No browser page errors were recorded. The full browser suite currently reports 78 passing checks.

The transition does not add a client-side router or block page content on animation libraries. The original 3D identity scene loads on phones and desktops, independently of the curtain. On phones it has a dedicated stage, a capped pixel ratio and a 30 fps render budget. It pauses outside the viewport and retains a dimensional HTML fallback for reduced motion, data saving or unavailable WebGL.
