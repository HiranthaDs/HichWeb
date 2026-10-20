import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Mail, MessageCircle, Sparkles } from 'lucide-react';
import AssistantChat from './AssistantChat.jsx';
import './terms-assistant.css';

export default function TermsAssistant() {
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState('Planning a project');
  const latestQuestion = [...messages].reverse().find(message => message.role === 'user')?.content;
  const latestAnswer = [...messages].reverse().find(message => message.role === 'assistant');
  const contactText = useMemo(() => {
    const sources = latestAnswer?.sources?.map(source => source.title).join(', ');
    return `Hello HICH,\n\nI'd like to clarify a point in the Terms and Conditions.\n\nProject stage: ${stage}\nMy question: ${latestQuestion || 'Please help me understand which terms apply to my project.'}${sources ? `\nRelevant sections: ${sources}` : ''}\n\nPlease confirm how this applies to my project. Thank you.`;
  }, [stage, latestQuestion, latestAnswer]);
  return <section className="terms-assistant" id="terms-assistant" aria-labelledby="terms-assistant-title">
    <div className="shell">
      <div className="terms-assistant-heading">
        <p><Sparkles size={15} aria-hidden="true" /> A LITTLE MORE CLARITY</p>
        <h2 id="terms-assistant-title">SMALL PRINT.<br /><span>CLEAR ANSWERS.</span></h2>
        <p>Ask a question, explore the answer, and keep the conversation going. Understand the terms in your own words, with the original sections close at hand.</p>
      </div>
      <div className="terms-assistant-layout">
        <AssistantChat mode="terms" onConversationChange={setMessages} />
        <aside className="terms-contact-card" id="terms-contact">
          <span className="terms-contact-icon"><MessageCircle size={24} aria-hidden="true" /></span>
          <p>THERE’S A PERSON HERE, TOO.</p>
          <h3>LET’S TALK<br />IT THROUGH.</h3>
          <p>For an answer specific to your project, take your question straight to the studio.</p>
          <fieldset><legend>Where are you in your project?</legend>{['Planning a project', 'Active project', 'After launch'].map(option => <button type="button" key={option} aria-pressed={stage === option} onClick={() => setStage(option)}><span>{option}</span>{stage === option && <Check size={14} aria-hidden="true" />}</button>)}</fieldset>
          {latestQuestion && <div className="terms-contact-summary"><span>YOUR LATEST QUESTION</span><p>{latestQuestion}</p></div>}
          <a className="terms-contact-action" href={`mailto:info@hichweb.com?subject=${encodeURIComponent('A question about my project terms')}&body=${encodeURIComponent(contactText)}`}><Mail size={17} aria-hidden="true" /><span>Email the studio</span><ArrowUpRight size={17} aria-hidden="true" /></a>
          <a className="terms-contact-action terms-contact-action-outline" href={`https://wa.me/94714112113?text=${encodeURIComponent(contactText)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true" /><span>Continue on WhatsApp</span><ArrowUpRight size={17} aria-hidden="true" /></a>
          <small>Your question is added to a draft for you to review and send.</small>
        </aside>
      </div>
      <p className="terms-assistant-note">A guide to the published terms. Your accepted project agreement defines the details of your engagement.</p>
    </div>
  </section>;
}
