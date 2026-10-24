import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowDownRight, MessageCircle, Sparkles } from 'lucide-react';
import AssistantChat from './AssistantChat.jsx';
import BrandSpark from './BrandSpark.jsx';
import './site-assistant.css';

const MOBILE_CHAT_QUERY = '(max-width: 760px)';
const subscribeToMobileChat = callback => {
  const media = window.matchMedia(MOBILE_CHAT_QUERY);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
const mobileChatSnapshot = () => window.matchMedia(MOBILE_CHAT_QUERY).matches;
const serverChatSnapshot = () => false;
const useMobileChat = () => useSyncExternalStore(subscribeToMobileChat, mobileChatSnapshot, serverChatSnapshot);

export function HomeAssistant() {
  const mobile = useMobileChat();
  // Only one site conversation is mounted, so the popup and inline version
  // cannot overwrite each other's saved messages when the viewport changes.
  if (mobile) return null;
  return <section className="home-assistant" id="hich-assistant" aria-labelledby="home-assistant-title">
    <div className="shell home-assistant-layout">
      <div className="home-assistant-copy">
        <p className="home-assistant-eyebrow"><Sparkles size={16} aria-hidden="true" /> MEET CHATHU</p>
        <h2 id="home-assistant-title">BIG QUESTIONS.<br /><span>LET’S TALK.</span></h2>
        <p>Wondering what to build, where to start, or what we can do together? Ask away. A little conversation can open up a lot of possibilities.</p>
        <div className="home-assistant-detail"><span>THE WHOLE STUDIO.<br />ONE CONVERSATION.</span><ArrowDownRight size={30} strokeWidth={1.3} aria-hidden="true" /></div>
        <div className="home-assistant-art" aria-hidden="true"><BrandSpark /><span>HELLO,<br />POSSIBILITY.</span></div>
      </div>
      <AssistantChat mode="site" />
    </div>
  </section>;
}

export default function SiteAssistant({ home = false }) {
  const mobile = useMobileChat();
  const inline = home && !mobile;
  const dialog = useRef(null);
  const trigger = useRef(null);
  const previousFocus = useRef(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open || inline) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open, inline]);

  useEffect(() => {
    if (inline) {
      setOpen(false);
      setMounted(false);
    }
  }, [inline]);

  const launch = () => {
    if (inline) {
      const section = document.getElementById('hich-assistant');
      section?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
      section?.querySelector('textarea')?.focus({ preventScroll: true });
      return;
    }
    previousFocus.current = document.activeElement;
    setMounted(true);
    dialog.current?.showModal();
    setOpen(true);
    requestAnimationFrame(() => dialog.current?.querySelector('textarea')?.focus({ preventScroll: true }));
  };
  const close = () => dialog.current?.close();
  const didClose = () => {
    setOpen(false);
    (previousFocus.current?.isConnected ? previousFocus.current : trigger.current)?.focus({ preventScroll: true });
  };

  return <>
    <button className="site-chat-trigger" ref={trigger} type="button" aria-label="Open Chathu" aria-haspopup={inline ? undefined : 'dialog'} aria-controls={inline ? 'hich-assistant' : 'site-chat-dialog'} aria-expanded={inline ? undefined : open} onClick={launch}>
      <span className="site-chat-trigger-icon"><MessageCircle size={22} aria-hidden="true" /><i /></span><span>Ask Chathu</span><Sparkles className="site-chat-trigger-spark" size={14} aria-hidden="true" />
    </button>
    {!inline && <dialog className="site-chat-dialog" id="site-chat-dialog" ref={dialog} aria-label="Chathu, HICH website assistant" onClose={didClose} onClick={event => { if (event.target === event.currentTarget) close(); }} data-lenis-prevent>
      {mounted && <AssistantChat mode="site" compact onClose={close} autoFocus />}
    </dialog>}
  </>;
}
