import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, MoveUpRight, Pause, Play, Radio, Sparkles } from 'lucide-react';
import './motion-playground.css';

const MODES = [
  { key: 'flow', name: 'Flow', number: '01', caption: 'A little movement. A different feeling.', description: 'A flowing ribbon that bends and twists as you move.' },
  { key: 'orbit', name: 'Orbit', number: '02', caption: 'A new perspective, with every turn.', description: 'A rotating sphere of fine lines that follows your perspective.' },
  { key: 'wave', name: 'Wave', number: '03', caption: 'Small interactions. Lasting impressions.', description: 'An undulating landscape that responds to your touch.' },
];

const ROWS = 28;
const COLUMNS = 62;

// Solve a damped spring analytically so the same gesture has the same weight
// on both a 60 Hz phone and a high-refresh desktop display.
function springCoefficients(delta, frequency, damping) {
  const decay = frequency * damping;
  const oscillation = frequency * Math.sqrt(1 - damping * damping);
  const envelope = Math.exp(-decay * delta);
  const cosine = Math.cos(oscillation * delta);
  const sine = Math.sin(oscillation * delta) / oscillation;
  return {
    position: envelope * (cosine + decay * sine),
    velocity: envelope * sine,
    acceleration: -envelope * frequency * frequency * sine,
    retention: envelope * (cosine - decay * sine),
  };
}

function advanceSpring(body, key, velocityKey, target, spring) {
  const displacement = body[key] - target;
  const velocity = body[velocityKey];
  body[key] = target + displacement * spring.position + velocity * spring.velocity;
  body[velocityKey] = displacement * spring.acceleration + velocity * spring.retention;
}

function shapePoint(mode, row, column, time) {
  const u = column / (COLUMNS - 1);
  const v = row / (ROWS - 1);
  if (mode === 'orbit') {
    const longitude = u * Math.PI * 2 + time * 0.2;
    const latitude = v * Math.PI;
    return [Math.cos(longitude) * Math.sin(latitude), Math.cos(latitude), Math.sin(longitude) * Math.sin(latitude)];
  }
  if (mode === 'wave') {
    const x = (u - 0.5) * 2.5;
    const z = (v - 0.5) * 2;
    return [x, Math.sin(x * 3.2 + time) * 0.17 + Math.cos(z * 3.3 + x * 1.6 - time * 0.7) * 0.18, z];
  }
  const x = (u - 0.5) * 2.65;
  const ribbon = (v - 0.5) * 1.1;
  const twist = x * 1.8 + time * 0.42;
  return [x, Math.sin(x * 2.4 + time * 0.65) * 0.35 + ribbon * Math.cos(twist), ribbon * Math.sin(twist)];
}

function useMotionField({ canvasRef, stageRef, mode, paused, reduced, rippleRef }) {
  const timeRef = useRef(0);
  const pointsRef = useRef([]);
  const simulationRef = useRef({
    mode: null,
    ripple: 0,
    lastRipple: 0,
    rippleOrigin: { x: 0, y: 0 },
    pointer: { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 },
    camera: { tilt: -0.13, velocity: 0 },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !stage) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let visible = false;
    let previous = 0;
    let disposed = false;
    const simulation = simulationRef.current;
    const pointer = simulation.pointer;
    const camera = simulation.camera;
    let needsStaticShape = simulation.mode !== mode && (paused || reduced);
    simulation.mode = mode;
    if (needsStaticShape) {
      simulation.ripple = 0;
      camera.tilt = mode === 'wave' ? 0.65 : -0.13;
      camera.velocity = 0;
    }

    const draw = (delta = 0) => {
      if (!width || !height) return;
      const moving = !paused && !reduced;
      if (moving) timeRef.current += delta;
      const time = timeRef.current;
      if (rippleRef.current !== simulation.lastRipple) {
        simulation.lastRipple = rippleRef.current;
        if (moving) {
          simulation.ripple = 1;
          simulation.rippleOrigin.x = pointer.x;
          simulation.rippleOrigin.y = pointer.y;
        }
      }
      // A redraw while paused must reproduce the last frame, including a ripple
      // or an unfinished morph. Only an explicit static mode change resets it.
      if (moving && delta > 0) {
        simulation.ripple = Math.max(0, simulation.ripple - delta * 0.52);
        const pointerSpring = springCoefficients(delta, 8.5, 0.68);
        advanceSpring(pointer, 'x', 'vx', pointer.targetX, pointerSpring);
        advanceSpring(pointer, 'y', 'vy', pointer.targetY, pointerSpring);
        advanceSpring(camera, 'tilt', 'velocity', mode === 'wave' ? 0.65 : -0.13, springCoefficients(delta, 7, 0.72));
      }
      const ripple = simulation.ripple;
      context.clearRect(0, 0, width, height);

      const scale = Math.min(width * 0.31, height * 0.38);
      const rotateX = camera.tilt + pointer.y * 0.2;
      const rotateY = -0.15 + pointer.x * 0.35;
      const cosX = Math.cos(rotateX), sinX = Math.sin(rotateX);
      const cosY = Math.cos(rotateY), sinY = Math.sin(rotateY);
      const projected = [];

      for (let row = 0; row < ROWS; row++) {
        const line = [];
        // Neighbouring strands settle at slightly different speeds, letting
        // a change of shape travel through the surface like soft jelly.
        const spring = springCoefficients(delta, 8 + (row / (ROWS - 1)) * 2, 0.6);
        for (let column = 0; column < COLUMNS; column++) {
          const index = row * COLUMNS + column;
          const target = shapePoint(mode, row, column, time);
          let point = pointsRef.current[index];
          if (!point || needsStaticShape) point = pointsRef.current[index] = [...target, 0, 0, 0];
          else if (moving && delta > 0) for (let axis = 0; axis < 3; axis++) advanceSpring(point, axis, axis + 3, target[axis], spring);
          const distance = Math.hypot(point[0] - simulation.rippleOrigin.x, point[1] - simulation.rippleOrigin.y);
          const pointerDistance = Math.hypot(point[0] - pointer.x, point[1] - pointer.y);
          const drag = Math.exp(-pointerDistance * pointerDistance * 2.3) * Math.tanh(pointer.vy * 0.35 + pointer.vx * 0.16) * 0.16;
          const impulse = ripple * ripple * Math.sin(distance * 8 - (1 - ripple) * 15) * 0.18 + drag;
          const x = point[0] * cosY + point[2] * sinY;
          const z = -point[0] * sinY + point[2] * cosY;
          const y = (point[1] + impulse) * cosX - z * sinX;
          const depth = (point[1] + impulse) * sinX + z * cosX;
          const perspective = 3.5 / (3.5 + depth);
          line.push({ x: width * 0.5 + x * scale * perspective, y: height * 0.5 + y * scale * perspective, depth });
        }
        projected.push(line);
      }
      needsStaticShape = false;

      // Draw the quieter back lines first, then the brighter front surface.
      const ordered = projected.map((line, index) => ({ line, index, depth: line.reduce((sum, point) => sum + point.depth, 0) / line.length })).sort((a, b) => b.depth - a.depth);
      ordered.forEach(({ line, index, depth }) => {
        context.beginPath();
        line.forEach((point, column) => { if (!column) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y); });
        const alpha = Math.max(0.15, Math.min(0.86, 0.51 - depth * 0.23));
        context.strokeStyle = index === 13 || index === 14 ? `rgba(255,178,198,${Math.min(1, alpha + 0.25)})` : `rgba(228,239,255,${alpha})`;
        context.lineWidth = index === 13 || index === 14 ? 1.55 : 0.75;
        context.stroke();
        if (index % 3 === 0) {
          context.fillStyle = `rgba(255,255,255,${Math.min(1, alpha + 0.12)})`;
          line.forEach((point, column) => { if (column % 4 === 0) { context.beginPath(); context.arc(point.x, point.y, 1.25, 0, Math.PI * 2); context.fill(); } });
        }
      });
    };

    const animate = timestamp => {
      frame = 0;
      if (disposed || !visible || document.hidden || paused || reduced) return;
      const delta = previous ? Math.min((timestamp - previous) / 1000, 0.04) : 1 / 60;
      previous = timestamp;
      draw(delta);
      frame = requestAnimationFrame(animate);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (visible && !document.hidden) {
        draw();
        if (!paused && !reduced) frame = requestAnimationFrame(animate);
      }
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
      canvas.dataset.ready = 'true';
    };
    const move = event => {
      if (paused || reduced) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      pointer.targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
    };
    const leave = () => { pointer.targetX = 0; pointer.targetY = 0; };
    const touch = event => { move(event); if (!paused && !reduced) rippleRef.current += 1; };
    stage.addEventListener('pointermove', move, { passive: true });
    stage.addEventListener('pointerdown', touch, { passive: true });
    stage.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', sync);
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(canvas);
    if (!resizeObserver) window.addEventListener('resize', resize);
    const intersectionObserver = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.05 }) : null;
    if (intersectionObserver) intersectionObserver.observe(stage);
    else visible = true;
    resize();
    sync();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerdown', touch);
      stage.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, stageRef, mode, paused, reduced, rippleRef]);
}

export default function MotionPlayground() {
  const id = useId();
  const [mode, setMode] = useState('flow');
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const rippleRef = useRef(0);
  const selected = MODES.find(item => item.key === mode);
  const modeIndex = MODES.indexOf(selected);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useMotionField({ canvasRef, stageRef, mode, paused, reduced, rippleRef });

  return <section className="motion-playground" data-motion-state={reduced ? 'reduced' : paused ? 'paused' : 'playing'} aria-labelledby={`${id}-title`}>
    <div className="shell">
      <div className="mp-heading">
        <div><p className="mp-eyebrow"><Sparkles size={13} aria-hidden="true" />THE FEELING IS IN THE DETAILS</p><h2 id={`${id}-title`}>DON'T JUST LOOK.<br /><span>FEEL IT.</span></h2></div>
        <div className="mp-intro"><MoveUpRight size={32} strokeWidth={1.25} aria-hidden="true" /><p>A website should feel as good as it looks. A little curiosity, a little motion, a moment that makes you stay.</p><span>GO ON. PLAY A LITTLE.</span></div>
      </div>

      <div className="mp-workbench">
        <div className="mp-stage" ref={stageRef}>
          <div className="mp-stage-top"><span>HICH / MOTION STUDIES</span><span><i />{reduced ? 'STILL BY PREFERENCE' : paused ? 'TAKE A BREATH' : 'MADE TO MOVE'}</span></div>
          <div className="mp-coordinate mp-coordinate-top" aria-hidden="true">+</div><div className="mp-coordinate mp-coordinate-bottom" aria-hidden="true">+</div>
          <canvas ref={canvasRef} className="mp-canvas" aria-hidden="true" />
          <svg className="mp-static-art" viewBox="0 0 600 400" aria-hidden="true" focusable="false">{Array.from({ length: 18 }, (_, index) => <ellipse key={index} cx="300" cy="200" rx={160 - index * 6} ry="130" fill="none" stroke={index === 9 ? '#ffb2c6' : '#e4efff'} strokeOpacity=".55" strokeWidth="1" transform={`rotate(${index * 7} 300 200)`} />)}</svg>
          <div className="mp-art-description" role="img" aria-label={selected.description} />
          <span className="mp-study-number" key={mode} aria-hidden="true">{selected.number}</span>
          <div className="mp-stage-bottom"><div><span className="mp-study-label" key={mode}>STUDY {selected.number} / {selected.name.toUpperCase()}</span><p aria-live="polite" aria-atomic="true"><span className="mp-caption" key={mode}>{selected.caption}</span></p></div><span className="mp-touch-note"><Radio size={17} aria-hidden="true" />{reduced ? 'Choose a shape below.' : paused ? 'Press play to keep exploring.' : 'Move your cursor. Tap to make waves.'}</span></div>
        </div>

        <div className="mp-controls">
          <div className="mp-mode-controls" role="group" aria-label="Motion study" style={{ '--mp-mode-index': modeIndex }}>{MODES.map(item => <button type="button" key={item.key} aria-pressed={mode === item.key} onClick={() => setMode(item.key)}><span>{item.number}</span>{item.name}<ArrowUpRight size={15} aria-hidden="true" /></button>)}</div>
          <div className="mp-play-controls"><button type="button" className="mp-ripple" onClick={() => { rippleRef.current += 1; }} disabled={paused || reduced}><Radio size={16} aria-hidden="true" /><span>Send a ripple</span></button><button type="button" className="mp-pause" onClick={() => setPaused(value => !value)} disabled={reduced} aria-label={reduced ? 'Animation disabled by reduced motion preference' : paused ? 'Play motion study' : 'Pause motion study'}>{paused || reduced ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}<span>{reduced ? 'Still' : paused ? 'Play' : 'Pause'}</span></button></div>
        </div>
      </div>
      <div className="mp-endnote"><p>Purposeful motion. A more memorable experience.</p><a href="/ui-ux-design.html">Imagine this feeling for your brand<ArrowUpRight size={17} aria-hidden="true" /></a></div>
    </div>
  </section>;
}
