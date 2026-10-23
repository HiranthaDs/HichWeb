import BrandSpark from './BrandSpark.jsx';
import HichLogo from './HichLogo.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowDown, ArrowLeft, Plus, Minus, X, Search, Globe, Code2, Layers, ShoppingBag, Sparkles, Check, Mail, Phone, Compass, Grid2X2, MessageCircle, ArrowUp, Play, Pause } from 'lucide-react';
import { company, services, projects, insights, faqs } from './data.js';
import { getPageMeta, normalizePath } from './routes.js';
import useMotion from './useMotion.js';
import IdentityScene from './IdentityScene.jsx';
import ProjectPlanner from './ProjectPlanner.jsx';
import ServiceExperience from './ServiceExperience.jsx';
import ServiceNavigation, { serviceHeadlines, relatedServices } from './ServiceNavigation.jsx';
import PageDepth from './PageDepth.jsx';
import PageTransition from './PageTransition.jsx';
import ServicesGitTransition from './ServicesGitTransition.jsx';
import ContactActions from './ContactActions.jsx';
import StudioLab from './StudioLab.jsx';
import { termsSections, termsUpdated } from './termsContent.js';
import AboutStory from './AboutStory.jsx';
import ContributionGarden from './ContributionGarden.jsx';
import SeasonalSnow from './SeasonalSnow.jsx';
import TermsHero from './TermsHero.jsx';
import TermsAssistant from './TermsAssistant.jsx';
import SiteAssistant, { HomeAssistant } from './SiteAssistant.jsx';
import SeoVisibilityDemo from './SeoVisibilityDemo.jsx';
import Folder from './Folder.jsx';
import ClientMarquee from './ClientMarquee.jsx';
import './industry-folder-inline.css';

const pathFor = item => `/${item.slug}.html`;
const navItems = [['Home', '/'], ['Capabilities', '/services.html'], ['Selected work', '/allprojects.html'], ['The studio', '/about.html'], ['Insights', '/insights.html']];
const Arrow = ({ down = false }) => down ? <ArrowDown size={20} aria-hidden="true" /> : <ArrowUpRight size={20} aria-hidden="true" />;
function LinkButton({ href = '/contact.html', children = 'Start a project', light = false, className = '' }) {
  return <a className={`pill ${light ? 'pill-light' : ''} ${className}`} href={href}><span>{children}</span><ArrowUpRight size={19} aria-hidden="true" /></a>;
}
function Label({ children, number }) { return <p className="section-label">{number && <span className="label-number">{number}</span>}<span>{children}</span></p>; }
function Wordmark({ footer = false, caption = false }) { return <a className={`wordmark ${footer ? 'wordmark-footer' : ''}`} href="/" aria-label="HICH — home"><span className="wordmark-logo-frame"><HichLogo /></span>{caption && <span className="wordmark-service" aria-hidden="true">WEB<br />DEVELOPMENT</span>}</a>; }

function Header({ path }) {
  const menu = useRef(null), searchDialog = useRef(null), searchInput = useRef(null);
  const [query, setQuery] = useState(''), [menuOpen, setMenuOpen] = useState(false), [searchOpen, setSearchOpen] = useState(false);
  const allResults = [...[['Contact', '/contact.html'], ['Our process', '/process.html'], ['Careers', '/job.html'], ['Privacy policy', '/privacy-policy.html'], ['Website terms', '/terms-and-conditions.html']].map(([title, href]) => ({ title, href, category: 'Explore' })), ...navItems.map(([title, href]) => ({ title, href, category: 'Explore' })), ...services.map(s => ({ title: s.title, href: pathFor(s), category: 'Capability' })), ...insights.map(s => ({ title: s.title, href: pathFor(s), category: 'Guide' }))];
  const filtered = allResults.filter(r => `${r.title} ${r.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 9);
  const closeMenu = () => { menu.current?.close(); setMenuOpen(false); };
  const openSearch = () => { closeMenu(); searchDialog.current?.showModal(); setSearchOpen(true); setTimeout(() => searchInput.current?.focus(), 30); };
  useEffect(() => {
    const key = e => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); } };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  useEffect(() => { document.body.style.overflow = menuOpen || searchOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [menuOpen, searchOpen]);
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header" id="top"><Wordmark caption /><div className="header-center"><span className="live-dot" /> SRI LANKA · WORLDWIDE</div><div className="header-actions"><button className="search-trigger" aria-label="Search website (Control or Command K)" onClick={openSearch}><Search size={20} /></button><LinkButton className="header-cta">Let’s talk</LinkButton><button className="menu-trigger" onClick={() => { menu.current.showModal(); setMenuOpen(true); }} aria-haspopup="dialog" aria-expanded={menuOpen}>MENU<span className="menu-lines"><i /><i /></span></button></div></header>
    <dialog className="menu-dialog" ref={menu} onClose={() => setMenuOpen(false)} aria-label="Main navigation"><div className="menu-dialog-top"><Wordmark /><button className="menu-trigger" onClick={closeMenu}>CLOSE <X /></button></div><div className="menu-layout"><nav aria-label="Main menu">{navItems.map(([name, href], i) => <a href={href} key={href} aria-current={path === href ? 'page' : undefined}><span>0{i + 1}</span>{name}<ArrowUpRight /></a>)}</nav><aside><Label>Let’s make something matter.</Label><a href="mailto:info@hichweb.com">info@hichweb.com <Arrow /></a><a href="tel:+94714112113">+94 714 112 113</a><div className="menu-small-links"><a href="/process.html">Our process</a><a href="/technology-stack.html">Our technology</a><a href="/contact.html">Start a project</a><button onClick={openSearch}>Search this site <Search size={16} /></button></div><p>Independent thinking.<br />Connected expertise.<br />A little extraordinary.</p></aside></div><div className="menu-bottom"><span>HICH WEB DEVELOPMENT</span><span>MADE IN SRI LANKA. BUILT FOR EVERYWHERE.</span></div></dialog>
    <dialog className="search-dialog" ref={searchDialog} onClose={() => setSearchOpen(false)} onClick={e => { if (e.target === e.currentTarget) searchDialog.current.close(); }} aria-label="Search HICH"><div className="search-panel"><div className="search-field"><Search /><label className="sr-only" htmlFor="site-search">Search pages and services</label><input id="site-search" ref={searchInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="What are you looking for?" autoComplete="off" /><button className="icon-button" onClick={() => searchDialog.current.close()} aria-label="Close search"><X /></button></div><p className="search-hint">PAGES, CAPABILITIES & PRACTICAL GUIDES</p><div className="search-results">{filtered.length ? filtered.map(r => <a key={r.href} href={r.href}><span><small>{r.category}</small>{r.title}</span><Arrow /></a>) : <p>No matches. Try “website”, “commerce” or “contact”.</p>}</div><div className="search-foot">Use Tab to move through results. Press Escape to close.</div></div></dialog>
    <nav className="mobile-dock" aria-label="Mobile quick navigation"><a href="/" aria-current={path === '/' ? 'page' : undefined}><Compass size={19} /><span>Explore</span></a><a href="/allprojects.html" aria-current={path === '/allprojects.html' ? 'page' : undefined}><Grid2X2 size={19} /><span>Work</span></a><a href="/services.html" aria-current={path === '/services.html' ? 'page' : undefined}><Layers size={19} /><span>Services</span></a><a href="/contact.html" className="dock-project"><ArrowUpRight size={19} /><span>Let’s talk</span></a></nav>
  </>;
}

function Hero() {
  return <section className="hero shell" aria-labelledby="hero-heading"><div className="hero-top"><p>HICH creates distinctive websites, digital products<br className="desktop-break" /> and connected experiences for ambitious businesses.</p><span className="hero-edition">DESIGN + TECHNOLOGY<br />A LITTLE EXTRAORDINARY.</span></div><h1 className="hero-title" id="hero-heading"><span className="title-line">WEBSITES FOR</span><span className="title-line">BRANDS THAT</span><span className="title-line"><span className="blue-accent">THINK BIG.</span><span className="hero-asterisk" aria-hidden="true"><BrandSpark /></span></span></h1><div className="hero-bottom"><p>Good websites get seen.<br /><strong>Great experiences get remembered.</strong></p><a className="hero-scroll" href="#work"><span>EXPLORE WHAT’S POSSIBLE</span><span className="round-arrow"><ArrowDown /></span></a><LinkButton className="mobile-hero-cta">Build something great</LinkButton></div><div className="expertise-ribbon"><span>IDEAS INTO IMPACT</span><div><b>Strategy.</b><b>Design.</b><b>Development.</b><b>Growth.</b><span className="ribbon-star" aria-hidden="true"><BrandSpark /></span></div></div></section>;
}
function Intro() {
  const words = ['Your', 'ambition', 'deserves', 'more', 'than', 'ordinary.'];
  return <section className="intro-section"><IdentityScene /><div className="shell intro-content"><Label number="01">A DIFFERENT KIND OF DIGITAL PARTNER</Label><h2 className="intro-statement">{words.map((word, i) => <span className="intro-word" key={i}>{word} </span>)}</h2><div className="intro-bottom"><span className="intro-small">BIG IDEAS.<br />REAL-WORLD IMPACT.</span><div><p>Beautiful on the surface. Thoughtful underneath. We bring strategy, design and engineering together to turn your next big idea into something people love to use.</p><LinkButton href="/about.html" light>Meet HICH</LinkButton></div></div></div></section>;
}
function ProjectImage({ project, priority = false }) {
  return <div className={`project-art project-art-${project.slug}`} style={{ '--project-color': project.color || ['#d0d4f3','#f0dbce','#b9c6b1'][projects.indexOf(project) % 3] }}>{project.image ? <div className="browser-frame"><div className="browser-chrome"><i /><i /><i /><span>{project.name}</span></div><img src={project.image} alt={`${project.name} website interface`} loading={priority ? 'eager' : 'lazy'} decoding="async" width="1440" height="900" /></div> : <div className="project-identity"><span>{project.name}</span><small>{project.category}</small></div>}<span className="project-open" aria-hidden="true"><ArrowUpRight /></span>{project.concept && <span className="concept-label">DESIGN CONCEPT</span>}</div>;
}
function ProjectModal({ project, onClose }) {
  const ref = useRef(null);
  useEffect(() => { if (!project) return; ref.current?.showModal(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; }; }, [project]);
  if (!project) return null;
  return <dialog ref={ref} className="project-dialog" onClose={onClose} onClick={e => { if (e.target === e.currentTarget) ref.current.close(); }} aria-labelledby="project-dialog-title"><div className="project-dialog-inner"><button className="icon-button modal-close" onClick={() => ref.current.close()} aria-label="Close project"><X /></button><ProjectImage project={project} /><div className="project-dialog-copy"><Label>{project.category}</Label><h2 id="project-dialog-title">{project.name}</h2><p>{project.description}</p><div className="tag-list">{(project.services || []).map(s => <span key={s}>{s}</span>)}</div><div className="project-dialog-actions">{project.url && <a className="pill" href={project.url} target="_blank" rel="noopener noreferrer">{project.concept ? 'Open visual preview' : 'Visit project'}<ArrowUpRight size={18} /></a>}<LinkButton href="/contact.html" light>Start something like this</LinkButton></div></div></div></dialog>;
}
function Work({ archive = false }) {
  const [filter, setFilter] = useState('All'), [active, setActive] = useState(null);
  const categories = ['All', ...new Set(projects.map(p => p.category))];
  const list = archive ? projects.filter(p => filter === 'All' || p.category === filter) : projects.slice(0, 4);
  return <section id="work" className={`work-section ${archive ? 'work-archive' : ''}`}>{!archive && <div className="marquee" aria-hidden="true"><div className="marquee-track">SELECTED WORK. <span>SELECTED WORK.</span> SELECTED WORK.</div></div>}<div className="shell"><div className="section-top"><Label number={archive ? undefined : '02'}>{archive ? 'THE PROJECT ARCHIVE' : 'GOOD IDEAS. OUT IN THE WORLD.'}</Label>{!archive && <a className="text-link" href="/allprojects.html">All projects <Arrow /></a>}</div>{archive && <div className="filter-bar" role="group" aria-label="Filter projects">{categories.map(c => <button key={c} aria-pressed={c === filter} className={c === filter ? 'active' : ''} onClick={() => setFilter(c)}>{c}<span>{c === 'All' ? projects.length : projects.filter(p => p.category === c).length}</span></button>)}</div>}<div className="project-grid" aria-live="polite">{list.map((project, i) => <article className="project-card" key={project.slug} data-reveal><button className="project-image-button" onClick={() => setActive(project)} aria-label={`View ${project.name} project details`}><ProjectImage project={project} priority={archive && i < 2} /></button><div className="project-caption"><h3><button onClick={() => setActive(project)}>{project.name}</button></h3><span>{project.category}</span></div></article>)}</div>{!archive && <p className="mobile-swipe-hint"><ArrowLeft size={14} /> Swipe to explore the work <ArrowRight size={14} /></p>}<ProjectModal project={active} onClose={() => setActive(null)} /></div></section>;
}

const capabilityIcons = [Globe, ShoppingBag, Code2, Layers, Sparkles, Compass];
function Capabilities({ full = false }) {
  const [expanded, setExpanded] = useState(0);
  const featured = full ? services : services.filter(s => ['website-development','ecommerce-solutions','web-application-development','ui-ux-design','erp-systems','api-integrations-automation'].includes(s.slug));
  return <section className="capabilities shell section-space" id="capabilities"><div className="split-heading"><div><Label number={full ? undefined : '03'}>CREATIVE THINKING. TECHNICAL DEPTH.</Label><h2 className="display-heading" data-reveal>ONE PARTNER.<br /><span className="text-blue">MORE POSSIBLE.</span></h2></div><p>From the first “what if” to the last line of code. Everything your business needs to make its next move.</p></div><div className="capability-layout"><div className="capability-visual" aria-hidden="true"><span className="cap-orbit orbit-1" /><span className="cap-orbit orbit-2" /><div className="cap-core">H<span><BrandSpark /></span></div><span className="orbit-label label-design">DESIGN</span><span className="orbit-label label-build">BUILD</span><span className="orbit-label label-grow">GROW</span><small>GOOD ALONE. EXTRAORDINARY TOGETHER.</small></div><div className="capability-list">{featured.map((s, i) => { const Icon = capabilityIcons[i % capabilityIcons.length]; return <article key={s.slug} className={`capability-item ${expanded === i ? 'expanded' : ''}`}><h3 className="capability-heading"><button className="capability-toggle" aria-expanded={expanded === i} aria-controls={`cap-panel-${i}`} onClick={() => setExpanded(expanded === i ? -1 : i)}><span className="cap-index">{String(i + 1).padStart(2,'0')}</span><span className="capability-title">{s.title}</span>{expanded === i ? <Minus /> : <Plus />}</button></h3><div id={`cap-panel-${i}`} hidden={expanded !== i} className="capability-detail"><Icon size={26} /><p>{s.short || s.description}</p><a className="text-link" href={pathFor(s)}>Explore the capability <Arrow /></a></div></article>; })}</div></div>{!full && <a className="text-link all-capabilities" href="/services.html">Explore all {services.length} capabilities <Arrow /></a>}</section>;
}

function Benefits() {
  const [choice, setChoice] = useState('Designed for people'), [edited, setEdited] = useState(false), [playing, setPlaying] = useState(true);
  return <section className={`benefits-section ${playing ? '' : 'demo-paused'}`}><div className="shell"><div className="section-top"><Label number="04">THE DETAILS MAKE THE DIFFERENCE</Label><button className="animation-toggle" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause interface animation' : 'Play interface animation'}>{playing ? <Pause size={16} /> : <Play size={16} />}<span>{playing ? 'Pause motion' : 'Play motion'}</span></button></div><div className="benefits-grid"><article className="benefit-card"><div className="benefit-demo conversion-demo" aria-label="Illustrative customer journey"><div className="journey-line"><span><Search size={19} /></span><i /><span><Globe size={19} /></span><i /><span><MessageCircle size={19} /></span></div><span className="demo-notification"><span className="check-disc"><Check size={15} /></span>A clearer path to your next customer.<span className="notification-dot" /></span><span className="demo-caption">DISCOVER → CONNECT → CONVERT</span></div><Label>MAKE EVERY VISIT COUNT</Label><h3>BUILT TO<br />MOVE BUSINESS.</h3><p>A clear message, considered journey and purposeful call to action. Every element has a job to do.</p></article><article className="benefit-card"><div className="benefit-demo experience-demo"><div className="mini-card"><span className="mini-star"><BrandSpark /></span><span>A little more you.</span><div className="demo-pills">{['Designed for people','Made for every screen'].map(v => <button key={v} onClick={() => setChoice(v)} className={choice === v ? 'selected' : ''} aria-pressed={choice === v}>{v}{choice === v && <Check size={12} />}</button>)}</div></div><span className="tap-indicator">Try it <ArrowUpRight size={14} /></span></div><Label>LESS FRICTION. MORE FEELING.</Label><h3>DELIGHT<br />YOUR PEOPLE.</h3><p>Intuitive interfaces, thoughtful motion and mobile experiences that feel made for the way people actually use them.</p></article><article className="benefit-card"><div className="benefit-demo editor-demo"><div className="editor-toolbar"><i /><span>YOUR CONTENT. YOUR CONTROL.</span><button onClick={() => setEdited(!edited)}>{edited ? 'Reset' : 'Edit'} <Code2 size={12} /></button></div><div className="editor-content"><small>YOUR NEXT CHAPTER</small><span>{edited ? 'Made possible.' : 'Make it yours.'}</span><div className="editor-caret" /><div className="editor-lines"><i /><i /></div></div><span className="editor-status"><span className="live-dot" />{edited ? 'Preview updated' : 'A simple editing preview'}</span></div><Label>TAKE THE REINS</Label><h3>POWERFUL.<br />NOT COMPLICATED.</h3><p>Scalable systems and manageable content. A foundation that grows with your business, with handover and support to match.</p></article></div></div></section>;
}

const processSteps = [
  ['Discover', 'First, the right questions.', 'We get to know your business, your audience and what success should look like. Together, we turn ambition into a clear project brief.'],
  ['Design', 'Make the vision tangible.', 'Journeys, wireframes and visual direction come together. You see and shape the experience before development begins.'],
  ['Develop', 'Thoughtful, down to the code.', 'We build your approved design into a working product, connect the systems you need, and check it across devices.'],
  ['Launch & evolve', 'This is only the beginning.', 'Content, accessibility and performance checks lead into launch. Clear handover and agreed support keep the next chapter moving.'],
];
function Process({ full = false }) {
  const [step, setStep] = useState(0);
  return <section className={`process-section section-space ${full ? 'process-full' : ''}`} id="process"><div className="shell"><div className="split-heading"><div><Label number="05">NO MYSTERY. JUST MOMENTUM.</Label><h2 className="display-heading">BIG VISION.<br /><span className="text-blue">CLEAR NEXT STEPS.</span></h2></div><p>Good work is a conversation. You’ll know what’s happening, why it matters, and what comes next.</p></div><div className="process-tabs" role="tablist" aria-label="Our project process">{processSteps.map(([title], i) => <button role="tab" aria-selected={step === i} aria-controls={`process-panel-${i}`} id={`process-tab-${i}`} tabIndex={step === i ? 0 : -1} onKeyDown={e => { if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? 3 : (step + (e.key === 'ArrowRight' ? 1 : 3)) % 4; setStep(next); document.getElementById(`process-tab-${next}`)?.focus(); } }} onClick={() => setStep(i)} key={title}><span>0{i + 1}</span>{title}<ArrowRight size={19} /></button>)}</div>{processSteps.map(([title, subtitle, copy], i) => <div className="process-panel" role="tabpanel" id={`process-panel-${i}`} aria-labelledby={`process-tab-${i}`} hidden={step !== i} key={title}><span className="process-big-number" aria-hidden="true">0{i + 1}</span><div><h3>{subtitle}</h3><p>{copy}</p><a className="text-link" href={full ? '/contact.html' : '/process.html'}>{full ? 'Let’s make a start' : 'Get to know the process'}<Arrow /></a></div><span className="process-spark" aria-hidden="true"><BrandSpark /></span></div>)}</div></section>;
}

const sectors = [
  { title: 'Ambitious businesses', heading: 'THE NEXT CHAPTER\nSTARTS ONLINE.', copy: 'Launch a new venture, reposition your brand or connect the systems behind your growth. We help businesses turn a digital presence into a useful business asset.', link: '/website-development.html', label: 'Explore business websites' },
  { title: 'Commerce brands', heading: 'FROM FIRST LOOK\nTO CHECKOUT.', copy: 'Make discovery effortless and buying feel natural. Connect a considered storefront with the catalogue, payments and operations that keep your business moving.', link: '/ecommerce-solutions.html', label: 'Explore e-commerce' },
  { title: 'Connected teams', heading: 'LESS BUSYWORK.\nMORE POSSIBILITY.', copy: 'Bring people, information and workflows together. Purpose-built portals, ERP systems and integrations make complex work easier to manage.', link: '/erp-systems.html', label: 'Explore business systems' },
];
const nextChapterFolderItems = [
  { title: 'Brand direction', description: 'A clear story for the next chapter.' },
  { title: 'Digital experience', description: 'A website designed around real people.' },
  { title: 'Growth plan', description: 'A useful foundation ready to evolve.' },
];
function NextChapterFolder() {
  return <div className="industry-folder-slot">
    <Folder
      label="NEXT CHAPTER"
      items={nextChapterFolderItems}
      mode="flap"
      variant="solid"
      layout="spread"
      color="#1043f9"
      paperColor="#ffffff"
      openOn="click"
      draggable={false}
      zoomOnClick={false}
      peek
      intro
      size={1.08}
      speed={1.08}
      bounce={0.48}
      tilt={0.7}
      theme="light"
      className="industry-folder-inline"
    />
    <span className="industry-folder-inline-hint" aria-hidden="true">CLICK OR TAP TO OPEN <ArrowUpRight size={12} /></span>
  </div>;
}
function Industries() {
  const [sector, setSector] = useState(0);
  return <section className="industry-section shell section-space"><Label number="06">BUILT AROUND YOUR WORLD</Label><div className="industry-tabs" role="tablist" aria-label="Solutions by business need">{sectors.map((s, i) => <button role="tab" key={s.title} id={`sector-${i}`} aria-controls={`sector-panel-${i}`} aria-selected={sector === i} tabIndex={sector === i ? 0 : -1} onClick={() => setSector(i)} onKeyDown={e => { if (['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (sector + (e.key === 'ArrowRight' ? 1 : 2)) % 3; setSector(next); document.getElementById(`sector-${next}`)?.focus(); } }}>{s.title}<ArrowUpRight size={18} /></button>)}</div>{sectors.map((s, i) => <div role="tabpanel" id={`sector-panel-${i}`} aria-labelledby={`sector-${i}`} hidden={sector !== i} className={`industry-panel ${i === 0 ? 'industry-panel-with-folder' : 'industry-panel-copy-only'}`} key={s.title}><div className="industry-copy"><h2>{s.heading.split('\n').map(l => <span key={l}>{l}</span>)}</h2><p>{s.copy}</p><LinkButton href={s.link}>{s.label}</LinkButton></div>{i === 0 && <NextChapterFolder />}</div>)}</section>;
}
function Studio({ full = false }) {
  return <section className="studio-section"><div className="shell studio-layout"><div><Label number="07">INDEPENDENT STUDIO. CONNECTED THINKING.</Label><h2 className="display-heading">SMALL ENOUGH<br />TO CARE.<br /><span className="pink-outline">BOLD ENOUGH<br />TO BUILD IT.</span></h2><LinkButton href={full ? '/contact.html' : '/about.html'} light>{full ? 'Meet your next digital partner' : 'A little about us'}</LinkButton></div><div className="studio-copy"><div className="studio-graphic" aria-hidden="true"><div className="studio-seal">H<span><BrandSpark /></span></div><span>DESIGN.<br />ENGINEERING.<br />GOOD ENERGY.</span></div><h3>YOUR AMBITION.<br />OUR COLLECTIVE CURIOSITY.</h3><p>HICH is a digital studio based in Sri Lanka, partnering with businesses around the world. We connect the creative and the technical so your idea feels as good as it works.</p><p>Direct conversations. Thoughtful decisions. A shared commitment to building something worth putting your name on.</p><div className="studio-location"><Globe size={20} /><span>BASED IN SRI LANKA<br /><strong>WORKING EVERYWHERE</strong></span><span className="live-dot" /></div></div></div></section>;
}
function FAQ({ items = faqs }) { return <section className="faq-section shell section-space" id="faq"><div><Label>GOOD QUESTIONS. STRAIGHT ANSWERS.</Label><h2 className="display-heading">LET’S CLEAR<br /><span className="text-blue">THINGS UP.</span></h2></div><div className="faq-list">{items.map((f, i) => { const hasSearchDemo = f.question === 'Can you help with SEO and AI search visibility?'; return <details key={f.question}><summary><span className="faq-index">{String(i + 1).padStart(2,'0')}</span><h3>{f.question}</h3><Plus size={19} /></summary>{hasSearchDemo ? <div className="faq-answer-rich"><p>{f.answer}</p><SeoVisibilityDemo /></div> : <p>{f.answer}</p>}</details>; })}</div></section>; }
function Insights({ full = false }) { return <section className="insights-section shell section-space"><div className="section-top"><div><Label number={full ? undefined : '08'}>THOUGHTS WORTH SHARING</Label>{!full && <h2 className="display-heading">FRESH PERSPECTIVES.</h2>}</div>{!full && <a className="text-link" href="/insights.html">All insights <Arrow /></a>}</div><div className="insights-grid">{insights.slice(0, full ? undefined : 3).map((item, i) => <a className={`insight-card insight-${i % 3}`} key={item.slug} href={pathFor(item)}><div className="insight-art" aria-hidden="true"><span className="insight-symbol">{[<ArrowUpRight key="arrow" />,<BrandSpark key="spark" />,<Code2 key="code" />][i % 3]}</span><span className="insight-art-caption">THE HICH<br />PERSPECTIVE.</span><span className="insight-arrow"><ArrowUpRight /></span></div><Label>{item.category || 'PRACTICAL GUIDE'}</Label><h3>{item.title}</h3><p>{item.excerpt}</p><span className="text-link">Read the guide <Arrow /></span></a>)}</div></section>; }

function Footer({ contact = false }) {
  return <footer className="site-footer"><div className="shell">{!contact && <div className="footer-cta"><Label>HAVE SOMETHING IN MIND?</Label><a href="/contact.html"><span>LET’S MAKE<br /><span className="footer-outline">IT HAPPEN.</span></span><span className="footer-arrow"><ArrowUpRight strokeWidth={1} /></span></a></div>}<div className="footer-main"><div className="footer-brand"><Wordmark footer /><p>Digital experiences.<br />Made with purpose.</p></div><div className="footer-column"><Label>WHERE TO NEXT?</Label><a href="/services.html">Capabilities <Arrow /></a><a href="/allprojects.html">Selected work <Arrow /></a><a href="/about.html">The studio <Arrow /></a><a href="/insights.html">Insights <Arrow /></a></div><div className="footer-column"><Label>START SOMETHING GOOD</Label><a href="mailto:info@hichweb.com">info@hichweb.com <Arrow /></a><a href="tel:+94714112113">+94 714 112 113 <Arrow /></a><a href="https://wa.me/94714112113" target="_blank" rel="noopener noreferrer">WhatsApp <Arrow /></a><span className="footer-location">SRI LANKA / WORLDWIDE</span></div><div className="footer-column"><Label>STAY CURIOUS</Label><a href="https://www.linkedin.com/in/hichweb/" target="_blank" rel="noopener noreferrer">LinkedIn <Arrow /></a><a href="/process.html">Our process <Arrow /></a><a href="/technology-stack.html">Our technology <Arrow /></a><a href="/job.html">Collaborate <Arrow /></a></div></div><div className="footer-bottom"><span>© 2026 HICH WEB DEVELOPMENT</span><div><a href="/privacy-policy.html">Privacy</a><a href="/terms-and-conditions.html">Terms</a><a href="#top">Back to top <ArrowUp size={12} aria-hidden="true" /></a></div><span>THOUGHTFULLY BUILT. ENDLESSLY CURIOUS.</span></div></div></footer>;
}
function PageHero({ label, title, description, blue, children }) { return <section className="page-hero shell"><a className="breadcrumb" href="/">HICH <span>/</span> {label}</a><h1 className="page-title" data-reveal>{title}<span className="text-blue">{blue}</span></h1>{description && <p className="page-description">{description}</p>}{children}</section>; }
function ServicePage({ service }) {
  return <>
    <PageHero label="CAPABILITIES" title={service.title} blue={serviceHeadlines[service.slug]} description={service.description} />
    <ServiceNavigation />
    <ServiceExperience service={service} />
    <section className="service-detail shell" id="service-scope">
      <div className="service-intro"><Label>THE RIGHT FOUNDATION FOR YOUR NEXT CHAPTER</Label><h2>{service.short || service.title}</h2><LinkButton>Let’s plan your project</LinkButton></div>
      <div className="deliverables"><Label>WHAT WE CAN BUILD TOGETHER</Label>{service.deliverables.map((d, i) => <div key={i}><Check size={19} /><span>{typeof d === 'string' ? d : d.title}</span></div>)}<div className="tag-list">{service.tags.map(t => <span key={t}>{t}</span>)}</div></div>
    </section>
    <Process /><FAQ items={service.faqs} />
    <section className="related-services shell"><Label>THE NEXT PIECES OF YOUR PROJECT</Label>{relatedServices(service, services).map(s => <a key={s.slug} href={pathFor(s)}>{s.title}<Arrow /></a>)}</section>
  </>;
}
function ArticlePage({ article }) { return <><PageHero label="INSIGHTS / PRACTICAL GUIDE" title={article.title} description={article.excerpt} /><div className="article-layout shell"><aside className="article-sidebar"><Label>IN THIS GUIDE</Label><nav aria-label="Article contents">{article.body.map((s, i) => <a key={i} href={`#section-${i}`}>{String(i + 1).padStart(2,'0')} {s.heading}</a>)}</nav><p>BY HICH WEB DEVELOPMENT<br />A PRACTICAL PLANNING GUIDE</p><LinkButton>Talk through your project</LinkButton></aside><article className="article-body">{article.body.map((s, i) => <section id={`section-${i}`} key={i}><h2>{s.heading}</h2><p>{s.text}</p></section>)}<div className="article-callout"><h2>Make it specific to your business.</h2><p>Use our project builder to turn the ideas in this guide into a clear, shareable brief.</p><LinkButton href="/contact.html">Build your project brief</LinkButton></div><a className="text-link" href="/insights.html"><ArrowLeft size={18} /> Back to all insights</a></article></div></>; }

function ContactPage() { return <><PageHero label="LET’S TALK" title="BIG IDEA?" blue="WE’RE LISTENING." description="A new website. A better experience. An idea you can’t stop thinking about. Tell us what’s next."><ContactActions /></PageHero><section className="contact-layout shell" id="project-enquiry"><aside className="contact-aside"><Label>YOUR NEXT CHAPTER STARTS HERE</Label><h2>GOOD WORK STARTS<br />WITH A CONVERSATION.</h2><p>Build a short project brief, then send it through your preferred channel. Or skip straight to hello.</p><a href="mailto:info@hichweb.com"><Mail size={20} /><span><small>EMAIL THE STUDIO</small>info@hichweb.com</span><Arrow /></a><a href="tel:+94714112113"><Phone size={20} /><span><small>LET’S HAVE A CONVERSATION</small>+94 714 112 113</span><Arrow /></a><a href="https://wa.me/94714112113" target="_blank" rel="noopener noreferrer"><MessageCircle size={20} /><span><small>A QUICK HELLO</small>Chat on WhatsApp</span><Arrow /></a><div className="contact-sticker"><Globe size={32} /><span>BASED IN SRI LANKA.<br />OPEN TO THE WORLD.</span></div></aside><ProjectPlanner /></section></>; }
function LegalPage({ terms = false }) {
  const privacySections = [
    ['What this site collects', 'The project builder holds the information you enter in the current page while you prepare a brief. It does not submit that brief to a HICH form server. You choose whether to copy it, download it, open it in your email application or open a WhatsApp draft. The chat assistants work as described below.'],
    ['Chathu, the HICH assistant', 'Website and terms conversations are stored separately in session storage for this browser tab so you can continue between pages. Use New chat in Chathu to clear a conversation, or close the browser session. Most answers use published HICH content directly in your browser. When a question needs additional synthesis and AI answers are enabled, your message and limited recent conversation are sent through the website server to Google Gemini. The API key remains server-side. The chat identifies the mode used for each answer. Please do not enter passwords, payment-card details or confidential project information. A chat reply does not send an enquiry or create an agreement with HICH.'],
    ['Optional draft storage', 'If you choose to save project preferences on this device, the builder uses local browser storage for non-personal project selections. Name, email, company and free-text details are not saved in this storage. Use the “Start over” control in the builder, or clear this website’s browser data, to remove saved preferences.'],
    ['Interactive previews and page transitions', 'Service prototypes, planning checklists and creative previews keep your choices in the current page. They use illustrative records and do not send those choices to HICH or connect to external business systems. Reloading the page resets them. Animated navigation briefly uses session storage for the destination URL and a timestamp; this record is removed when the next page loads. It is not used for analytics or advertising.'],
    ['Motion and seasonal preferences', 'The contribution display responds to your interactions on this page without sending them to HICH. During December, the website can show decorative snowfall. Its pause preference is stored in session storage for this browser tab and removed when that session ends. The website uses the Sri Lankan calendar date and your browser’s reduced-motion preference to decide whether to animate. No location permission is requested.'],
    ['Email, WhatsApp and other providers', 'Email, WhatsApp, LinkedIn and linked project websites have their own privacy practices. Opening a WhatsApp draft passes the prepared brief to WhatsApp in the link URL, even before you send it to HICH. Other external links send a request to their provider. A prepared email or WhatsApp message is only delivered when you send it in the corresponding application.'],
    ['Fonts, cookies and hosting', 'Fonts and website assets are hosted with this website. This build does not install advertising cookies or analytics trackers. Your hosting provider may maintain standard access and security logs, including request and network information.'],
    ['Your correspondence and requests', 'Information you choose to send to HICH can be used to respond to your enquiry and discuss the project. Email info@hichweb.com to ask about your correspondence or request correction or deletion. Please avoid including unnecessary sensitive information.'],
    ['Updates', 'This notice describes the functionality of the October 2026 website build. It should be reviewed if the deployed site later adds analytics, a form server, accounts, new providers or other data handling.'],
  ];
  return <>{terms ? <TermsHero /> : <PageHero label="THE SMALL PRINT" title="YOUR PRIVACY." description="A straightforward explanation of what happens to your information here." />}{terms ? <><article className="legal-copy legal-copy-detailed shell">
    <div className="legal-summary"><p><strong>Last updated:</strong> {termsUpdated}</p><p>Please read these Terms carefully. They contain important provisions about signatures, payment acceptance, intellectual property, acceptable use, disclaimers, liability and disputes. They apply to the public Website; paid projects require separate written commercial terms that may be accepted physically, electronically or, where clearly stated, through payment.</p></div>
    {termsSections.map((section, index) => <section id={`term-${index + 1}`} key={section.title}><span className="legal-section-number">{String(index + 1).padStart(2, '0')}</span><h2>{section.title}</h2>{section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}
  </article><TermsAssistant /></> : <article className="legal-copy shell">{privacySections.map(([title, copy]) => <section key={title}><h2>{title}</h2><p>{copy}</p></section>)}</article>}</>;
}
function Home() { return <><Hero /><Intro /><ContributionGarden variant="home" /><Work /><ClientMarquee /><StudioLab /><Capabilities /><Benefits /><Process /><Industries /><Studio /><HomeAssistant /><FAQ /><Insights /></>; }
export default function App({ path = '/' }) {
  const root = useRef(null), normalized = normalizePath(path), meta = getPageMeta(path);
  useMotion(root);
  useEffect(() => { document.title = meta.title; }, [meta.title]);
  let page;
  if (meta.type === 'home') page = <Home />;
  else if (meta.type === 'service') page = <ServicePage service={meta.item} />;
  else if (meta.type === 'article') page = <ArticlePage article={meta.item} />;
  else switch (meta.path) {
    case '/services.html': page = <><PageHero label="OUR CAPABILITIES" title="FROM WHAT IF." blue="TO WHAT’S NEXT." description="Strategy, design and engineering. Connected from the first conversation to the next big chapter." /><Capabilities full /><Benefits /><Industries /><FAQ /></>; break;
    case '/allprojects.html': page = <><PageHero label="SELECTED WORK" title="GOOD IDEAS." blue="MADE REAL." description="A selection of websites, storefronts and digital experiences. Different businesses. One shared ambition to do things better." /><Work archive /></>; break;
    case '/contact.html': page = <ContactPage />; break;
    case '/insights.html': page = <><PageHero label="INSIGHTS" title="STAY CURIOUS." blue="BUILD BETTER." description="Practical perspectives on the decisions behind a better digital experience. From the first brief to your next launch." /><Insights full /></>; break;
    case '/about.html': page = <><PageHero label="MEET THE STUDIO" title="CREATIVE MINDS." blue="CONNECTED THINKING." description="We’re HICH. A registered web development and digital design company in Sri Lanka, bringing ambitious ideas to life for businesses everywhere." /><Studio full /><AboutStory /><ContributionGarden variant="about" /><Capabilities /><Process /></>; break;
    case '/process.html': page = <><PageHero label="HOW WE WORK" title="YOUR VISION." blue="A SHARED JOURNEY." description="A clear process, open conversations and room for good ideas. Here’s how we move from first hello to launch and beyond." /><Process full /><FAQ /></>; break;
    case '/privacy-policy.html': page = <LegalPage />; break;
    case '/terms-and-conditions.html': page = <LegalPage terms />; break;
    case '/job.html': page = <><PageHero label="CAREERS & COLLABORATION" title="GOOD PEOPLE." blue="GREAT POSSIBILITIES." description="Designers, developers and curious thinkers: introduce yourself and the work you’re proud of." /><section className="shell careers-copy"><h2>LET’S KEEP IN TOUCH.</h2><p>We aren’t listing specific vacancies here. If you’d like to explore a future collaboration, send your portfolio and a short introduction to the studio.</p><LinkButton href="mailto:info@hichweb.com?subject=HICH%20collaboration%20introduction">Introduce yourself</LinkButton></section></>; break;
    default: page = <><PageHero label="404 / A LITTLE OFF TRACK" title="LOST THE LINK?" blue="FIND THE POSSIBILITIES." description="That page isn’t here. There’s plenty more to explore." /><div className="shell not-found-actions"><LinkButton href="/">Back to home</LinkButton><LinkButton href="/allprojects.html" light>Explore our work</LinkButton></div></>;
  }
  return <div ref={root}><ServicesGitTransition /><PageTransition /><Header path={normalized} /><main id="main" tabIndex={-1}>{page}{meta.type !== 'service' && <PageDepth path={meta.path} />}</main><Footer contact={meta.path === '/contact.html'} /><SeasonalSnow /><SiteAssistant home={meta.type === 'home'} /></div>;
}
