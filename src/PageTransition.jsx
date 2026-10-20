import React, { useEffect, useRef } from 'react';
import { Asterisk } from 'lucide-react';
import { getPageMeta, normalizePath, pagePaths } from './routes.js';
import './page-transition.css';

const STORAGE_KEY = 'hich:page-transition';
const knownPages = new Set(pagePaths);
const COVER_FALLBACK_MS = 650;
const REVEAL_FALLBACK_MS = 800;
const NAVIGATION_RECOVERY_MS = 3200;

// Runs in the prerendered document, before the page paints. The timeout also
// releases the curtain if the application bundle cannot load. Storage is optional.
const arrivalScript = `(function(){try{var k='${STORAGE_KEY}',raw=sessionStorage.getItem(k);sessionStorage.removeItem(k);if(!raw)return;var next=JSON.parse(raw),age=Date.now()-next.at;if(next.url!==location.href||!Number.isFinite(age)||age<0||age>8000||matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.documentElement.setAttribute('data-hich-arriving','');window.__hichArrivalTimeout=setTimeout(function(){document.documentElement.removeAttribute('data-hich-arriving')},1800)}catch(e){}})();`;

/** Native document navigation, with a small branded handoff between pages. */
export default function PageTransition() {
  const curtain = useRef(null);
  const destinationLabel = useRef(null);

  useEffect(() => {
    const overlay = curtain.current;
    const accent = overlay?.querySelector('.hich-transition-accent');
    const sheet = overlay?.querySelector('.hich-transition-sheet');
    const label = destinationLabel.current;
    if (!overlay || !accent || !sheet || !label) return undefined;

    const html = document.documentElement;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let navigationTimer = 0;
    let releaseTimer = 0;
    let arrivalFrame = 0;
    let nextUrl = null;
    let committed = false;
    let markerWritten = false;

    const clearMarker = () => {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Private storage may be unavailable. */ }
      markerWritten = false;
    };
    const clearScheduledWork = () => {
      clearTimeout(navigationTimer);
      clearTimeout(releaseTimer);
      cancelAnimationFrame(arrivalFrame);
      navigationTimer = 0;
      releaseTimer = 0;
      arrivalFrame = 0;
    };
    const reset = ({ preserveMarker = false } = {}) => {
      clearScheduledWork();
      clearTimeout(window.__hichArrivalTimeout);
      html.removeAttribute('data-hich-arriving');
      overlay.dataset.phase = 'idle';
      nextUrl = null;
      committed = false;
      if (!preserveMarker) clearMarker();
    };
    const commitNavigation = () => {
      if (!nextUrl || committed) return;
      const destination = nextUrl;
      committed = true;
      clearTimeout(navigationTimer);
      navigationTimer = 0;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ url: destination, at: Date.now() }));
        markerWritten = true;
      } catch { /* The outgoing transition still works without storage. */ }
      try { window.location.assign(destination); }
      catch { reset(); }
    };

    // In the development client-rendered app the inline script does not execute,
    // so read the same handoff here. The production script consumes it earlier.
    if (!html.hasAttribute('data-hich-arriving')) {
      try {
        const handoff = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
        const age = Date.now() - handoff?.at;
        if (handoff?.url === location.href && Number.isFinite(age) && age >= 0 && age < 8000 && !preference.matches) {
          html.setAttribute('data-hich-arriving', '');
        }
      } catch { /* Invalid or blocked storage should never interrupt navigation. */ }
      clearMarker();
    }
    label.textContent = getPageMeta(location.pathname).name;
    if (html.hasAttribute('data-hich-arriving') && !preference.matches) {
      // Two frames guarantee that the fully covered state is painted before the
      // reveal starts, including in the development client where no inline script ran.
      arrivalFrame = requestAnimationFrame(() => {
        arrivalFrame = requestAnimationFrame(() => {
          arrivalFrame = 0;
          overlay.dataset.phase = 'reveal';
          html.removeAttribute('data-hich-arriving');
          releaseTimer = window.setTimeout(() => reset(), REVEAL_FALLBACK_MS);
        });
      });
    } else reset();

    const onClick = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || preference.matches) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor || anchor.hasAttribute('download') || anchor.hasAttribute('data-no-transition') || anchor.relList.contains('external')) return;
      const target = anchor.getAttribute('target');
      if (target && target !== '_self') return;
      let url;
      try { url = new URL(anchor.href, window.location.href); } catch { return; }
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== window.location.origin) return;
      // Assets, native downloads and unknown URLs keep their standard behavior.
      if (!knownPages.has(normalizePath(url.pathname))) return;
      // Hash links, including the skip link, retain browser scrolling and focus.
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (nextUrl) { event.preventDefault(); return; }
      event.preventDefault();
      reset();
      nextUrl = url.href;
      label.textContent = getPageMeta(url.pathname).name;
      // Native modal dialogs live above every z-index. Close them before drawing
      // the curtain, and let their own `close` handlers release body scroll locks.
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
      overlay.dataset.phase = 'cover';
      // animationend keeps the navigation aligned with the actual rendered frame;
      // the timer is only a fallback for browsers that suppress animation events.
      navigationTimer = window.setTimeout(commitNavigation, COVER_FALLBACK_MS);
      // A cancelled/failed request must not leave the current page inaccessible.
      releaseTimer = window.setTimeout(() => reset(), NAVIGATION_RECOVERY_MS);
    };
    const onAnimationEnd = event => {
      if (event.target === sheet && event.animationName === 'hich-curtain-cover' && overlay.dataset.phase === 'cover') commitNavigation();
      if (event.target === accent && event.animationName === 'hich-curtain-reveal' && overlay.dataset.phase === 'reveal') reset();
    };
    const onPageShow = event => {
      if (event.persisted) reset();
    };
    // Keep the handoff marker during a real navigation. The next document consumes
    // it; clearing it here made arrival reveals depend on pagehide timing.
    const onPageHide = () => reset({ preserveMarker: markerWritten });
    const onEscape = event => {
      if (event.key === 'Escape' && nextUrl && !committed) reset();
    };
    const onPreference = () => {
      if (!preference.matches) return;
      if (nextUrl) commitNavigation();
      reset();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onEscape);
    overlay.addEventListener('animationend', onAnimationEnd);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('pagehide', onPageHide);
    preference.addEventListener('change', onPreference);
    return () => {
      // Unmounting for a native navigation must not consume the incoming handoff.
      reset({ preserveMarker: markerWritten });
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onEscape);
      overlay.removeEventListener('animationend', onAnimationEnd);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('pagehide', onPageHide);
      preference.removeEventListener('change', onPreference);
    };
  }, []);

  return <>
    <script dangerouslySetInnerHTML={{ __html: arrivalScript }} />
    <div className="hich-transition" ref={curtain} data-phase="idle" aria-hidden="true">
      <div className="hich-transition-accent" />
      <div className="hich-transition-sheet">
        <div className="hich-transition-grid" />
        <div className="hich-transition-brand">
          <span className="hich-transition-kicker">IDEAS INTO IMPACT</span>
          <span className="hich-transition-wordmark">{'HICH'.split('').map((letter, i) => <span key={i} style={{ '--letter': i }}>{letter}</span>)}<span className="hich-transition-dot">.</span></span>
          <span className="hich-transition-caption"><span className="hich-transition-route"><small>UP NEXT</small><span ref={destinationLabel}>Design. Build. Grow.</span></span><Asterisk className="hich-transition-spark" size={30} strokeWidth={1.7} aria-hidden="true" /></span>
          <span className="hich-transition-line" />
        </div>
        <span className="hich-transition-foot">A LITTLE EXTRAORDINARY.</span>
      </div>
    </div>
  </>;
}
