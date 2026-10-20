// Network packets arrive unevenly. Pace their text independently of transport,
// and keep the request active until the last visible character is delivered.
export function createTextReveal({ onText, signal, immediate = () => false }) {
  let pending = '';
  let timer = null;
  let waiter = null;
  let closed = false;
  let ending = false;
  const abortReason = () => signal?.reason || new DOMException('Stopped', 'AbortError');
  const settle = () => {
    if (!waiter || pending) return;
    waiter.resolve();
    waiter = null;
  };
  const flush = () => {
    clearTimeout(timer);
    timer = null;
    if (closed || signal?.aborted) return;
    const held = !ending && /[\uD800-\uDBFF]$/.test(pending) ? pending.slice(-1) : '';
    const text = held ? pending.slice(0, -1) : pending;
    pending = held;
    if (text) onText(text);
    settle();
  };
  const tick = () => {
    timer = null;
    if (closed || signal?.aborted) return;
    if (immediate()) { flush(); return; }
    // Catch up with long bursts without delaying a complete answer for minutes.
    const size = Math.max(5, Math.min(36, Math.ceil(pending.length / 70)));
    let end = Math.min(size, pending.length);
    // Never expose half of a UTF-16 surrogate pair, even at a packet boundary.
    if (end < pending.length && /[\uD800-\uDBFF]/.test(pending[end - 1])) end++;
    if (end === pending.length && !ending && /[\uD800-\uDBFF]/.test(pending[end - 1])) end--;
    const text = pending.slice(0, end);
    pending = pending.slice(end);
    if (text) onText(text);
    if (pending && end > 0) timer = setTimeout(tick, 24);
    else settle();
  };
  const abort = () => {
    closed = true;
    clearTimeout(timer);
    pending = '';
    if (waiter) { waiter.reject(abortReason()); waiter = null; }
  };
  signal?.addEventListener('abort', abort, { once: true });
  return {
    push(text) {
      signal?.throwIfAborted();
      if (closed || !text) return;
      pending += text;
      if (immediate()) flush();
      else if (timer === null) timer = setTimeout(tick, 24);
    },
    finish() {
      signal?.throwIfAborted();
      ending = true;
      if (immediate()) flush();
      if (!pending) return Promise.resolve();
      if (timer === null) timer = setTimeout(tick, 24);
      if (!waiter) {
        const promise = new Promise((resolve, reject) => { waiter = { resolve, reject }; });
        waiter.promise = promise;
      }
      return waiter.promise;
    },
    flush,
    dispose() {
      signal?.removeEventListener('abort', abort);
      clearTimeout(timer);
      closed = true;
      pending = '';
      if (waiter) { waiter.resolve(); waiter = null; }
    },
  };
}
