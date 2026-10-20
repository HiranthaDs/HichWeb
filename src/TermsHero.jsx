import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import './terms-hero.css';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const TAU = Math.PI * 2;

function TermsCinema({ paused }) {
  const canvasRef = useRef(null);
  const playbackRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!context) return undefined;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = true;
    let manuallyPaused = false;
    let lastTime = null;
    let elapsed = 1.1;
    let width = 1;
    let height = 1;
    let columns = 54;
    let cycles = 1.8;
    let cells = [];
    let columnWaves = [];
    const pointer = { x: -100, y: -100, targetX: -100, targetY: -100, strength: 0, target: 0 };

    // Two rounded swells drift at different speeds. The grid itself never moves.
    const waveAt = (x, back = false) => {
      const phase = TAU * (x * cycles - elapsed / (back ? 18 : 12)) + (back ? 1.9 : 0);
      return back
        ? 0.39 + Math.sin(phase) * 0.12 + Math.sin(phase * 2 + 0.8) * 0.025
        : 0.61 + Math.sin(phase) * 0.17 + Math.sin(phase * 2 + 0.8) * 0.035;
    };

    const rebuild = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = width < 560 ? 25 : width < 900 ? 38 : 54;
      cycles = clamp(width / 650, 1.05, 2);
      const gap = width < 560 ? 3 : 4;
      const inset = 3;
      const size = (width - inset * 2 - gap * (columns - 1)) / columns;
      const rows = Math.max(2, Math.floor((height - inset * 2 + gap) / (size + gap)));
      const gridWidth = size * columns + gap * (columns - 1);
      const gridHeight = size * rows + gap * (rows - 1);
      const left = (width - gridWidth) / 2;
      const top = (height - gridHeight) / 2;
      columnWaves = Array.from({ length: columns }, (_, column) => ({
        x: (left + column * (size + gap) + size / 2) / width,
        front: 0,
        back: 0,
      }));
      cells = Array.from({ length: columns * rows }, (_, index) => {
        const column = Math.floor(index / rows);
        const row = index % rows;
        const x = left + column * (size + gap);
        const y = top + row * (size + gap);
        const path = new Path2D();
        path.roundRect(x, y, size, size, Math.max(1.5, size * 0.2));
        return {
          column,
          x: x + size / 2,
          y: y + size / 2,
          ny: (y + size / 2) / height,
          path,
        };
      });
      paint();
    };

    const paint = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#ffffff';
      context.strokeStyle = '#ffffff';
      context.lineJoin = 'round';
      context.lineCap = 'round';

      // Smooth cartoon contours bridge the cells, so the wave reads clearly
      // even on a small screen instead of flickering between rows of squares.
      for (const back of [true, false]) {
        const crest = new Path2D();
        const steps = Math.ceil(width / 6);
        for (let step = 0; step <= steps; step += 1) {
          const x = step / steps;
          const y = waveAt(x, back) * height;
          if (step === 0) crest.moveTo(0, y);
          else crest.lineTo(x * width, y);
        }
        const water = new Path2D(crest);
        water.lineTo(width, height);
        water.lineTo(0, height);
        water.closePath();
        context.globalAlpha = back ? 0.035 : 0.065;
        context.fill(water);
        context.globalAlpha = back ? 0.25 : 0.75;
        context.lineWidth = back ? 1.5 : 2.5;
        context.stroke(crest);
      }

      for (const column of columnWaves) {
        column.front = waveAt(column.x);
        column.back = waveAt(column.x, true);
      }
      const hoverRadiusSquared = clamp(width * 0.075, 42, 88) ** 2;
      for (const cell of cells) {
        const wave = columnWaves[cell.column];
        const foam = Math.exp(-(((cell.ny - wave.front) / 0.075) ** 2));
        const swell = Math.exp(-(((cell.ny - wave.back) / 0.095) ** 2));
        const distanceSquared = (cell.x - pointer.x) ** 2 + (cell.y - pointer.y) ** 2;
        const hover = clamp(1 - distanceSquared / hoverRadiusSquared) ** 2 * pointer.strength;
        context.globalAlpha = clamp(0.12 + foam * 0.7 + swell * 0.27 + hover * 0.22, 0, 0.94);
        context.fill(cell.path);
      }
      context.globalAlpha = 1;
    };

    const canRun = () => visible && !manuallyPaused && !motion.matches && document.visibilityState !== 'hidden';
    const animate = timestamp => {
      frame = 0;
      if (!canRun()) { lastTime = null; return; }
      const delta = lastTime === null ? 0 : Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;
      elapsed += delta;
      const easing = 1 - Math.exp(-delta * 9);
      pointer.strength += (pointer.target - pointer.strength) * easing;
      pointer.x += (pointer.targetX - pointer.x) * easing;
      pointer.y += (pointer.targetY - pointer.y) * easing;
      paint();
      frame = requestAnimationFrame(animate);
    };
    const syncPlayback = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
      if (motion.matches) pointer.strength = pointer.target = 0;
      if (canRun()) frame = requestAnimationFrame(animate);
      else paint();
    };
    const movePointer = event => {
      if (event.pointerType === 'touch' || !canRun()) return;
      const bounds = canvas.getBoundingClientRect();
      pointer.targetX = event.clientX - bounds.left;
      pointer.targetY = event.clientY - bounds.top;
      if (pointer.target === 0) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
      }
      pointer.target = 1;
    };
    const leavePointer = () => { pointer.target = 0; };

    playbackRef.current = value => { manuallyPaused = value; syncPlayback(); };
    const resizeObserver = new ResizeObserver(rebuild);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncPlayback(); }, { threshold: 0.03 });
    resizeObserver.observe(canvas);
    intersection.observe(canvas);
    motion.addEventListener('change', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    canvas.addEventListener('pointermove', movePointer, { passive: true });
    canvas.addEventListener('pointerleave', leavePointer);
    canvas.addEventListener('pointercancel', leavePointer);
    rebuild();
    syncPlayback();
    return () => {
      cancelAnimationFrame(frame);
      playbackRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      motion.removeEventListener('change', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
      canvas.removeEventListener('pointermove', movePointer);
      canvas.removeEventListener('pointerleave', leavePointer);
      canvas.removeEventListener('pointercancel', leavePointer);
    };
  }, []);

  useEffect(() => { playbackRef.current?.(paused); }, [paused]);
  return <canvas id="terms-cinema" className="terms-cinema-canvas" ref={canvasRef} aria-hidden="true" />;
}

export default function TermsHero() {
  const [paused, setPaused] = useState(false);
  return <section className="terms-hero" aria-labelledby="terms-title">
    <div className="terms-hero-inner shell">
      <a className="terms-breadcrumb" href="/">HICH <span>/</span> LEGAL</a>
      <div className="terms-hero-copy">
        <h1 id="terms-title">TERMS &amp;<br /><span>CONDITIONS.</span></h1>
        <div>
          <strong>GOOD WORK.<br />CLEAR AGREEMENTS.</strong>
          <p>A shared understanding of our work, your project and the details that help us build together.</p>
        </div>
      </div>
      <div className="terms-cinema-panel">
        <TermsCinema paused={paused} />
        <button type="button" className="terms-cinema-toggle" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play animation' : 'Pause animation'} aria-controls="terms-cinema">
          {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  </section>;
}
