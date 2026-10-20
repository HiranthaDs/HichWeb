import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Snowflake } from 'lucide-react';
import './seasonal-snow.css';

const PREFERENCE_KEY = 'hich:seasonal-snow';
const monthFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Colombo',
  month: 'numeric',
});

export function isDecemberInColombo(date = new Date()) {
  return monthFormatter.format(date) === '12';
}

function makeFlake(width, height, enterFromTop = false) {
  const depth = Math.random();
  return {
    x: Math.random() * width,
    y: enterFromTop ? -14 - Math.random() * 36 : Math.random() * height,
    depth,
    radius: .8 + depth * 2.5,
    speed: 12 + depth * 32,
    sway: 6 + Math.random() * 15,
    phase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - .5) * .6,
    crystal: depth > .75 && Math.random() > .6,
  };
}

function SnowCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let flakes = [];
    let frame = 0;
    let previousTime = 0;
    let elapsed = 0;
    let active = true;

    const resize = () => {
      const oldWidth = width;
      const oldHeight = height;
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.max(28, Math.min(100, Math.round(width * height / 13000)));
      flakes = flakes.slice(0, count).map(flake => ({
        ...flake,
        x: oldWidth ? flake.x / oldWidth * width : flake.x,
        y: oldHeight ? flake.y / oldHeight * height : flake.y,
      }));
      while (flakes.length < count) flakes.push(makeFlake(width, height));
    };

    const paint = time => {
      if (!active || document.hidden) return;
      // A background tab or suspended device must never create a sudden snow rush.
      const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
      previousTime = time;
      elapsed += delta;
      context.clearRect(0, 0, width, height);
      const breeze = Math.sin(elapsed * .19) * 4;
      const appearance = Math.min(elapsed / 1.4, 1);

      for (let index = 0; index < flakes.length; index += 1) {
        let flake = flakes[index];
        flake.y += flake.speed * delta;
        flake.x += (breeze + Math.sin(elapsed * .7 + flake.phase) * flake.sway) * delta;
        flake.rotation += flake.spin * delta;
        if (flake.y > height + 15) {
          flake = makeFlake(width, height, true);
          flakes[index] = flake;
        }
        if (flake.x < -15) flake.x = width + 15;
        if (flake.x > width + 15) flake.x = -15;

        context.globalAlpha = (.35 + flake.depth * .45) * appearance;
        context.save();
        context.translate(flake.x, flake.y);
        context.rotate(flake.rotation);

        if (flake.crystal) {
          const size = flake.radius * 1.55;
          context.beginPath();
          for (let arm = 0; arm < 6; arm += 1) {
            const angle = arm * Math.PI / 3;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            context.moveTo(0, 0);
            context.lineTo(cos * size, sin * size);
            for (const direction of [-1, 1]) {
              const branch = angle + direction * .8;
              context.moveTo(cos * size * .57, sin * size * .57);
              context.lineTo(
                cos * size * .57 + Math.cos(branch) * size * .32,
                sin * size * .57 + Math.sin(branch) * size * .32,
              );
            }
          }
          // An icy outline keeps flakes legible across the site's light sections.
          context.strokeStyle = 'rgba(111, 151, 183, .5)';
          context.lineWidth = 2;
          context.stroke();
          context.strokeStyle = '#f7fcff';
          context.lineWidth = .8;
          context.stroke();
        } else {
          context.beginPath();
          context.arc(0, 0, flake.radius, 0, Math.PI * 2);
          context.fillStyle = '#f4fbff';
          context.fill();
          context.strokeStyle = 'rgba(106, 149, 185, .45)';
          context.lineWidth = .75;
          context.stroke();
        }

        context.restore();
      }
      frame = window.requestAnimationFrame(paint);
    };

    const visibilityChanged = () => {
      window.cancelAnimationFrame(frame);
      previousTime = 0;
      if (!document.hidden) frame = window.requestAnimationFrame(paint);
    };

    resize();
    visibilityChanged();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibilityChanged);
      context.clearRect(0, 0, width, height);
    };
  }, []);

  return <canvas ref={canvasRef} className="seasonal-snow-canvas" aria-hidden="true" />;
}

export default function SeasonalSnow() {
  // Server and first client render both stay empty, regardless of build date.
  const [december, setDecember] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(preference.matches);
    const updateMonth = () => setDecember(isDecemberInColombo());
    updateMotion();
    updateMonth();
    try {
      setPaused(window.sessionStorage.getItem(PREFERENCE_KEY) === 'paused');
    } catch {
      // Private browsing and disabled storage still permit an in-memory toggle.
    }
    preference.addEventListener('change', updateMotion);
    // Also handle December starting/ending while a visitor leaves the site open.
    const monthTimer = window.setInterval(updateMonth, 60_000);
    document.addEventListener('visibilitychange', updateMonth);
    return () => {
      preference.removeEventListener('change', updateMotion);
      window.clearInterval(monthTimer);
      document.removeEventListener('visibilitychange', updateMonth);
    };
  }, []);

  const toggleSnow = () => {
    const nextPaused = !paused;
    setPaused(nextPaused);
    try {
      window.sessionStorage.setItem(PREFERENCE_KEY, nextPaused ? 'paused' : 'playing');
    } catch {
      // The visitor can still pause for this page without storage access.
    }
  };

  if (!december || reducedMotion) return null;

  return <>
    {!paused && <SnowCanvas />}
    <button
      type="button"
      className="seasonal-snow-toggle"
      onClick={toggleSnow}
      aria-label={paused ? 'Resume December snowfall' : 'Pause December snowfall'}
      title={paused ? 'Resume December snowfall' : 'Pause December snowfall'}
    >
      <Snowflake size={15} aria-hidden="true" />
      <span>December snow</span>
      {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
    </button>
  </>;
}
