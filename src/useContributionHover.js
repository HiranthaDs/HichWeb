import { useEffect } from 'react';

const DESKTOP_POINTER = '(min-width: 900px) and (hover: hover) and (pointer: fine)';
const HOVER_PROPERTIES = ['--hover-x', '--hover-y', '--hover-scale', '--hover-rotate'];

function springCoefficients(delta) {
  const frequency = 13;
  const damping = 0.68;
  const decay = frequency * damping;
  const oscillation = frequency * Math.sqrt(1 - damping * damping);
  const envelope = Math.exp(-decay * delta);
  const cosine = Math.cos(oscillation * delta);
  const sine = Math.sin(oscillation * delta) / oscillation;
  return [
    envelope * (cosine + decay * sine),
    envelope * sine,
    -envelope * frequency * frequency * sine,
    envelope * (cosine - decay * sine),
  ];
}

function advanceSpring(cell, axis, target, spring) {
  const offset = cell.values[axis] - target;
  const velocity = cell.velocities[axis];
  cell.values[axis] = target + offset * spring[0] + velocity * spring[1];
  cell.velocities[axis] = offset * spring[2] + velocity * spring[3];
  const tolerance = axis === 2 ? 0.0001 : 0.005;
  if (Math.abs(cell.values[axis] - target) < tolerance && Math.abs(cell.velocities[axis]) < tolerance * 10) {
    cell.values[axis] = target;
    cell.velocities[axis] = 0;
    return false;
  }
  return true;
}

function removeHoverProperties(element) {
  HOVER_PROPERTIES.forEach(property => element.style.removeProperty(property));
}

/** Local desktop hover, independent of the cartoon's colour frames. */
export default function useContributionHover(gridRef, enabled) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.dataset.hoverEnabled = 'false';
    grid.dataset.hoverActive = 'false';
    if (!enabled) return;

    const media = window.matchMedia(DESKTOP_POINTER);
    let disposeInteraction;

    const attach = () => {
      disposeInteraction?.();
      disposeInteraction = undefined;
      if (!media.matches) return;

      const host = grid.closest('.cg-graph-scroll') || grid;
      const cells = Array.from(grid.querySelectorAll('.cg-pixel'), element => ({
        element,
        column: Math.max(0, parseInt(element.style.gridColumn, 10) - 1),
        row: Math.max(0, parseInt(element.style.gridRow, 10) - 1),
        centerX: 0,
        centerY: 0,
        values: [0, 0, 1, 0],
        velocities: [0, 0, 0, 0],
        styled: false,
      }));
      let rect;
      let layoutDirty = true;
      let rectDirty = true;
      let active = false;
      let disposed = false;
      let frame = 0;
      let previous = 0;
      let pointerX = 0;
      let pointerY = 0;
      grid.dataset.hoverEnabled = 'true';

      // Read untransformed grid tracks, not animated cell bounds. This keeps
      // proximity stable while the cartoon and hover run together.
      const measure = () => {
        if (rectDirty || layoutDirty) {
          rect = grid.getBoundingClientRect();
          rectDirty = false;
        }
        if (!layoutDirty) return;
        const style = getComputedStyle(grid);
        const columns = style.gridTemplateColumns.split(' ').map(Number.parseFloat);
        const rows = style.gridTemplateRows.split(' ').map(Number.parseFloat);
        const centers = (tracks, gap, inset) => {
          let position = inset;
          return tracks.map(size => {
            const center = position + size * 0.5;
            position += size + gap;
            return center;
          });
        };
        const x = centers(columns, parseFloat(style.columnGap) || 0, parseFloat(style.paddingLeft) || 0);
        const y = centers(rows, parseFloat(style.rowGap) || 0, parseFloat(style.paddingTop) || 0);
        cells.forEach(cell => {
          cell.centerX = x[cell.column] ?? rect.width * 0.5;
          cell.centerY = y[cell.row] ?? rect.height * 0.5;
        });
        layoutDirty = false;
      };

      const animate = timestamp => {
        frame = 0;
        if (disposed) return;
        measure();
        const delta = previous ? Math.min((timestamp - previous) / 1000, 0.05) : 1 / 60;
        previous = timestamp;
        const spring = springCoefficients(delta);
        const radius = Math.max(75, Math.min(130, rect.width * 0.11));
        const localX = pointerX - rect.left;
        const localY = pointerY - rect.top;
        let settling = false;

        cells.forEach(cell => {
          const dx = localX - cell.centerX;
          const dy = localY - cell.centerY;
          const distance = Math.hypot(dx, dy);
          const proximity = active ? Math.max(0, 1 - distance / radius) : 0;
          const strength = proximity * proximity * (3 - 2 * proximity);
          const targets = [
            (dx / radius) * strength * 2.2,
            -4.5 * strength + (dy / radius) * strength * 0.45,
            1 + strength * 0.13,
            -(dx / radius) * strength * 5,
          ];
          let moving = false;
          for (let axis = 0; axis < 4; axis++) {
            if (advanceSpring(cell, axis, targets[axis], spring)) moving = true;
          }
          settling ||= moving;
          if (!strength && !moving) {
            if (cell.styled) removeHoverProperties(cell.element);
            cell.styled = false;
            return;
          }
          const [x, y, scale, rotate] = cell.values;
          cell.element.style.setProperty('--hover-x', `${x.toFixed(3)}px`);
          cell.element.style.setProperty('--hover-y', `${y.toFixed(3)}px`);
          cell.element.style.setProperty('--hover-scale', scale.toFixed(4));
          cell.element.style.setProperty('--hover-rotate', `${rotate.toFixed(3)}deg`);
          cell.styled = true;
        });

        // A resting mouse needs no animation loop. The next pointer/geometry
        // event wakes it; departing cells keep their soft spring return.
        if (settling) frame = requestAnimationFrame(animate);
        else previous = 0;
      };

      const wake = () => {
        if (!frame && !disposed) frame = requestAnimationFrame(animate);
      };
      const leave = () => {
        active = false;
        grid.dataset.hoverActive = 'false';
        wake();
      };
      const move = event => {
        if (event.pointerType === 'touch') {
          if (active) leave();
          return;
        }
        pointerX = event.clientX;
        pointerY = event.clientY;
        active = true;
        grid.dataset.hoverActive = 'true';
        wake();
      };
      const invalidateRect = () => {
        rectDirty = true;
        if (active || frame) wake();
      };
      const invalidateLayout = () => {
        layoutDirty = true;
        if (active || frame) wake();
      };
      const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidateLayout) : null;
      resizeObserver?.observe(grid);
      host.addEventListener('pointermove', move, { passive: true });
      host.addEventListener('pointerleave', leave, { passive: true });
      host.addEventListener('pointercancel', leave, { passive: true });
      window.addEventListener('scroll', invalidateRect, { passive: true, capture: true });
      window.addEventListener('resize', invalidateLayout, { passive: true });
      window.addEventListener('blur', leave);

      disposeInteraction = () => {
        disposed = true;
        cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerleave', leave);
        host.removeEventListener('pointercancel', leave);
        window.removeEventListener('scroll', invalidateRect, true);
        window.removeEventListener('resize', invalidateLayout);
        window.removeEventListener('blur', leave);
        cells.forEach(cell => removeHoverProperties(cell.element));
        grid.dataset.hoverEnabled = 'false';
        grid.dataset.hoverActive = 'false';
      };
    };

    attach();
    media.addEventListener('change', attach);
    return () => {
      media.removeEventListener('change', attach);
      disposeInteraction?.();
    };
  }, [gridRef, enabled]);
}
