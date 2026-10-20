import React, { useState } from 'react';
import { ArrowUpRight, ArrowRight, Check } from 'lucide-react';

// Small, local SVG brand marks keep the demo crisp without third-party requests.
export function GoogleWordmark() {
  return <img className="sx-google-wordmark" src="/tool-icons/google-wordmark.png" width="272" height="92" alt="Google" loading="lazy" />;
}

function ToolIcon({ id }) {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
    {id === 'search' && <><rect x="4" y="7" width="32" height="27" rx="3" fill="#e8eaed"/><path d="M4 10a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v5H4z" fill="#5f6368"/><rect x="10" y="24" width="5" height="6" rx="1" fill="#34a853"/><rect x="18" y="19" width="5" height="11" rx="1" fill="#4285f4"/><rect x="26" y="16" width="5" height="14" rx="1" fill="#fbbc04"/><circle cx="9" cy="11" r="1" fill="white"/></>}
    {id === 'analytics' && <><rect x="26" y="3" width="9" height="34" rx="4.5" fill="#f9ab00"/><rect x="14" y="15" width="9" height="22" rx="4.5" fill="#e37400"/><circle cx="6.5" cy="32.5" r="4.5" fill="#e37400"/></>}
    {id === 'tags' && <><path d="m20 3 17 17-17 17L3 20z" fill="#8ab4f8"/><path d="m20 3 17 17-6 6L14 9z" fill="#4285f4"/><path d="m9 14 17 17-6 6L3 20z" fill="#246fdb"/><path d="m14 20 6-6 6 6-6 6z" fill="white"/><circle cx="20" cy="31" r="6" fill="#1a73e8"/></>}
    {id === 'ads' && <><path d="M18 8 6 29" stroke="#fbbc04" strokeWidth="12" strokeLinecap="round"/><path d="m20 8 12 21" stroke="#4285f4" strokeWidth="12" strokeLinecap="round"/><circle cx="6" cy="29" r="6" fill="#34a853"/></>}
  </svg>;
}

const tools = [
  { id: 'search', name: 'Search Console', category: 'DISCOVERY', title: 'Understand how people find you.', description: 'Connect search queries, useful landing pages and indexing checks to a clearer content plan.', steps: ['Search intent', 'Useful content', 'Search visibility'], detail: 'A question worth answering becomes a page worth finding.' },
  { id: 'analytics', name: 'Google Analytics', category: 'UNDERSTANDING', title: 'See what happens after the click.', description: 'Define meaningful events around your customer journey, then use those signals to guide the next improvement.', steps: ['Page visit', 'Engaged visitor', 'Meaningful action'], detail: 'Measure enquiries and useful actions alongside traffic.' },
  { id: 'tags', name: 'Tag Manager', category: 'MEASUREMENT', title: 'Give every useful signal a place.', description: 'Organise measurement tags around agreed events, consent choices and a documented testing process.', steps: ['User action', 'Consent & rules', 'Measured event'], detail: 'Clear measurement starts with deliberate, tested events.' },
  { id: 'ads', name: 'Google Ads', category: 'CAMPAIGNS', title: 'Connect intent to the right page.', description: 'Shape a focused campaign around a useful promise, a relevant landing page and a clear next step.', steps: ['Relevant search', 'Focused message', 'Helpful landing page'], detail: 'Keep the message consistent from search to enquiry.' },
];

export function GrowthToolkit() {
  const [active, setActive] = useState('search');
  const tool = tools.find(item => item.id === active);
  return <section className="sx-growth-toolkit" aria-labelledby="sx-toolkit-title">
    <div className="sx-toolkit-heading"><div><span className="sx-small-label">THE THINKING BEHIND THE GROWTH</span><h3 id="sx-toolkit-title">Connected tools.<br/>Considered decisions.</h3></div><p>Explore the role each tool can play in a useful growth strategy.</p></div>
    <div className="sx-toolkit-options" role="group" aria-label="Explore growth tools">{tools.map(item => <button type="button" key={item.id} aria-pressed={active === item.id} onClick={() => setActive(item.id)}><span className="sx-tool-icon"><ToolIcon id={item.id}/></span><span><small>{item.category}</small><strong>{item.name}</strong></span>{active === item.id ? <Check size={15}/> : <ArrowUpRight size={15}/>}</button>)}</div>
    <div className="sx-toolkit-panel" key={active} aria-live="polite" aria-atomic="true"><div><span className="sx-small-label">{tool.category} / {tool.name.toUpperCase()}</span><h4>{tool.title}</h4><p>{tool.description}</p></div><div className="sx-growth-flow"><div>{tool.steps.map((step, index) => <React.Fragment key={step}><span style={{'--flow-delay': `${index * 110}ms`}}><i>0{index + 1}</i>{step}</span>{index < 2 && <ArrowRight size={17}/>}</React.Fragment>)}</div><p>{tool.detail}</p></div></div>
  </section>;
}
