import React, { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Code2, Pause, Play } from 'lucide-react';
import useContributionHover from './useContributionHover.js';
import {
  CARTOON_ROWS, DESKTOP_COLUMNS, MOBILE_COLUMNS, FRAME_MS, STORY_FRAME_COUNT,
  POSTER_FRAME, getStoryScene, makePosterFrame, makeStoryFrame,
} from './contribution-story.js';
import './contribution-garden.css';

// Each responsive grid gets its own precomputed wave film. Playback updates
// only the cells whose activity level changed; React does not rerender frames.
const films = new Map();
function getFilm(columns) {
  if (!films.has(columns)) {
    films.set(columns, Array.from({ length: STORY_FRAME_COUNT }, (_, frame) => makeStoryFrame(frame, columns)));
  }
  return films.get(columns);
}

const PixelBoard = memo(function PixelBoard({ mobile, running, reducedMotion, gridRef }) {
  const columns = mobile ? MOBILE_COLUMNS : DESKTOP_COLUMNS;
  const film = useMemo(() => getFilm(columns), [columns]);
  const poster = useMemo(() => makePosterFrame(columns), [columns]);
  const boardRef = useRef(null);
  const frameRef = useRef(POSTER_FRAME % STORY_FRAME_COUNT);

  useEffect(() => {
    const board = boardRef.current;
    const grid = gridRef.current;
    if (!board || !grid) return undefined;
    const cells = Array.from(grid.children);
    let previous = null;
    const paint = () => {
      const frame = frameRef.current % STORY_FRAME_COUNT;
      const pixels = reducedMotion ? poster : film[frame];
      for (let index = 0; index < pixels.length; index += 1) {
        if (!previous || pixels[index] !== previous[index]) cells[index].className = `cg-pixel cg-level-${pixels[index]}`;
      }
      board.dataset.frame = String(frame);
      board.dataset.timeMs = String(frame * FRAME_MS);
      board.dataset.waveState = reducedMotion ? 'poster' : getStoryScene(frame);
      previous = pixels;
    };
    paint();
    if (!running || reducedMotion) return undefined;
    const timer = window.setInterval(() => {
      frameRef.current = (frameRef.current + 1) % STORY_FRAME_COUNT;
      paint();
    }, FRAME_MS);
    return () => window.clearInterval(timer);
  }, [film, gridRef, poster, reducedMotion, running]);

  const initial = reducedMotion ? poster : film[frameRef.current];
  return <div
    className={`cg-board cg-board-${mobile ? 'mobile' : 'desktop'}`}
    ref={boardRef}
    role="img"
    aria-label={`An illustrative GitHub-style contribution grid showing ${mobile ? 'a mobile-sized' : 'a full-year'} ocean wave made from green activity squares. It is not daily contribution data.`}
    data-duration-ms={STORY_FRAME_COUNT * FRAME_MS}
    data-frame-ms={FRAME_MS}
    data-frame={frameRef.current}
    data-time-ms={frameRef.current * FRAME_MS}
    data-wave-state={reducedMotion ? 'poster' : getStoryScene(frameRef.current)}
    data-grid-layout={mobile ? 'mobile' : 'desktop'}
  >
    <div className="cg-grid" ref={gridRef} aria-hidden="true" data-hover-enabled="false" data-hover-active="false" style={{ '--cg-columns': columns, '--cg-rows': CARTOON_ROWS }}>
      {Array.from(initial, (level, index) => <span key={index} className={`cg-pixel cg-level-${level}`} style={{
        gridColumn: Math.floor(index / CARTOON_ROWS) + 1,
        gridRow: index % CARTOON_ROWS + 1,
      }} />)}
    </div>
  </div>;
});

export default function ContributionGarden({ variant = 'home', id, className = '' }) {
  const generatedId = useId();
  const headingId = `${generatedId}-heading`;
  const graphId = `${generatedId}-graph`;
  const gridRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [mobileLayout, setMobileLayout] = useState(false);

  useEffect(() => {
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const layoutMedia = window.matchMedia('(max-width: 700px)');
    const updateMotion = () => setReducedMotion(motionMedia.matches);
    const updateLayout = () => setMobileLayout(layoutMedia.matches);
    const updateVisibility = () => setDocumentVisible(document.visibilityState !== 'hidden');
    updateMotion();
    updateLayout();
    updateVisibility();
    motionMedia.addEventListener('change', updateMotion);
    layoutMedia.addEventListener('change', updateLayout);
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { threshold: 0.12 }) : null;
    if (observer && gridRef.current) observer.observe(gridRef.current);
    else setVisible(true);
    return () => {
      motionMedia.removeEventListener('change', updateMotion);
      layoutMedia.removeEventListener('change', updateLayout);
      document.removeEventListener('visibilitychange', updateVisibility);
      observer?.disconnect();
    };
  }, []);

  const running = visible && documentVisible && !paused && !reducedMotion;
  useContributionHover(gridRef, running && !mobileLayout);

  return <section
    id={id}
    className={`contribution-garden shell cg-${variant} ${className}`}
    aria-labelledby={headingId}
    data-running={running ? 'true' : 'false'}
    data-reduced-motion={reducedMotion ? 'true' : 'false'}
    data-scene="ocean-waves"
  >
    <div className="cg-intro">
      <div>
        <p className="cg-eyebrow"><span><Code2 size={14} aria-hidden="true" /></span> THE PEOPLE BEHIND THE PIXELS</p>
        <h2 id={headingId}>SMALL COMMITS.<br /><span>BIG POSSIBILITIES.</span></h2>
      </div>
      <div className="cg-intro-copy">
        <p>Good digital work grows one thoughtful detail at a time. Meet the tools, experiments and everyday momentum behind HICH.</p>
        <a href="/technology-stack.html">Explore our technology <ArrowUpRight size={18} aria-hidden="true" /></a>
      </div>
    </div>

    <div className="cg-panel">
      <div className="cg-panel-top">
        <span className="cg-window-dots" aria-hidden="true"><i /><i /><i /></span><span>HICH / THE BUILD LOG</span>
        <span className="cg-status"><i aria-hidden="true" /> {reducedMotion ? 'MOTION OFF' : paused ? 'PAUSED' : 'STUDIO IN MOTION'}</span>
        <button type="button" className="cg-play-toggle" onClick={() => setPaused(value => !value)} disabled={reducedMotion} aria-label={reducedMotion ? 'Automatic animation is off because you prefer reduced motion' : paused ? 'Play animation' : 'Pause animation'} aria-controls={graphId}>
          {paused && !reducedMotion ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        </button>
      </div>
      <div className="cg-stat-row">
        <h3><strong>4,882</strong><span>contributions<br />in the last year</span></h3>
        <p>A thousand little decisions.<br /><span>One connected experience.</span></p>
      </div>

      <div className="cg-graph-scroll" id={graphId}>
        <PixelBoard mobile={mobileLayout} running={running} reducedMotion={reducedMotion} gridRef={gridRef} />
      </div>
      <div className="cg-graph-foot"><p>Illustrative activity pattern <span>&middot;</span> Studio-reported total</p><div className="cg-legend" aria-label="Activity colour scale, from less to more"><span>Less</span>{[0, 1, 2, 3, 4].map(level => <i className={`cg-level-${level}`} key={level} aria-hidden="true" />)}<span>More</span></div></div>
      <div className="cg-panel-bottom"><span>IDEAS &rarr; EXPERIMENTS &rarr; EXPERIENCES</span><span>THE TOOLS BEHIND THE PIXELS.</span></div>
    </div>
  </section>;
}
