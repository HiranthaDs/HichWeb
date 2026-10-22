import { useEffect } from 'react';
import './motion.css';
import './work-scroll.css';

const revealSelector = '[data-reveal], .split-heading, .benefit-card, .insight-card, .service-intro, .deliverables, .studio-copy, .article-body > section, .legal-copy > section, .footer-cta, [data-motion="reveal"]';
const depthSelector = '.project-art, [data-motion="depth"]';

/** Progressive motion: every element stays readable without animation scripts. */
export default function useMotion(root) {
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    let cancelled = false, media;

    async function initialize() {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import('gsap'), import('gsap/ScrollTrigger'),
        ]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        media = gsap.matchMedia();
        media.add({ motion: '(prefers-reduced-motion: no-preference)', fine: '(min-width: 900px) and (pointer: fine)' }, match => {
          if (!match.conditions.motion) return;
          let disposed = false, smooth, ticker, refreshFrame;
          const removers = [], revealed = new WeakSet(), depthElements = new Set();
          const select = selector => Array.from(host.querySelectorAll(selector));
          const refresh = () => {
            cancelAnimationFrame(refreshFrame);
            refreshFrame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
          };
          const context = gsap.context(() => {}, host);
          const animate = callback => { if (!disposed) context.add(callback); };
          const reveal = (element, index = 0) => {
            if (revealed.has(element) || element.closest('.demo-paused, [data-motion-paused="true"]')) return;
            revealed.add(element);
            animate(() => gsap.fromTo(element, { y: match.conditions.fine ? 34 : 20, opacity: 0 }, {
              y: 0, opacity: 1, duration: .78, delay: Math.min(index * .065, .2),
              ease: 'power3.out', clearProps: 'transform,opacity', overwrite: 'auto',
            }));
          };

          // Observe visibility instead of pre-hiding the entire document. Long
          // pages, horizontal project rails and newly filtered cards stay usable.
          const visibility = new IntersectionObserver(entries => {
            let index = 0;
            entries.forEach(entry => {
              if (!entry.isIntersecting) return;
              visibility.unobserve(entry.target);
              reveal(entry.target, index++);
            });
          }, { rootMargin: '0px 0px -25px 0px', threshold: .025 });
          const observe = scope => {
            const candidates = [...(scope.matches?.(revealSelector) ? [scope] : []), ...scope.querySelectorAll(revealSelector)];
            candidates.forEach(element => {
              if (!revealed.has(element) && !element.closest('dialog') && !element.parentElement?.closest(revealSelector)) visibility.observe(element);
            });
          };
          observe(host);

          animate(() => {
            const title = select('.hero-title .title-line');
            if (title.length) gsap.fromTo(title, { y: 62, opacity: 0, rotate: 1.5 }, {
              y: 0, rotate: 0, opacity: 1, duration: 1, stagger: .095,
              ease: 'power4.out', clearProps: 'transform,opacity',
            });
            const heroDetails = select('.hero-top, .hero-bottom, .page-description');
            if (heroDetails.length) gsap.fromTo(heroDetails, { y: 16, opacity: 0 }, {
              y: 0, opacity: 1, duration: .75, delay: .12, stagger: .1,
              ease: 'power3.out', clearProps: 'transform,opacity',
            });
            select('.marquee-track').forEach(element => gsap.to(element, {
              xPercent: match.conditions.fine ? -20 : -10, ease: 'none',
              scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'bottom top', scrub: .8 },
            }));
            if (match.conditions.fine && host.querySelector('.intro-statement')) gsap.to(select('.intro-word'), {
              color: '#fff', stagger: .13,
              scrollTrigger: { trigger: host.querySelector('.intro-statement'), start: 'top 82%', end: 'bottom 48%', scrub: .7 },
            });
            if (match.conditions.fine) select('.capability-visual, .studio-graphic').forEach(element => gsap.fromTo(element,
              { y: 25 }, { y: -25, ease: 'none', scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: 1 } },
            ));
          });

          // Existing accessible tabs and dialogs get a brief entrance. Their
          // actual hidden/open state remains owned by the React components.
          const mutations = new MutationObserver(records => {
            records.forEach(record => {
              if (record.type === 'childList') {
                record.addedNodes.forEach(node => { if (node instanceof Element) observe(node); });
                return;
              }
              const element = record.target;
              if (record.attributeName === 'open' && element.open) {
                const targets = element.matches('.menu-dialog')
                  ? element.querySelectorAll('.menu-layout nav a, .menu-layout aside')
                  : element.querySelectorAll('.search-panel, .project-dialog-inner');
                if (targets.length) animate(() => gsap.fromTo(targets, { y: 24, opacity: 0 }, {
                  y: 0, opacity: 1, stagger: .045, duration: .45, ease: 'power3.out',
                  clearProps: 'transform,opacity', overwrite: 'auto',
                }));
              }
              if (record.attributeName === 'hidden' && !element.hidden && element.matches('[role="tabpanel"], .capability-detail')) {
                animate(() => gsap.fromTo(element, { y: 12, opacity: .3 }, {
                  y: 0, opacity: 1, duration: .4, ease: 'power3.out',
                  clearProps: 'transform,opacity', overwrite: 'auto',
                }));
              }
            });
            refresh();
          });
          mutations.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden'] });

          if (match.conditions.fine) {
            // One delegated listener; no cursor replacement, trailing particles,
            // continuous pointer RAF or hover motion on touch screens.
            let activeDepth = null;
            const settle = () => {
              if (!activeDepth) return;
              activeDepth.style.removeProperty('--depth-x');
              activeDepth.style.removeProperty('--depth-y');
              activeDepth = null;
            };
            const pointer = event => {
              if (event.pointerType === 'touch') return;
              const element = event.target instanceof Element ? event.target.closest(depthSelector) : null;
              if (!element || element.closest('.demo-paused, [data-motion-paused="true"]')) { settle(); return; }
              if (element !== activeDepth) settle();
              activeDepth = element;
              depthElements.add(element);
              element.setAttribute('data-depth-active', '');
              const rect = element.getBoundingClientRect();
              if (!rect.width || !rect.height) return;
              element.style.setProperty('--depth-x', `${((event.clientY - rect.top) / rect.height - .5) * -4}deg`);
              element.style.setProperty('--depth-y', `${((event.clientX - rect.left) / rect.width - .5) * 4}deg`);
            };
            host.addEventListener('pointermove', pointer, { passive: true });
            host.addEventListener('pointerleave', settle);
            removers.push(() => { settle(); host.removeEventListener('pointermove', pointer); host.removeEventListener('pointerleave', settle); });

            import('lenis').then(({ default: Lenis }) => {
              if (disposed || cancelled) return;
              smooth = new Lenis({
                duration: .85, smoothWheel: true, anchors: false,
                // Project cards belong to the page scroll. Excluding the whole
                // grid switched wheel gestures to native scrolling mid-motion.
                prevent: node => node.closest?.('dialog, [data-lenis-prevent], textarea, select'),
              });
              smooth.on('scroll', ScrollTrigger.update);
              ticker = time => { if (!document.hidden && !document.querySelector('dialog[open]')) smooth.raf(time * 1000); };
              gsap.ticker.add(ticker);
            }).catch(() => { /* Native scrolling is the complete fallback. */ });
          }

          const restore = event => { if (event.persisted) refresh(); };
          window.addEventListener('pageshow', restore);
          document.fonts?.ready.then(() => { if (!disposed) refresh(); });
          return () => {
            disposed = true;
            visibility.disconnect();
            mutations.disconnect();
            removers.forEach(remove => remove());
            depthElements.forEach(element => {
              element.removeAttribute('data-depth-active');
              element.style.removeProperty('--depth-x');
              element.style.removeProperty('--depth-y');
            });
            cancelAnimationFrame(refreshFrame);
            window.removeEventListener('pageshow', restore);
            if (ticker) gsap.ticker.remove(ticker);
            smooth?.destroy();
            context.revert();
          };
        });
      } catch {
        // Animation is enhancement only: never add an initial hidden CSS state.
        media?.revert();
      }
    }
    initialize();
    return () => { cancelled = true; media?.revert(); };
  }, [root]);
}
