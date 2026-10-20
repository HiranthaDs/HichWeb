import React, { useEffect, useRef } from 'react';
import { getPageMeta, normalizePath, pagePaths } from './routes.js';
import './services-git-transition.css';

const STORAGE_KEY = 'hich:services-git-transition';
const SERVICES_PATH = '/services.html';
const knownPages = new Set(pagePaths);
const COVER_FALLBACK_MS = 950;
const REVEAL_FALLBACK_MS = 950;
const NAVIGATION_RECOVERY_MS = 3200;
const WORKFLOW_STEPS = [
  { hash: '7c31f2a', title: 'Discover', detail: 'The right problem', commit: 'brief.md' },
  { hash: 'b84d0e9', title: 'Design', detail: 'A clear experience', commit: 'system.fig' },
  { hash: 'e29a61f', title: 'Build', detail: 'A resilient product', commit: 'release.js' },
  { hash: 'HEAD', title: 'Launch', detail: 'Ideas into impact', commit: 'ready' },
];

// This runs while a prerendered document is parsed, before React hydrates. It
// keeps the two halves of the transition closed across native page navigation.
const arrivalScript = `(function(){try{var k='${STORAGE_KEY}',raw=sessionStorage.getItem(k);sessionStorage.removeItem(k);if(!raw)return;var next=JSON.parse(raw),age=Date.now()-next.at;if(next.url!==location.href||!Number.isFinite(age)||age<0||age>8000||matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.documentElement.setAttribute('data-hich-services-arriving',next.direction||'enter');window.__hichServicesArrivalTimeout=setTimeout(function(){document.documentElement.removeAttribute('data-hich-services-arriving')},2200)}catch(e){}})();`;

/** A native-navigation handoff reserved for the capabilities overview. */
export default function ServicesGitTransition() {
  const overlay = useRef(null);
  const destinationLabel = useRef(null);

  useEffect(() => {
    const element = overlay.current;
    const commitScan = element?.querySelector('.services-git-transition__scan');
    const bottomGate = element?.querySelector('.services-git-transition__gate--bottom');
    const label = destinationLabel.current;
    if (!element || !commitScan || !bottomGate || !label) return undefined;

    const html = document.documentElement;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let navigationTimer = 0;
    let releaseTimer = 0;
    let arrivalFrame = 0;
    let nextUrl = null;
    let committed = false;
    let markerWritten = false;

    const clearMarker = () => {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage is optional. */ }
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
      clearTimeout(window.__hichServicesArrivalTimeout);
      html.removeAttribute('data-hich-services-arriving');
      element.dataset.phase = 'idle';
      element.dataset.direction = 'enter';
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
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          url: destination,
          at: Date.now(),
          direction: element.dataset.direction,
        }));
        markerWritten = true;
      } catch { /* The outgoing transition remains complete without storage. */ }
      try { window.location.assign(destination); }
      catch { reset(); }
    };

    // Scripts inserted by the development React client do not execute, so use
    // the same marker here. Production consumes it before hydration instead.
    if (!html.hasAttribute('data-hich-services-arriving')) {
      try {
        const handoff = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
        const age = Date.now() - handoff?.at;
        if (handoff?.url === location.href && Number.isFinite(age) && age >= 0 && age < 8000 && !preference.matches) {
          html.setAttribute('data-hich-services-arriving', handoff.direction || 'enter');
        }
      } catch { /* Invalid or blocked storage must not interrupt navigation. */ }
      clearMarker();
    }

    label.textContent = getPageMeta(location.pathname).name;
    if (html.hasAttribute('data-hich-services-arriving') && !preference.matches) {
      element.dataset.direction = html.getAttribute('data-hich-services-arriving') || 'enter';
      arrivalFrame = requestAnimationFrame(() => {
        arrivalFrame = requestAnimationFrame(() => {
          arrivalFrame = 0;
          element.dataset.phase = 'reveal';
          html.removeAttribute('data-hich-services-arriving');
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
      const currentPath = normalizePath(location.pathname);
      const targetPath = normalizePath(url.pathname);
      if (!knownPages.has(targetPath) || (currentPath !== SERVICES_PATH && targetPath !== SERVICES_PATH)) return;
      if (url.pathname === location.pathname && url.search === location.search) return;

      event.preventDefault();
      // PageTransition listens in the bubble phase. Stop this qualifying click
      // here so exactly one visual handoff owns the navigation.
      event.stopPropagation();
      if (nextUrl) return;

      reset();
      nextUrl = url.href;
      element.dataset.direction = targetPath === SERVICES_PATH ? 'enter' : 'exit';
      label.textContent = getPageMeta(targetPath).name;
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
      element.dataset.phase = 'cover';
      // The workflow scan landing owns navigation; the timeout only covers browsers
      // that suppress CSS animation events.
      navigationTimer = window.setTimeout(commitNavigation, COVER_FALLBACK_MS);
      releaseTimer = window.setTimeout(() => reset(), NAVIGATION_RECOVERY_MS);
    };
    const onAnimationEnd = event => {
      if (event.target === commitScan && event.animationName === 'services-git-scan-in' && element.dataset.phase === 'cover') commitNavigation();
      if (event.target === bottomGate && event.animationName === 'services-git-gate-out-left' && element.dataset.phase === 'reveal') reset();
    };
    const onPageShow = event => {
      if (event.persisted) reset();
    };
    const onPageHide = () => reset({ preserveMarker: markerWritten });
    const onEscape = event => {
      if (event.key === 'Escape' && nextUrl && !committed) reset();
    };
    const onPreference = () => {
      if (!preference.matches) return;
      if (nextUrl) commitNavigation();
      reset();
    };

    // Capture lets this route-specific transition opt out before the global
    // page curtain receives the same click in its bubble listener.
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onEscape);
    element.addEventListener('animationend', onAnimationEnd);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('pagehide', onPageHide);
    preference.addEventListener('change', onPreference);
    return () => {
      // A native document navigation unmount must leave its handoff marker for
      // the destination document to consume.
      reset({ preserveMarker: markerWritten });
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onEscape);
      element.removeEventListener('animationend', onAnimationEnd);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('pagehide', onPageHide);
      preference.removeEventListener('change', onPreference);
    };
  }, []);

  return <>
    <script dangerouslySetInnerHTML={{ __html: arrivalScript }} />
    <div className="services-git-transition" ref={overlay} data-phase="idle" data-direction="enter" aria-hidden="true">
      <div className="services-git-transition__gate services-git-transition__gate--top" />
      <div className="services-git-transition__gate services-git-transition__gate--bottom" />
      <div className="services-git-transition__stage">
        <div className="services-git-transition__aura" />
        <section className="services-git-transition__panel">
          <header className="services-git-transition__bar">
            <span className="services-git-transition__identity"><i className="services-git-transition__dots"><b /><b /><b /></i>HICH / GIT WORKFLOW</span>
            <span className="services-git-transition__status"><i />MAIN / SYNCED</span>
          </header>

          <div className="services-git-transition__content">
            <div className="services-git-transition__story">
              <p className="services-git-transition__eyebrow"><span>01</span> WORKING TREE</p>
              <h2>
                <span style={{ '--line': 0 }}>MERGING</span>
                <span className="services-git-transition__outline" style={{ '--line': 1 }}>IDEAS</span>
                <span style={{ '--line': 2 }}>INTO IMPACT.</span>
              </h2>
              <p className="services-git-transition__lede">Strategy, design and engineering.<br /><span>One branch. One shared direction.</span></p>
            </div>

            <div className="services-git-transition__workflow">
              <div className="services-git-transition__terminal">
                <span>$</span><code>git switch capabilities</code><i />
                <small><b />main <em>&rarr;</em> capabilities</small>
              </div>

              <div className="services-git-transition__workflow-meta">
                <span>4 commits ahead</span><span>Ready to merge</span>
              </div>

              <ol className="services-git-transition__path">
                {WORKFLOW_STEPS.map((step, index) => <li key={step.title} style={{ '--step': index, '--reverse-step': WORKFLOW_STEPS.length - index - 1 }}>
                  <i className="services-git-transition__node"><b /></i>
                  <code>{step.hash}</code>
                  <strong>{step.title}</strong>
                  <small>{step.detail}</small>
                  <span>{step.commit}</span>
                </li>)}
              </ol>

              <div className="services-git-transition__complete">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                <span><strong>FAST-FORWARD COMPLETE</strong><small>4 commits <i>&middot;</i> 1 shared direction</small></span>
                <b />
              </div>
            </div>
          </div>

          <footer className="services-git-transition__footer">
            <span>CHECKING OUT</span>
            <strong ref={destinationLabel}>Capabilities</strong>
            <i />
            <small>GIT / MAIN</small>
          </footer>
          <div className="services-git-transition__scan" />
        </section>
      </div>
    </div>
  </>;
}
