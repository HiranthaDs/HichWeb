import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Copy, CornerDownLeft, Mail, Phone, Plus, RotateCcw, Sparkles, Square, X } from 'lucide-react';
import { streamAssistantReply } from './chat-client.js';
import { cleanContactActions, getContactActions } from './assistant-actions.js';
import './assistant-chat.css';

const MAX_MESSAGES = 32;
const MAX_INPUT = 2000;
const STARTERS = {
  site: ['How do I start a project?', 'What is your WhatsApp number?', 'Is HICH a registered company?'],
  terms: ['Explain the terms in plain English.', 'What should I check before starting a project?', 'How do project agreements work?'],
};

function safeHref(value) {
  if (typeof value !== 'string') return null;
  const href = value.trim();
  if (/[\u0000-\u001f\u007f]/.test(href)) return null;
  if (/^tel:\+?[\d(). -]+$/i.test(href)) return href;
  return /^(https?:\/\/|mailto:|\/(?!\/)|\.{1,2}\/|#)/i.test(href) ? href : null;
}

function Link({ href, children, ...props }) {
  const url = safeHref(href);
  if (!url) return <span>{children}</span>;
  const external = /^https?:\/\//i.test(url);
  return <a href={url} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...props}>{children}</a>;
}

function inlineMarkdown(text, pending = false) {
  if (pending) {
    const dangling = text.match(/\[([^\]\n]+)\]\([^\n)]*$|\[([^\]\n]*)$/);
    if (dangling) {
      const prefix = text.slice(0, dangling.index);
      // Keep a link's readable label while its URL arrives. Never change code,
      // escaped brackets, or the saved/final response.
      if (!/[\\!]$/.test(prefix) && !dangling[0].includes('`') && (prefix.match(/`/g) || []).length % 2 === 0) text = prefix + (dangling[1] ?? dangling[2]);
    }
  }
  return text.split(/(\[[^\]\n]+\]\([^\s)]+\)|`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <Link key={index} href={link[2]}>{link[1]}</Link>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

// Render a small, safe Markdown vocabulary. Model output is never treated as HTML.
function Markdown({ content, streaming = false }) {
  const lines = content.split('\n');
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (/^\s*```/.test(line)) {
      const code = [];
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index])) code.push(lines[index++]);
      index += 1;
      blocks.push(<pre key={blocks.length}><code>{code.join('\n')}</code></pre>);
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      blocks.push(<h4 key={blocks.length}>{inlineMarkdown(heading[1], streaming && index === lines.length - 1)}</h4>);
      index += 1;
      continue;
    }
    const list = line.match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);
    if (list) {
      const ordered = Boolean(list[2]);
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);
        if (!item || Boolean(item[2]) !== ordered) break;
        items.push(<li key={items.length}>{inlineMarkdown(item[3], streaming && index === lines.length - 1)}</li>);
        index += 1;
      }
      blocks.push(ordered ? <ol key={blocks.length} start={Number(list[2])}>{items}</ol> : <ul key={blocks.length}>{items}</ul>);
      continue;
    }
    if (/^>\s?/.test(line)) {
      blocks.push(<blockquote key={blocks.length}>{inlineMarkdown(line.replace(/^>\s?/, ''), streaming && index === lines.length - 1)}</blockquote>);
      index += 1;
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(\s*```|#{1,6}\s|\s*[-*+]\s|\s*\d+[.)]\s|>\s?)/.test(lines[index])) paragraph.push(lines[index++]);
    blocks.push(<p key={blocks.length}>{paragraph.map((part, partIndex) => <React.Fragment key={partIndex}>{partIndex > 0 && <br />}{inlineMarkdown(part, streaming && index === lines.length && partIndex === paragraph.length - 1)}</React.Fragment>)}</p>);
  }
  if (streaming && blocks.length) {
    const cursor = <span className="assistant-chat-stream-cursor" aria-hidden="true" />;
    const last = blocks.at(-1);
    if (last.type === 'ul' || last.type === 'ol') {
      const items = [...last.props.children];
      const item = items.at(-1);
      items[items.length - 1] = React.cloneElement(item, {}, item.props.children, cursor);
      blocks[blocks.length - 1] = React.cloneElement(last, {}, items);
    } else if (last.type === 'pre') {
      const code = last.props.children;
      blocks[blocks.length - 1] = React.cloneElement(last, {}, React.cloneElement(code, {}, code.props.children, cursor));
    } else blocks[blocks.length - 1] = React.cloneElement(last, {}, last.props.children, cursor);
  }
  return <div className="assistant-chat-markdown" data-streaming={streaming ? 'true' : undefined}>{blocks}</div>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.47 0 .11 5.36.1 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.25-1.64a11.93 11.93 0 0 0 5.8 1.48h.01C18.65 23.84 24 18.48 24 11.89c0-3.18-1.24-6.17-3.48-8.41Zm-8.46 18.34a9.91 9.91 0 0 1-5.05-1.38l-.36-.22-3.71.97.99-3.61-.24-.37a9.88 9.88 0 0 1-1.51-5.26c0-5.48 4.46-9.94 9.95-9.94a9.86 9.86 0 0 1 7.03 2.92 9.87 9.87 0 0 1 2.91 7.04c0 5.48-4.46 9.94-10.01 9.85Zm5.46-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.21 3.08c.15.2 2.1 3.21 5.09 4.5.71.3 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" /></svg>;
}

function ContactCards({ actions }) {
  const contacts = cleanContactActions(actions);
  if (!contacts.length) return null;
  return <div className="assistant-chat-contacts" role="group" aria-label="Contact HICH">
    {contacts.map(action => <Link className="assistant-chat-contact-card" key={action.id} href={action.href} data-contact-action={action.id}>
      <span className="assistant-chat-contact-icon">{action.id === 'whatsapp' ? <WhatsAppIcon /> : action.id === 'call' ? <Phone size={20} strokeWidth={1.7} aria-hidden="true" /> : <Mail size={20} strokeWidth={1.7} aria-hidden="true" />}</span>
      <span className="assistant-chat-contact-copy"><span className="assistant-chat-contact-label">{action.label}</span><strong>{action.value}</strong><span className="assistant-chat-contact-description">{action.description}</span></span>
      <ArrowUpRight className="assistant-chat-contact-arrow" size={17} aria-hidden="true" />
    </Link>)}
  </div>;
}

function cleanSources(sources) {
  if (!Array.isArray(sources)) return [];
  return sources.filter(source => source && typeof source.title === 'string' && safeHref(source.href)).slice(0, 6).map(source => ({ title: source.title.slice(0, 160), href: source.href }));
}

function storedMessages(messages) {
  return messages.filter(message => message.content.trim()).slice(-MAX_MESSAGES).map(message => ({
    id: message.id, role: message.role, content: message.content.slice(0, 16000),
    ...(message.role === 'assistant' ? { engine: message.engine === 'ai' ? 'ai' : 'guide' } : {}),
    ...(message.role === 'assistant' && !message.stopped && !message.failed && message.actions?.length ? { actions: cleanContactActions(message.actions) } : {}),
    ...(message.sources?.length ? { sources: cleanSources(message.sources) } : {}),
    ...(message.stopped ? { stopped: true } : {}),
    ...(message.failed ? { failed: true } : {}),
  }));
}

function readConversation(key) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!saved || !Array.isArray(saved.messages)) return { messages: [], engine: 'guide' };
    const messages = saved.messages.filter(message => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string').slice(-MAX_MESSAGES).map((message, index) => ({
      id: `restored-${index}`, role: message.role, content: message.content.slice(0, 16000), sources: cleanSources(message.sources), stopped: Boolean(message.stopped), failed: Boolean(message.failed), engine: message.engine === 'ai' ? 'ai' : 'guide', actions: cleanContactActions(message.actions),
    }));
    for (const [index, message] of messages.entries()) {
      if (message.role !== 'assistant' || message.stopped || message.failed) { message.actions = []; continue; }
      if (!message.actions.length) message.actions = getContactActions({ messages: messages.slice(0, index), content: message.content });
    }
    return { messages, engine: saved.engine === 'ai' ? 'ai' : 'guide' };
  } catch { return { messages: [], engine: 'guide' }; }
}

function followUps(mode, content) {
  if (mode === 'terms') {
    if (/payment|deposit|invoice/i.test(content)) return ['What should I confirm before paying?', 'How can I ask HICH about my agreement?'];
    if (/source code|ownership|intellectual/i.test(content)) return ['What should my agreement include?', 'Can you explain that more simply?'];
    return ['Can you explain that more simply?', 'What should I confirm with HICH?'];
  }
  if (/registered|registration|company details/i.test(content)) return ['How can I contact your team?', 'How do I start a project?'];
  if (/whatsapp|wa\.me/i.test(content)) return ['What should I include in my project brief?', 'Can I call your team instead?'];
  if (/\+94|phone|call the|telephone/i.test(content)) return ['Can I message you on WhatsApp?', 'Help me plan my project.'];
  if (/email|info@/i.test(content)) return ['What should I include in my project brief?', 'What is your WhatsApp number?'];
  if (/website|ecommerce|e-commerce|shop/i.test(content)) return ['What is included in a website project?', 'How do I start a project?'];
  if (/project|work|portfolio/i.test(content)) return ['Which services would suit my project?', 'How can I contact the team?'];
  return ['Tell me more about your services.', 'How do I start a project?'];
}

export default function AssistantChat({ mode = 'site', compact = false, onConversationChange, onClose, autoFocus = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState('guide');
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(null);
  const [newMessages, setNewMessages] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const textarea = useRef(null);
  const transcript = useRef(null);
  const controller = useRef(null);
  const sequence = useRef(0);
  const followBottom = useRef(true);
  const mounted = useRef(false);
  const copyTimer = useRef(null);
  const latest = useRef({ messages, engine, ready, busy });
  const conversationCallback = useRef(onConversationChange);
  const id = useId();
  const storageKey = `hich:assistant:${mode}:v1`;
  const lastAssistant = [...messages].reverse().find(message => message.role === 'assistant' && message.content);
  const lastUser = [...messages].reverse().find(message => message.role === 'user');
  const title = mode === 'terms' ? 'Chathu — Terms' : 'Chathu';
  const status = busy ? messages.at(-1)?.content ? 'Writing a response' : 'Thinking about your question' : 'Ready to help';
  latest.current = { messages, engine, ready, busy };
  conversationCallback.current = onConversationChange;

  useEffect(() => {
    mounted.current = true;
    const saved = readConversation(storageKey);
    setMessages(saved.messages);
    setEngine(saved.engine);
    setBusy(false);
    setError(null);
    setReady(true);
    function flush() {
      if (!latest.current.ready) return;
      const savedMessages = latest.current.messages.map((message, index, all) => latest.current.busy && index === all.length - 1 && message.role === 'assistant' ? { ...message, stopped: true } : message);
      try { sessionStorage.setItem(storageKey, JSON.stringify({ messages: storedMessages(savedMessages), engine: latest.current.engine })); } catch { /* Storage is optional. */ }
    }
    window.addEventListener('pagehide', flush);
    return () => {
      mounted.current = false;
      controller.current?.abort();
      controller.current = null;
      clearTimeout(copyTimer.current);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    conversationCallback.current?.(messages.filter(message => message.content).map(({ id: messageId, role, content, sources }) => ({ id: messageId, role, content, ...(sources?.length ? { sources } : {}) })));
    const persist = () => {
      const savedMessages = messages.map((message, index) => busy && index === messages.length - 1 && message.role === 'assistant' ? { ...message, stopped: true } : message);
      try { sessionStorage.setItem(storageKey, JSON.stringify({ messages: storedMessages(savedMessages), engine })); } catch { /* Private browsing can disable storage. */ }
    };
    if (!busy) { persist(); return; }
    const timer = window.setTimeout(persist, 350);
    return () => window.clearTimeout(timer);
  }, [messages, engine, ready, busy, storageKey]);

  useEffect(() => {
    if (!textarea.current) return;
    textarea.current.style.height = '0px';
    textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 132)}px`;
  }, [input]);

  useEffect(() => {
    if (autoFocus && ready) textarea.current?.focus({ preventScroll: true });
  }, [autoFocus, ready]);

  useEffect(() => {
    if (!messages.length) return;
    if (!followBottom.current) { setNewMessages(true); return; }
    const frame = requestAnimationFrame(() => {
      if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, busy, error]);

  function scrollToBottom() {
    followBottom.current = true;
    setNewMessages(false);
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  async function runReply(history) {
    if (controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    const assistantId = `assistant-${Date.now()}-${++sequence.current}`;
    const base = history.slice(-(MAX_MESSAGES - 1));
    setMessages([...base, { id: assistantId, role: 'assistant', content: '', sources: [], actions: [] }]);
    setError(null);
    setBusy(true);
    setAnnouncement('Preparing a response.');
    followBottom.current = true;
    setNewMessages(false);
    let result = '';
    const active = () => mounted.current && controller.current === abort && !abort.signal.aborted;
    try {
      await streamAssistantReply({
        mode, messages: base.filter(message => message.content).map(({ role, content }) => ({ role, content })), signal: abort.signal,
        onEvent(event) {
          if (!active()) return;
          if (event.type === 'mode') {
            const answerEngine = event.mode === 'ai' ? 'ai' : 'guide';
            setEngine(answerEngine);
            setMessages(current => current.map(message => message.id === assistantId ? { ...message, engine: answerEngine } : message));
          }
          if (event.type === 'delta' && typeof event.text === 'string') {
            result += event.text;
            setMessages(current => current.map(message => message.id === assistantId ? { ...message, content: result } : message));
          }
          if (event.type === 'sources') setMessages(current => current.map(message => message.id === assistantId ? { ...message, sources: cleanSources(event.sources) } : message));
          if (event.type === 'actions') setMessages(current => current.map(message => message.id === assistantId ? { ...message, actions: cleanContactActions(event.actions) } : message));
        },
      });
      if (!active()) return;
      if (!result.trim()) throw new Error('Empty response');
      setMessages(current => current.map(message => message.id === assistantId ? { ...message, actions: cleanContactActions(message.actions?.length ? message.actions : getContactActions({ messages: base, content: result })) } : message));
      setAnnouncement('Response ready.');
    } catch (caught) {
      if (!active() || caught?.name === 'AbortError') return;
      const message = typeof caught?.message === 'string' && caught.message.trim()
        ? caught.message.trim().slice(0, 240)
        : 'The response could not finish. Please try again.';
      setError(message);
      setAnnouncement(`${message} You can retry the response.`);
      setMessages(current => current.map(message => message.id === assistantId ? { ...message, failed: true } : message));
    } finally {
      if (mounted.current && controller.current === abort) {
        controller.current = null;
        setBusy(false);
      }
    }
  }

  function send(text = input) {
    const content = text.trim().slice(0, MAX_INPUT);
    if (!content || controller.current || !ready) return;
    setInput('');
    runReply([...messages.filter(message => message.content), { id: `user-${Date.now()}-${++sequence.current}`, role: 'user', content }]);
    textarea.current?.focus({ preventScroll: true });
  }

  function stop() {
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setMessages(current => current.map((message, index) => index === current.length - 1 && message.role === 'assistant' ? { ...message, stopped: true } : message));
    setAnnouncement('Response stopped.');
    textarea.current?.focus({ preventScroll: true });
  }

  function regenerate() {
    const userIndex = messages.findLastIndex(message => message.role === 'user');
    if (userIndex >= 0) runReply(messages.slice(0, userIndex + 1));
  }

  function reset() {
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setMessages([]);
    setInput('');
    setError(null);
    setCopied(null);
    setNewMessages(false);
    followBottom.current = true;
    if (transcript.current) transcript.current.scrollTop = 0;
    setAnnouncement('New conversation started.');
    try { sessionStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
    textarea.current?.focus({ preventScroll: true });
  }

  async function copy(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      if (!mounted.current) return;
      setCopied(message.id);
      setAnnouncement('Response copied.');
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 1800);
    } catch { setAnnouncement('Unable to copy automatically. You can select and copy the response.'); }
  }

  return <section className={`assistant-chat assistant-chat-${mode}${compact ? ' assistant-chat-compact' : ''}`} data-assistant={mode} data-generating={busy ? 'true' : 'false'} aria-label={title}>
    <header className="assistant-chat-header">
      <span className="assistant-chat-avatar" aria-hidden="true"><Sparkles size={19} strokeWidth={1.6} /></span>
      <div className="assistant-chat-identity"><h3>{title}</h3><p><i aria-hidden="true" />{status}</p></div>
      <div className="assistant-chat-header-actions">
        <button type="button" className="assistant-chat-new" onClick={reset} title="New chat" aria-label="New chat"><Plus size={17} /><span>New chat</span></button>
        {onClose && <button type="button" onClick={onClose} title="Close assistant" aria-label="Close assistant"><X size={19} /></button>}
      </div>
    </header>

    <div className="assistant-chat-body">
      <div ref={transcript} className="assistant-chat-transcript" role="log" aria-label="Conversation" aria-live="off" tabIndex={0} data-lenis-prevent onScroll={() => {
        const element = transcript.current;
        followBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        if (followBottom.current) setNewMessages(false);
      }}>
        {!messages.length && <div className="assistant-chat-welcome">
          <div className="assistant-chat-welcome-mark" aria-hidden="true"><Sparkles size={34} strokeWidth={1.25} /><span /><span /></div>
          <p className="assistant-chat-eyebrow">A conversation, made simple.</p>
          <h4>{mode === 'terms' ? <>A little clarity.<br />A good next step.</> : <>Big ideas start with<br />a conversation.</>}</h4>
          <p className="assistant-chat-welcome-copy">{mode === 'terms' ? 'Ask Chathu about the terms and get a clear explanation with the relevant sections close at hand.' : 'Ask Chathu to find the right service, shape a project idea, or connect you with the HICH team.'}</p>
          <div className="assistant-chat-starters">{STARTERS[mode].map(question => <button key={question} type="button" onClick={() => send(question)} disabled={!ready}><span>{question}</span><ArrowUpRight size={15} /></button>)}</div>
        </div>}

        {messages.map((message, index) => <article key={message.id} className={`assistant-chat-message assistant-chat-message-${message.role}`} data-message-role={message.role} data-streaming={busy && index === messages.length - 1 && message.role === 'assistant' ? 'true' : undefined}>
          <div className="assistant-chat-message-label">{message.role === 'assistant' ? <><Sparkles size={13} /><span>Chathu</span></> : <span>You</span>}</div>
          {message.role === 'user' ? <div className="assistant-chat-user-text">{message.content}</div> : <div className="assistant-chat-answer">
            {message.content && <Markdown content={message.content} streaming={busy && index === messages.length - 1} />}
            {busy && index === messages.length - 1 && !message.content && <div className="assistant-chat-thinking" aria-hidden="true"><span className="assistant-chat-thinking-orbit"><Sparkles size={16} strokeWidth={1.5} /></span><span className="assistant-chat-thinking-copy"><small>Thinking it through</small><span>Understanding your question</span></span><span className="assistant-chat-thinking-dots"><i /><i /><i /></span></div>}
            {!(busy && index === messages.length - 1) && !message.stopped && !message.failed && <ContactCards actions={message.actions} />}
            {message.sources?.length > 0 && <div className="assistant-chat-sources"><span>Explore the details</span><div>{message.sources.map((source, sourceIndex) => <Link key={`${source.href}-${sourceIndex}`} href={source.href}><span>{source.title}</span><ArrowUpRight size={12} /></Link>)}</div></div>}
            {message.stopped && <p className="assistant-chat-stopped">Response stopped.</p>}
            {message.content && !(busy && index === messages.length - 1) && <div className="assistant-chat-answer-actions">
              <button type="button" onClick={() => copy(message)} aria-label={copied === message.id ? 'Response copied' : 'Copy response'} title={copied === message.id ? 'Response copied' : 'Copy response'}>{copied === message.id ? <Check size={14} /> : <Copy size={14} />}{copied === message.id && <span>Copied</span>}</button>
              {!busy && index === messages.length - 1 && !error && <button type="button" onClick={regenerate} aria-label="Regenerate response" title="Regenerate response"><RotateCcw size={14} /></button>}
            </div>}
          </div>}
        </article>)}

        {error && <div className="assistant-chat-error"><p>{error}</p><button type="button" onClick={regenerate}><RotateCcw size={13} />Retry response</button></div>}
        {!busy && !error && lastAssistant && messages.at(-1)?.id === lastAssistant.id && !lastAssistant.stopped && <div className="assistant-chat-followups" aria-label="Suggested questions"><span>Keep the conversation going</span>{followUps(mode, lastAssistant.content).filter(question => question !== lastUser?.content).map(question => <button type="button" key={question} onClick={() => send(question)}>{question}<ArrowUpRight size={12} /></button>)}</div>}
        {!busy && !error && messages.at(-1)?.stopped && !messages.at(-1)?.content && <button className="assistant-chat-resume" type="button" onClick={regenerate}><RotateCcw size={13} />Try again</button>}
      </div>
      {newMessages && <button className="assistant-chat-jump" type="button" onClick={scrollToBottom}><ArrowDown size={13} />Latest response</button>}
    </div>

    <form className="assistant-chat-composer" onSubmit={event => { event.preventDefault(); send(); }}>
      <div className="assistant-chat-input-wrap">
        <label className="assistant-chat-sr-only" htmlFor={`${id}-message`}>Your message</label>
        <textarea id={`${id}-message`} ref={textarea} value={input} onChange={event => setInput(event.target.value)} placeholder={mode === 'terms' ? 'Ask about the terms…' : 'Ask anything about HICH…'} rows={1} maxLength={MAX_INPUT} aria-describedby={`${id}-hint`} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); send(); }
        }} />
        {busy ? <button type="button" className="assistant-chat-send assistant-chat-stop" onClick={stop} aria-label="Stop response" title="Stop response"><Square size={14} fill="currentColor" /></button> : <button type="submit" className="assistant-chat-send" disabled={!input.trim() || !ready} aria-label="Send message" title="Send message"><ArrowUp size={19} strokeWidth={2} /></button>}
      </div>
      <div className="assistant-chat-composer-meta" id={`${id}-hint`}><span>{input.length > 1800 ? `${input.length} / ${MAX_INPUT}` : engine === 'ai' ? 'AI answers may need checking.' : 'Answers from website content.'}</span><span><CornerDownLeft size={10} /> Send<span className="assistant-chat-shift-hint"> · Shift + Enter for a new line</span></span></div>
    </form>
    <span className="assistant-chat-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
  </section>;
}
