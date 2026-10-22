// Desktop mirrors a full GitHub contribution year. Phones receive a dedicated
// recent-activity view with fewer weeks and larger, touch-friendly cells.
export const GRID_ROWS = 7;
export const CARTOON_ROWS = GRID_ROWS;
export const DESKTOP_COLUMNS = 53;
export const MOBILE_COLUMNS = 20;
export const FRAME_MS = 100;
export const STORY_DURATION_MS = 12_000;
export const STORY_FRAME_COUNT = STORY_DURATION_MS / FRAME_MS;
export const POSTER_FRAME = 28;
export const STORY_SCENES = Object.freeze([
  { id: 'ocean-wave', start: 0, end: STORY_DURATION_MS },
]);

const wrap = frame => ((Math.floor(frame) % STORY_FRAME_COUNT) + STORY_FRAME_COUNT) % STORY_FRAME_COUNT;

export function getStoryScene() {
  return STORY_SCENES[0].id;
}

// A calm contribution-history texture sits behind the wave. It is deterministic
// so the same screen size always produces the same graph.
export function makeActivityBase(columns = DESKTOP_COLUMNS) {
  const pixels = new Uint8Array(columns * GRID_ROWS);
  const mobileSeed = columns === MOBILE_COLUMNS ? 29 : 11;
  for (let x = 0; x < columns; x += 1) {
    for (let y = 0; y < GRID_ROWS; y += 1) {
      const hash = (x * 41 + y * 67 + x * y * 17 + mobileSeed) % 101;
      pixels[x * GRID_ROWS + y] = hash > 91 ? 2 : hash > 72 ? 1 : 0;
    }
  }
  return pixels;
}

// Two rolling swells are drawn directly into the contribution cells. The
// leading edge is bright foam; deeper cells use denser GitHub green levels.
export function makeStoryFrame(frameIndex, columns = DESKTOP_COLUMNS) {
  const frame = wrap(frameIndex);
  const pixels = makeActivityBase(columns);
  const phase = frame / STORY_FRAME_COUNT * Math.PI * 2;
  const scale = DESKTOP_COLUMNS / columns;

  for (let x = 0; x < columns; x += 1) {
    const position = x * scale;
    const primary = Math.sin(position * 0.34 - phase) * 1.05;
    const secondary = Math.sin(position * 0.16 + phase * 0.72) * 0.48;
    const surface = 3.1 + primary + secondary;

    for (let y = 0; y < GRID_ROWS; y += 1) {
      const distance = y - surface;
      let level;
      if (Math.abs(distance) < 0.62) level = 4;
      else if (distance > 0) level = distance > 2.15 ? 2 : 3;
      else if (distance > -1.25) level = 2;
      else continue;

      // Fine variation keeps the water organic while preserving the wave.
      const shimmer = (x * 13 + y * 19 + frame * 3) % 17;
      if (level === 3 && shimmer < 3) level = 4;
      if (level === 2 && shimmer < 4) level = 1;
      pixels[x * GRID_ROWS + y] = level;
    }
  }
  return pixels;
}

export function makePosterFrame(columns = DESKTOP_COLUMNS) {
  return makeStoryFrame(POSTER_FRAME, columns);
}
