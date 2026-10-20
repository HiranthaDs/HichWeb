import { chooseAssistantEngine, createGuideReply } from './assistant-knowledge.js';
import { consumeEventStream } from './chat-stream.js';
import { cleanContactActions, getContactActions } from './assistant-actions.js';
import { createTextReveal } from './chat-reveal.js';

async function streamGuide({ mode, messages, signal, onEvent }) {
  signal.throwIfAborted();
  onEvent({ type: 'mode', mode: 'guide' });
  const reply = createGuideReply({ mode, messages });
  onEvent({ type: 'delta', text: reply.text });
  signal.throwIfAborted();
  onEvent({ type: 'sources', sources: reply.sources });
  onEvent({ type: 'actions', actions: reply.actions });
  onEvent({ type: 'done' });
}

export async function streamAssistantReply({ mode = 'site', messages, signal, onEvent }) {
  let content = '';
  let sources = [];
  let actions = null;
  const reveal = createTextReveal({
    signal,
    onText: text => onEvent({ type: 'delta', text }),
    immediate: () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || globalThis.document?.hidden,
  });
  try {
    await requestAssistantReply({ mode, messages, signal, onEvent(event) {
      if (event.type === 'delta') { content += event.text; reveal.push(event.text); }
      else if (event.type === 'sources') sources = event.sources;
      else if (event.type === 'actions') actions = cleanContactActions(event.actions);
      else if (event.type !== 'done') onEvent(event);
    } });
    await reveal.finish();
    signal?.throwIfAborted();
    onEvent({ type: 'sources', sources });
    onEvent({ type: 'actions', actions: actions ?? getContactActions({ messages, content }) });
    onEvent({ type: 'done' });
  } catch (error) {
    // Preserve received partial text on connection failure. Explicit stop discards
    // buffered, undisplayed text so nothing continues typing after cancellation.
    if (!signal?.aborted) reveal.flush();
    throw error;
  } finally { reveal.dispose(); }
}

async function requestAssistantReply({ mode = 'site', messages, signal, onEvent }) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 50000);
  const requestSignal = controller.signal;
  const localSignal = signal || new AbortController().signal;
  try {
    requestSignal.throwIfAborted();
    const history = messages.filter(message => ['user', 'assistant'].includes(message.role) && typeof message.content === 'string' && message.content.trim()).slice(-16).map(({ role, content }) => ({ role, content: content.slice(0, 6000) }));
    let historyLength = history.reduce((sum, message) => sum + message.content.length, 0);
    while (historyLength > 22000 && history.length > 1) historyLength -= history.shift().content.length;
    const encoder = new TextEncoder();
    while (history.length > 1 && encoder.encode(JSON.stringify({ mode, messages: history })).byteLength > 44000) history.shift();
    // Start retained context with a user turn, while always retaining the latest question.
    while (history.length > 1 && history[0].role !== 'user') history.shift();
    // Known HICH questions never depend on Netlify or consume Gemini tokens.
    // Only complex, grounded synthesis reaches the serverless function.
    if (chooseAssistantEngine({ mode, messages: history }).engine === 'guide') return await streamGuide({ mode, messages: history, signal: localSignal, onEvent });
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ mode, messages: history }), signal: requestSignal });
    const type = response.headers.get('content-type') || '';
    if ([404, 405, 501].includes(response.status) || (response.ok && type.includes('text/html'))) {
      await response.body?.cancel();
      return await streamGuide({ mode, messages: history, signal: requestSignal, onEvent });
    }
    if (type.includes('application/json')) {
      const payload = await response.json();
      requestSignal.throwIfAborted();
      if (response.ok && payload.mode === 'guide') return await streamGuide({ mode, messages: history, signal: requestSignal, onEvent });
      return await streamGuide({ mode, messages: history, signal: localSignal, onEvent });
    }
    if (!response.ok || !type.includes('text/event-stream')) {
      await response.body?.cancel();
      return await streamGuide({ mode, messages: history, signal: localSignal, onEvent });
    }
    let completed = false;
    let receivedText = false;
    await consumeEventStream(response.body, event => {
      if (event.type === 'error') throw new Error(event.message || 'The reply was interrupted. Please try again.');
      if (event.type === 'mode' && ['ai', 'guide'].includes(event.mode)) onEvent(event);
      if (event.type === 'delta' && typeof event.text === 'string') { receivedText ||= Boolean(event.text); onEvent(event); }
      if (event.type === 'sources' && Array.isArray(event.sources)) onEvent({ type: 'sources', sources: event.sources.filter(source => typeof source.title === 'string' && /^\/(?!\/)/.test(source.href)).slice(0, 4) });
      if (event.type === 'actions' && Array.isArray(event.actions)) onEvent({ type: 'actions', actions: cleanContactActions(event.actions) });
      if (event.type === 'done') { completed = true; onEvent(event); return false; }
    }, requestSignal);
    if (!completed || !receivedText) throw new Error('The reply ended before it was complete. Please try again.');
  } catch (error) {
    if (signal?.aborted) throw signal.reason || new DOMException('Stopped', 'AbortError');
    if (timedOut || error instanceof TypeError) return await streamGuide({ mode, messages, signal: localSignal, onEvent });
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
