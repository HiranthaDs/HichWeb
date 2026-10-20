// Shared SSE decoder: UTF-8 and event boundaries may both span network chunks.
export async function consumeEventStream(body, onEvent, signal) {
  if (!body) throw new Error('The assistant returned an empty response. Please try again.');
  signal?.throwIfAborted();
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;
  const abort = () => { reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  const dispatch = block => {
    const data = block.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!data || data === '[DONE]') return;
    signal?.throwIfAborted();
    let event;
    try { event = JSON.parse(data); } catch { throw new Error('The assistant response could not be read. Please try again.'); }
    if (onEvent(event) === false) finished = true;
  };
  try {
    while (!finished) {
      signal?.throwIfAborted();
      const { value, done } = await reader.read();
      signal?.throwIfAborted();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let boundary;
      while (!finished && (boundary = /\r?\n\r?\n/.exec(buffer))) {
        dispatch(buffer.slice(0, boundary.index));
        buffer = buffer.slice(boundary.index + boundary[0].length);
      }
      if (buffer.length > 200000) throw new Error('The assistant response exceeded the supported size.');
      if (done) { if (!finished && buffer.trim()) dispatch(buffer); break; }
    }
  } finally {
    signal?.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
