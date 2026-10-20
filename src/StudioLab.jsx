import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Database, FileText, Layers, Mail, MousePointer2, PencilLine, RotateCcw, Route, Sparkles } from 'lucide-react';
import BrandSpark from './BrandSpark.jsx';
import './studio-lab.css';

const layers = [
  {
    name: 'The experience', short: 'Experience', icon: Sparkles, tag: 'THE PART PEOPLE FEEL',
    title: 'Make the first impression count.',
    text: 'A recognisable point of view. A story that makes sense. A next step that feels natural. Every detail works towards the same thing: helping the right people connect with you.',
    outputs: ['A distinctive visual direction', 'Clear content and customer journeys', 'Thoughtful, accessible interactions'],
    href: '/ui-ux-design.html', cta: 'Explore experience design',
  },
  {
    name: 'The connections', short: 'Connections', icon: Route, tag: 'THE PART THAT MAKES IT WORK',
    title: 'Keep the conversation moving.',
    text: 'The website is the beginning of a workflow. We connect the important steps behind it, so an enquiry can reach the right person with the context they need to act.',
    outputs: ['A mapped enquiry or order journey', 'Integrations shaped around your tools', 'Clear handoffs and useful notifications'],
    href: '/api-integrations-automation.html', cta: 'Explore connected systems',
  },
  {
    name: 'The ownership', short: 'Ownership', icon: PencilLine, tag: 'THE PART YOU TAKE FORWARD',
    title: 'Keep making it yours.',
    text: 'Your story will change. Your website should have room for it. Structured content, reusable components and a considered handover help your team own the next chapter.',
    outputs: ['An editing workflow for your team', 'Reusable pages and content components', 'Documentation and an agreed support plan'],
    href: '/website-maintenance-support.html', cta: 'Explore life after launch',
  },
];

function Sculpture({ small = false }) {
  const id = useId();
  return <svg className={`sl-sculpture ${small ? 'sl-sculpture-small' : ''}`} viewBox="0 0 480 440" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-front`} x1="114" y1="82" x2="340" y2="326" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset="1" stopColor="#b8c0ee" /></linearGradient>
      <linearGradient id={`${id}-side`} x1="80" y1="142" x2="250" y2="374" gradientUnits="userSpaceOnUse"><stop stopColor="#ccd2ef" /><stop offset="1" stopColor="#747cac" /></linearGradient>
      <radialGradient id={`${id}-floor`}><stop stopColor="#001c86" stopOpacity=".5" /><stop offset="1" stopColor="#001c86" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="251" cy="364" rx="194" ry="55" fill={`url(#${id}-floor)`} />
    <path d="M95 292 265 390 409 307 238 209 95 292Z" fill="#fff" fillOpacity=".12" stroke="#fff" strokeOpacity=".35" />
    <path d="M140 155 140 301 198 335 198 189 140 155Z" fill={`url(#${id}-side)`} />
    <path d="M140 155 221 108 278 141 198 189 140 155Z" fill="#fff" />
    <path d="M198 189 278 141 278 289 198 335 198 189Z" fill={`url(#${id}-front)`} />
    <path d="M225 97 225 243 283 277 283 131 225 97Z" fill={`url(#${id}-side)`} />
    <path d="M225 97 306 50 364 84 283 131 225 97Z" fill="#fff" />
    <path d="M283 131 364 84 364 231 283 277 283 131Z" fill={`url(#${id}-front)`} />
    <path d="M198 240 283 191 283 233 198 282 198 240Z" fill="#f5f6ff" />
    <path d="M164 220 198 240 283 191 249 172 164 220Z" fill="#fff" />
    <path d="M164 220 164 262 198 282 198 240 164 220Z" fill="#a2abd4" />
    <circle cx="367" cy="301" r="17" fill="#ffb7c3" />
    <path d="M79 212v24M67 224h24M360 151v15M352.5 158.5h15" stroke="#fff" strokeOpacity=".65" strokeWidth="1.5" />
    <path d="M81 311 231 398M239 40 392 128" stroke="#fff" strokeOpacity=".25" strokeDasharray="3 6" />
  </svg>;
}

function ConceptSite({ headline = 'Space for what comes next.', accent = 'blue', compact = false }) {
  return <div className={`sl-concept sl-accent-${accent} ${compact ? 'sl-concept-compact' : ''}`}>
    <div className="sl-browser-bar" aria-hidden="true"><span><i /><i /><i /></span><span>forme.studio / concept preview</span><ArrowUpRight size={11} /></div>
    <div className="sl-concept-nav"><strong>FORME<span>®</span></strong><span>Considered spaces.<br />New possibilities.</span><span className="sl-concept-menu" aria-hidden="true"><i /><i /></span></div>
    <div className="sl-concept-main"><div className="sl-concept-copy"><span>ARCHITECTURE. WITH PERSPECTIVE.</span><p>{headline}</p><span className="sl-concept-cta">Explore our perspective <ArrowUpRight size={13} /></span></div><div className="sl-concept-art"><Sculpture small={compact} /></div></div>
    <div className="sl-concept-footer"><span>THOUGHTFULLY SHAPED.</span><span>BUILT AROUND YOU.<ArrowDown size={12} /></span></div>
  </div>;
}

function ExperiencePreview() {
  const [accent, setAccent] = useState('blue');
  return <div className="sl-experience-preview">
    <div className="sl-art-rings" aria-hidden="true"><i /><i /><i /></div>
    <div className="sl-experience-browser"><ConceptSite accent={accent} /></div>
    <span className="sl-art-note" aria-hidden="true"><MousePointer2 size={16} fill="currentColor" /><span>Every detail belongs.</span></span>
    <div className="sl-palette"><span>CHANGE THE MOOD</span><div role="group" aria-label="Concept colour direction">{[['blue', 'Electric blue'], ['rose', 'Warm rose'], ['green', 'Forest green']].map(([value, label]) => <button key={value} type="button" className={`sl-swatch sl-swatch-${value}`} aria-label={label} aria-pressed={accent === value} onClick={() => setAccent(value)}>{accent === value && <Check size={14} aria-hidden="true" />}</button>)}</div></div>
  </div>;
}

const journey = [
  { title: 'Your website', detail: 'A visitor starts a conversation.', icon: MousePointer2 },
  { title: 'Their enquiry', detail: 'Useful details travel with it.', icon: FileText },
  { title: 'Your workspace', detail: 'The context stays together.', icon: Database },
  { title: 'Your people', detail: 'The right team can follow up.', icon: Mail },
];

function ConnectionsPreview() {
  const [step, setStep] = useState(-1), [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (step === journey.length - 1) { setRunning(false); return; }
    const timer = setTimeout(() => setStep(value => value + 1), 650);
    return () => clearTimeout(timer);
  }, [step, running]);
  const trace = () => { setStep(0); setRunning(true); };
  return <div className="sl-connections-preview">
    <div className="sl-flow-intro"><span>ONE CONNECTED EXPERIENCE</span><span className="sl-flow-monogram" aria-hidden="true">H<BrandSpark /></span></div>
    <ol className="sl-flow-nodes">{journey.map((node, index) => { const Icon = node.icon; return <li key={node.title} className={index <= step ? 'sl-node-visited' : ''} aria-current={index === step ? 'step' : undefined}><span className="sl-node-number">0{index + 1}</span><span className="sl-node-icon"><Icon size={24} aria-hidden="true" /></span><div><strong>{node.title}</strong><span>{node.detail}</span></div><span className="sl-node-check" aria-hidden="true">{index <= step ? <Check size={14} /> : <ArrowRight size={14} />}</span></li>; })}</ol>
    <div className="sl-flow-action"><button type="button" onClick={trace} disabled={running}>{running ? 'Following the journey' : step === 3 ? 'Trace it again' : 'Trace an enquiry'}{step === 3 ? <RotateCcw size={15} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}</button><span aria-live="polite" aria-atomic="true">{step < 0 ? 'Try the illustrative workflow.' : step === 3 ? 'Ready for a personal response.' : `Step ${step + 1}: ${journey[step].detail}`}</span></div>
  </div>;
}

function OwnershipPreview() {
  const id = useId();
  const [draft, setDraft] = useState('Space for what comes next.');
  const [headline, setHeadline] = useState(draft);
  const [updated, setUpdated] = useState(false);
  const submit = event => { event.preventDefault(); if (draft.trim()) { setHeadline(draft.trim()); setUpdated(true); } };
  return <div className="sl-ownership-preview">
    <div className="sl-ownership-browser"><ConceptSite headline={headline} compact /></div>
    <form className="sl-editor" onSubmit={submit}>
      <div className="sl-editor-top"><span><Layers size={15} aria-hidden="true" />YOUR CONTENT STUDIO</span><span className="sl-editor-dot" /></div>
      <label htmlFor={`${id}-headline`}>A new chapter starts with a few words.</label>
      <div className="sl-editor-field"><small>HOMEPAGE HEADLINE</small><input id={`${id}-headline`} aria-label="Preview website headline" value={draft} maxLength={48} required onChange={event => { setDraft(event.target.value); setUpdated(false); }} /></div>
      <div className="sl-editor-bottom"><span aria-live="polite">{updated ? 'Your preview is updated.' : 'Try editing the headline.'}</span><button type="submit" disabled={!draft.trim()}>Update preview <ArrowUpRight size={14} aria-hidden="true" /></button></div>
    </form>
  </div>;
}

/** A deliberately local, illustrative interaction: nothing is submitted or saved. */
export default function StudioLab() {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = useRef([]);
  const selectWithKeyboard = event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? layers.length - 1 : (active + (event.key === 'ArrowRight' ? 1 : layers.length - 1)) % layers.length;
    setActive(next);
    tabs.current[next]?.focus();
  };
  return <section className="studio-lab" aria-labelledby={`${id}-title`}>
    <div className="shell">
      <div className="sl-heading"><div><p className="sl-eyebrow"><span />A LITTLE CURIOUS? LOOK INSIDE.</p><h2 id={`${id}-title`}>BEAUTIFUL IS<br /><span>JUST THE BEGINNING.</span></h2></div><p>A great website has more going on than meets the eye. Explore the craft, the connections and the freedom behind the first impression.</p></div>
      <div className="sl-workbench">
        <div className="sl-toolbar"><span><BrandSpark />THE HICH STUDIO LAB</span><span>IDEAS YOU CAN INTERACT WITH<ArrowDown size={13} aria-hidden="true" /></span></div>
        <div className="sl-tabs" role="tablist" aria-label="Explore the layers of a HICH website">{layers.map((layer, index) => { const Icon = layer.icon; return <button type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} ref={element => { tabs.current[index] = element; }} key={layer.name} onClick={() => setActive(index)} onKeyDown={selectWithKeyboard}><span className="sl-tab-index">0{index + 1}</span><Icon size={18} aria-hidden="true" /><span className="sl-tab-name">{layer.short}</span><ArrowUpRight className="sl-tab-arrow" size={17} aria-hidden="true" /></button>; })}</div>
        {layers.map((layer, index) => <div key={layer.name} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={active !== index} tabIndex={0} className="sl-panel">
          {active === index && <><div className={`sl-visual sl-visual-${index}`}><div className="sl-visual-top"><span>INSIDE THE BUILD / 0{index + 1}</span><span>INTERACTIVE CONCEPT</span></div>{index === 0 ? <ExperiencePreview /> : index === 1 ? <ConnectionsPreview /> : <OwnershipPreview />}<p className="sl-visual-caption">{index === 0 ? 'A studio concept. A real sense of possibility.' : index === 1 ? 'An example journey, shaped around your actual tools.' : 'An editing preview. Imagine what your team could do.'}</p></div>
            <div className="sl-detail"><span className="sl-detail-tag">{layer.tag}</span><h3>{layer.title}</h3><p>{layer.text}</p><div className="sl-output"><span>WHAT TAKES SHAPE</span><ul>{layer.outputs.map(output => <li key={output}><Check size={14} aria-hidden="true" />{output}</li>)}</ul></div><a className="sl-link" href={layer.href}>{layer.cta}<ArrowUpRight size={18} aria-hidden="true" /></a></div></>}
        </div>)}
        <div className="sl-bench-footer"><span>DESIGNED WITH INTENT. BUILT WITH CARE.</span><span>YOUR AMBITION. EVERY LAYER.</span></div>
      </div>
      <div className="sl-endnote"><span className="sl-endnote-spark" aria-hidden="true"><BrandSpark /></span><p>Good on the surface.<br /><strong>Thoughtful all the way through.</strong></p><a href="/contact.html">Let’s build your next chapter<ArrowUpRight size={21} aria-hidden="true" /></a></div>
    </div>
  </section>;
}
