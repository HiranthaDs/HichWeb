// A 32-second, wordless pixel film. One contribution cell is one pixel;
// full-size characters retain their proportions on the small and wide stages.
export const CARTOON_ROWS = 13;
export const DESKTOP_COLUMNS = 53;
export const MOBILE_COLUMNS = 25;
export const FRAME_MS = 100;
export const CARTOON_FRAME_COUNT = 320;
export const CARTOON_SCENES = Object.freeze([
  { id: 'wake', start: 0, end: 40 },
  { id: 'chase', start: 40, end: 80 },
  { id: 'push', start: 80, end: 120 },
  { id: 'grow', start: 120, end: 160 },
  { id: 'surprise', start: 160, end: 200 },
  { id: 'launch', start: 200, end: 240 },
  { id: 'stars', start: 240, end: 280 },
  { id: 'home', start: 280, end: 320 },
]);

// Dots leave a cell untouched; zeroes deliberately carve out expressive eyes.
const BUNNY = ['..4.4..', '..4.4..', '.44444.', '4404044', '4433344', '.44344.', '..444..', '.44344.', '.44.44.'];
const BLINK = [...BUNNY.slice(0, 3), '4004004', ...BUNNY.slice(4)];
const STEP = [...BUNNY.slice(0, 8), '..44.44'];
const JUMP = ['.4...4.', '..4.4..', '.44444.', '4404044', '.44344.', '..444..', '4443444', '.44.44.'];
const CROUCH = ['..4.4..', '.44444.', '4404044', '.44344.', '..444..', '.44344.', '444.444'];
const SLEEP = ['.4.....', '.44..4.', '.44444.', '4004004', '.44344.', '.44444.', '4444444'];
const PUSH = ['...4.4.', '..4.4..', '.44444.', '.440444', '.433444', '..44444', '.44344.', '.4444..', '44..44.'];
const SURPRISED = ['.4...4.', '..4.4..', '.44444.', '4404044', '4433344', '.44044.', '..404..', '.44344.', '.44.44.'];
const WAVE = ['..4.4..', '..4.4..', '.44444.', '4404044', '4433344', '444344.', '.4444..', '..434..', '.44.44.'];
const HAPPY = [...BUNNY.slice(0, 5), '.40004.', ...BUNNY.slice(6)];
const BUTTERFLY = ['2...2', '.343.', '2...2'];
const BUTTERFLY_CLOSED = ['..3..', '..4..', '..3..'];
const SEED = ['333', '343', '333'];
const FLOWER = ['..333..', '.34443.', '3442443', '.34443.', '..333..', '...4...', '.3.4.3.', '..343..', '...4...'];
const ROCKET = ['...4...', '..434..', '..434..', '..404..', '..434..', '.44344.', '4443444', '...4...'];
const FRIEND = ['.333.', '33033', '33333', '.3.3.'];
const FRIEND_HAPPY = ['.333.', '30303', '33433', '3...3'];
const CLOUD = ['..111..', '.11111.', '1111111'];
const MINI_FLOWER = ['.2.', '232', '.3.', '.3.'];
const HEART_PATH = [[4, 2], [3, 1], [2, 0], [1, 0], [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 5], [6, 4], [7, 3], [8, 2], [8, 1], [7, 0], [6, 0], [5, 1]];
const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const ease = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => Math.round(a + (b - a) * clamp(t));
const wrap = (n) => ((Math.floor(n) % CARTOON_FRAME_COUNT) + CARTOON_FRAME_COUNT) % CARTOON_FRAME_COUNT;

export function getCartoonScene(frameIndex) {
  return CARTOON_SCENES[Math.floor(wrap(frameIndex) / 40)].id;
}

export function makeCartoonFrame(frameIndex, columns = DESKTOP_COLUMNS) {
  // A held opening/closing pose gives the return journey a quiet seam.
  const wrappedFrame = wrap(frameIndex);
  const frame = wrappedFrame >= 316 ? 0 : wrappedFrame;
  const chapter = Math.floor(frame / 40);
  const beat = frame % 40;
  const wide = columns > 30;
  const pixels = new Uint8Array(columns * CARTOON_ROWS);
  const startX = 1;
  const seedStart = Math.floor(columns * 0.6);
  const seedEnd = columns - 7;
  const rootX = seedEnd + 1;
  const flowerX = rootX - 3;
  const gardenBunnyX = seedEnd - 9;
  const audienceX = seedEnd - 13;
  const butterflyStart = wide ? 11 : 10;
  const cell = (x, y, shade) => {
    if (x >= 0 && x < columns && y >= 0 && y < CARTOON_ROWS) pixels[x * CARTOON_ROWS + y] = shade;
  };
  const sprite = (art, x, y, { mirror = false, shade, clear = true } = {}) => {
    const width = art[0].length;
    if (clear) {
      for (let dx = -1; dx <= width; dx += 1) {
        for (let dy = -1; dy <= art.length; dy += 1) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < columns && py >= 0 && py < CARTOON_ROWS && pixels[px * CARTOON_ROWS + py] < 2) cell(px, py, 0);
        }
      }
    }
    art.forEach((line, dy) => {
      for (let dx = 0; dx < line.length; dx += 1) {
        if (line[dx] !== '.') cell(x + (mirror ? width - dx - 1 : dx), y + dy, shade ?? Number(line[dx]));
      }
    });
  };
  const sparkle = (x, y, level = 3) => sprite(['.1.', '141', '.1.'], x, y, { shade: level, clear: false });
  const butterfly = (x, y, tick = frame) => sprite(Math.floor(tick / 3) % 2 ? BUTTERFLY_CLOSED : BUTTERFLY, clamp(Math.round(x), 0, columns - 5), y);
  const bunny = (art, x, y = 3, mirror = false) => sprite(art, x, y, { mirror });
  const dust = (x, y, tick) => {
    cell(x, y, tick % 4 < 2 ? 2 : 1);
    cell(x - 2, y + 1, 1);
  };
  const littleBlooms = (strength = 3) => {
    const sites = wide ? [3, 15, 26] : [1];
    sites.forEach((x, i) => sprite(MINI_FLOWER, x, 8 + i % 2, { shade: strength, clear: false }));
  };
  const stars = (amount = 4) => {
    const sites = wide ? [[3, 2], [12, 0], [22, 3], [29, 1], [columns - 2, 2]] : [[1, 2], [12, 0], [23, 3]];
    sites.slice(0, amount).forEach(([x, y], i) => {
      cell(x, y, Math.floor(frame / 5 + i) % 3 === 0 ? 3 : 2);
      if (wide && i % 2 === 0) cell(x + 1, y + 1, 1);
    });
  };

  // Restrained meadow detail sits behind the higher contrast performers.
  for (let x = 0; x < columns; x += 1) {
    cell(x, 12, 1);
    if (x % 11 === 3 || x % 11 === 5) cell(x, 11, 1);
    if (x % 17 === 9) { cell(x, 10, 1); cell(x - 1, 11, 1); }
  }
  sprite(CLOUD, columns - 8, 0, { clear: false });
  if (wide) {
    sprite(CLOUD, 3, 1, { clear: false });
    sprite(CLOUD.slice(1), 22, 0, { clear: false });
    sprite(['..11111..', '.1111111.', '111111111'], 12, 10, { clear: false });
    sprite(['.111.', '11111'], 28, 11, { clear: false });
  }

  if (chapter === 0) {
    sprite(SEED, seedStart, 9);
    if (beat < 12) {
      bunny(SLEEP, startX, 5);
      if (beat > 4 && beat < 9) cell(startX + 3, 10, 3);
    } else if (beat < 19 || beat >= 35) bunny(CROUCH, startX, 5);
    else bunny(beat >= 25 && beat < 28 ? BLINK : BUNNY, startX);
    const visit = beat < 12 ? Math.sin(beat / 11 * Math.PI) * 3 : 0;
    butterfly(butterflyStart - visit, 1);
    if (beat >= 19 && beat < 24) { cell(startX, 2, 2); cell(startX + 7, 3, 2); }
  } else if (chapter === 1) {
    const approachX = seedStart - 7;
    const progress = ease(beat / 36);
    const x = mix(startX, approachX, progress);
    sprite(['.1221.'], approachX - 6, 11, { clear: false });
    sprite(SEED, seedStart, 9);
    if (beat < 5 || (beat >= 15 && beat < 19) || (beat >= 31 && beat < 35)) bunny(CROUCH, x, 5);
    else if (beat < 31) {
      // Two quick bounds, with a planted squash between them. The second
      // takes the bunny over the puddle before the final soft landing.
      const firstBound = beat < 15;
      const arc = Math.sin(clamp((beat - (firstBound ? 5 : 19)) / (firstBound ? 9 : 11)) * Math.PI);
      bunny(JUMP, x, 4 - Math.round(arc * (firstBound ? 2 : 3)));
      dust(x - 2, 10, beat);
    } else bunny(BUNNY, x);
    butterfly(mix(butterflyStart, seedStart + 2, progress), beat % 10 < 5 ? 0 : 1);
    if ((beat >= 15 && beat < 18) || (beat >= 31 && beat < 35)) { cell(x - 1, 11, 2); cell(x + 8, 11, 2); }
  } else if (chapter === 2) {
    const blockX = mix(seedStart, seedEnd, ease((beat - 5) / 29));
    const x = blockX - 7;
    for (let dx = -1; dx < 4; dx += 1) cell(seedEnd + dx, 12, 2);
    bunny(beat < 2 ? BUNNY : PUSH, x);
    sprite(SEED, blockX, 9);
    if (beat > 5 && beat < 35) {
      dust(x - 1, 10, beat);
      if (beat % 8 < 4) cell(x + 1, 11, 0);
      cell(blockX + 3, 11, beat % 6 < 3 ? 2 : 1);
    }
    butterfly(mix(seedStart + 2, seedEnd - 5, ease(beat / 39)), 0);
    if (beat >= 34) cell(rootX, 12, 4);
  } else if (chapter === 3) {
    const x = mix(seedEnd - 7, gardenBunnyX, ease(beat / 8));
    for (let dx = -2; dx <= 2; dx += 1) cell(rootX + dx, 12, dx === 0 ? 4 : 2);
    if (beat < 8) sprite(SEED.slice(beat < 4 ? 1 : 2), seedEnd, beat < 4 ? 10 : 11);
    else if (beat < 27) {
      const height = beat < 14 ? 2 : beat < 21 ? 4 : 6;
      for (let h = 0; h < height; h += 1) cell(rootX, 11 - h, 4);
      cell(rootX - 1, 12 - Math.min(height, 3), 3);
      cell(rootX + 1, 11 - Math.min(height, 2), 3);
      if (height >= 4) { cell(rootX - 2, 8, 3); cell(rootX - 1, 9, 3); }
      if (height >= 6) sprite(['.3.', '343', '.3.'], rootX - 1, 4);
    } else sprite(FLOWER, flowerX, 3);
    bunny(beat > 31 && beat < 36 ? HAPPY : BUNNY, x, beat > 31 && beat < 36 ? 2 : 3);
    if (beat >= 7 && beat < 23) {
      sprite(['.33..', '3443.', '34343', '.33.3'], x + 6, 5);
      cell(rootX, 9 + beat % 3, beat % 3 ? 3 : 2);
      if (beat % 4 < 2) cell(rootX + 1, 10, 2);
    }
    if (beat >= 27) littleBlooms(beat < 31 ? 2 : 3);
    const bx = wide ? mix(seedEnd - 5, 12, Math.sin(beat / 39 * Math.PI)) : seedEnd - 5;
    butterfly(bx, 0);
    if (beat >= 27 && beat < 33) sparkle(flowerX - 3, 3, 2);
  } else if (chapter === 4) {
    littleBlooms();
    const x = mix(gardenBunnyX, audienceX, ease((beat - 10) / 13));
    if (beat < 10) sprite(FLOWER, flowerX, 3);
    else if (beat < 18) {
      // Petals tuck inward, becoming the fins of the very same little seed.
      const pod = beat < 14 ? ['..333..', '..434..', '.34443.', '..434..', '...4...', '..343..', '.3.4.3.', '...4...'] : ['...4...', '..434..', '..434..', '..424..', '..434..', '.34343.', '..343..', '...4...'];
      sprite(pod, flowerX, 3);
    } else {
      sprite(ROCKET, flowerX, 3);
      cell(rootX, 6, beat % 8 < 4 ? 0 : 2);
      if (beat >= 29) sprite(beat % 4 < 2 ? ['.3.', '232'] : ['232', '.3.'], rootX - 1, 11);
    }
    bunny(beat >= 10 && beat < 29 ? SURPRISED : beat >= 29 ? WAVE : BUNNY, x);
    if (beat >= 12 && beat < 19) sparkle(flowerX - 3, 1, beat < 16 ? 3 : 2);
    if (beat >= 23 && beat < 33) dust(flowerX - 2, 10, beat);
    butterfly(mix(seedEnd - 5, seedEnd - 10, ease(beat / 39)), 0);
  } else if (chapter === 5) {
    littleBlooms();
    bunny(beat % 10 < 6 ? WAVE : HAPPY, audienceX);
    const lift = ease((beat - 11) / 24);
    const rocketY = 3 - Math.round(lift * 15);
    if (beat < 37) {
      sprite(ROCKET, flowerX, rocketY);
      const flame = beat % 4 < 2 ? ['.4.', '343', '.2.'] : ['343', '.4.', '2.2'];
      sprite(flame, rootX - 1, rocketY + 8, { clear: false });
    }
    if (beat >= 10 && beat < 30) {
      const shade = beat < 17 ? 3 : beat < 24 ? 2 : 1;
      const spread = Math.floor((beat - 10) / 5);
      cell(rootX - 2 - spread, 11, shade);
      cell(rootX + 2 + spread, 11, shade);
      cell(rootX - 3 - spread, 12, shade);
      cell(rootX + 3 + spread, 12, shade);
    }
    if (beat < 17) butterfly(seedEnd - 10, -Math.floor(beat / 6));
    if (beat >= 25) stars(Math.floor((beat - 24) / 3));
    if (beat >= 35) cell(rootX, 1, 4);
  } else if (chapter === 6) {
    littleBlooms(2);
    stars(5);
    const heartX = columns - 11;
    const drawn = Math.min(HEART_PATH.length, Math.floor(beat / 1.4) + 1);
    HEART_PATH.slice(0, drawn).forEach(([dx, dy], i) => cell(heartX + dx, 1 + dy, i === drawn - 1 && beat < 27 ? 4 : beat >= 29 && beat < 34 ? 4 : 3));
    if (beat >= 28 && beat < 36) { cell(heartX + 4, 4, 2); cell(heartX + 4, 5, 2); }
    const hop = beat >= 25 && beat < 35 ? Math.round(Math.sin((beat - 25) / 10 * Math.PI) * 2) : 0;
    bunny(beat >= 21 ? HAPPY : WAVE, audienceX, 3 - hop);
    const friendX = wide ? mix(12, audienceX - 6, ease(beat / 24)) : 0;
    const friendHop = beat >= 26 && beat < 36 ? Math.round(Math.sin((beat - 26) / 10 * Math.PI)) : 0;
    sprite(beat >= 23 ? FRIEND_HAPPY : FRIEND, friendX, 8 - friendHop);
    if (beat >= 32 && beat < 37) sparkle(wide ? 24 : 11, 1, beat % 4 < 2 ? 3 : 2);
  } else {
    const progress = ease(beat / 29);
    const x = mix(audienceX, startX, progress);
    const heartX = columns - 11;
    if (beat < 9) {
      HEART_PATH.forEach(([dx, dy], i) => {
        if (i % 3 >= Math.floor(beat / 3)) cell(heartX + dx, 1 + dy, beat < 4 ? 2 : 1);
      });
    }
    // The last little star drifts down as tomorrow's seed.
    if (beat < 24) {
      const seedX = mix(rootX, seedStart + 1, ease(beat / 23));
      const seedY = mix(1, 10, ease(beat / 23));
      cell(seedX, seedY, 4);
      if (beat > 6 && beat < 20) cell(seedX + 1, seedY - 1, 2);
    } else sprite(SEED, seedStart, 9);
    if (beat < 12) littleBlooms(beat < 5 ? 2 : 1);
    if (beat < 20) {
      const friendX = wide ? mix(audienceX - 6, -5, ease(beat / 19)) : mix(0, -5, ease(beat / 19));
      sprite(FRIEND, friendX, 8, { mirror: true });
    }
    if (beat < 25) {
      const hop = Math.round(Math.sin((beat % 10) / 9 * Math.PI));
      bunny(beat % 10 < 6 ? STEP : BUNNY, x, 3 - hop, true);
    } else if (beat < 30) bunny(BLINK, x);
    else bunny(SLEEP, startX, 5);
    if (beat >= 13) {
      const bx = mix(columns - 5, butterflyStart, ease((beat - 13) / 17));
      butterfly(bx, 1, beat >= 30 ? 0 : frame);
    }
  }
  return pixels;
}
