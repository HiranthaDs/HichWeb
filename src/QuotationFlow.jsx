import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Download, ExternalLink, FileText, LoaderCircle, MessageCircle, Search, Sparkles } from 'lucide-react';
import {
  buildQuotation, compatibleAddons, createQuoteReference, formatLkr, formatUsd, packageById,
  packagesForCategory, projectCategories,
} from './quotation-engine.js';
import { generateQuotationPdf } from './quotation-pdf.js';
import { quotationWhatsApp } from './quotation-share.js';

const steps = ['Project', 'Package', 'Add-ons', 'Brief', 'Review'];
const emptyClient = { name: '', company: '', email: '', phone: '', objective: '', targetLaunch: '' };

function Progress({ current, onChange, disabled }) {
  return <nav className="quote-flow-progress" aria-label="Quotation steps">
    <div role="progressbar" aria-label="Quotation progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={current + 1}><span style={{ width: `${((current + 1) / steps.length) * 100}%` }} /></div>
    <ol className="quote-flow-steps">{steps.map((label, index) => <li key={label}>
      <button type="button" aria-current={index === current ? 'step' : undefined} disabled={disabled || index > current} onClick={() => onChange(index)}>
        <span>{index < current ? <Check size={11} /> : index + 1}</span>{label}
      </button>
    </li>)}</ol>
  </nav>;
}

function ShareQuotation({ quote }) {
  const share = useMemo(() => quotationWhatsApp(quote), [quote]);
  const [copyStatus, setCopyStatus] = useState('');
  const text = useRef(null);
  const preview = useRef(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share.text);
      setCopyStatus('Full quotation copied. You can paste it into WhatsApp.');
    } catch {
      preview.current.open = true;
      text.current.focus();
      text.current.select();
      setCopyStatus('Automatic copying is unavailable. The full text is selected: use Copy from your browser or keyboard.');
    }
  };
  return <div className="quote-flow-share">
    {share.requiresCopy && <p className="quote-flow-share-note">This quotation is too long for a reliable prefilled link. Copy the full details below, then open WhatsApp and paste them. Nothing is left out.</p>}
    <a className="quote-flow-primary quote-flow-whatsapp" href={share.href} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} />{share.requiresCopy ? 'Open WhatsApp to paste details' : 'Send quotation on WhatsApp'}<ExternalLink size={13} /></a>
    <button className="quote-flow-secondary" type="button" onClick={copy}><Copy size={14} />Copy full quotation</button>
    <p className="quote-flow-share-note">Includes your contact details, brief, complete scope, prices and payment stages. You review and press Send in WhatsApp. Attach the PDF there separately if needed.</p>
    <details className="quote-flow-share-preview" ref={preview}>
      <summary>Preview all details before sharing</summary>
      <textarea aria-label="Full quotation details" ref={text} readOnly value={share.text} rows={12} />
    </details>
    <p className="quote-flow-copy-status" role="status">{copyStatus}</p>
  </div>;
}

export default function QuotationFlow({ onCancel, onDone, active = true, standalone = false, onStateChange }) {
  const Heading = standalone ? 'h2' : 'h4';
  const DetailHeading = standalone ? 'h3' : 'h5';
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [packageId, setPackageId] = useState('');
  const [addonIds, setAddonIds] = useState([]);
  const [client, setClient] = useState(emptyClient);
  const [identity, setIdentity] = useState(() => ({ now: new Date(), reference: createQuoteReference() }));
  const [showAllAddons, setShowAllAddons] = useState(false);
  const [addonQuery, setAddonQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState('');
  const root = useRef(null);
  const fileUrl = useRef(null);
  const generation = useRef(0);
  const working = useRef(false);
  const previousStage = useRef(null);
  const selectedPackage = packageById(packageId);
  const packages = useMemo(() => packagesForCategory(category), [category]);
  const allAddons = useMemo(() => compatibleAddons(selectedPackage), [selectedPackage]);
  const visibleAddons = useMemo(() => {
    const query = addonQuery.trim().toLowerCase();
    const filtered = query ? allAddons.filter(addon => `${addon.name} ${addon.description}`.toLowerCase().includes(query)) : allAddons;
    const featured = filtered.filter(addon => addon.featured || addonIds.includes(addon.id));
    return showAllAddons || query ? filtered : featured.length ? featured : filtered.slice(0, 8);
  }, [allAddons, addonQuery, showAllAddons, addonIds]);
  const quote = useMemo(() => selectedPackage ? buildQuotation({ packageId, addonIds, client, ...identity }) : null, [packageId, addonIds, client, identity, selectedPackage]);
  const categories = projectCategories.filter(item => `${item.label} ${item.id}`.toLowerCase().includes(categoryQuery.trim().toLowerCase()));
  const canContinueBrief = Boolean(client.name.trim() && client.objective.trim());

  useEffect(() => {
    onStateChange?.({ step, category, quote, generated: Boolean(generated) });
  }, [step, category, quote, generated, onStateChange]);

  useEffect(() => () => {
    generation.current += 1;
    if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (standalone) {
      const stage = `${step}:${Boolean(generated)}`;
      if (previousStage.current !== null && previousStage.current !== stage) {
        root.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
        root.current?.querySelector('h2')?.focus({ preventScroll: true });
      }
      previousStage.current = stage;
    } else {
      root.current?.closest('.assistant-chat-transcript')?.scrollTo({ top: 0 });
      root.current?.querySelector('h4')?.focus({ preventScroll: true });
    }
  }, [step, generated, active, standalone]);

  const go = next => {
    if (working.current) return;
    setError('');
    setStep(next);
  };
  const selectCategory = id => {
    if (id !== category) { setPackageId(''); setAddonIds([]); }
    setCategory(id);
    go(1);
  };
  const selectPackage = id => {
    if (id !== packageId) setAddonIds([]);
    setPackageId(id);
    setShowAllAddons(false);
    setAddonQuery('');
    go(2);
  };
  const toggleAddon = id => setAddonIds(current => {
    return current.includes(id) ? current.filter(addonId => addonId !== id) : [...current, id];
  });
  const updateClient = event => setClient(current => ({ ...current, [event.target.name]: event.target.value }));
  const clearFile = () => {
    if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
    fileUrl.current = null;
    setGenerated(null);
  };
  const prepare = async () => {
    if (!quote || !canContinueBrief || working.current) return;
    working.current = true;
    const request = ++generation.current;
    setGenerating(true);
    setError('');
    try {
      const result = await generateQuotationPdf(quote);
      if (request !== generation.current) return;
      const url = URL.createObjectURL(result.blob);
      if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
      fileUrl.current = url;
      setGenerated({ ...result, url, quote });
      onDone?.(quote);
    } catch {
      if (request === generation.current) {
        setError('The PDF could not be prepared. Your quotation is still here. Try again, or share the full details below. If this page was open during a site update, copy your quotation before refreshing.');
      }
    } finally {
      if (request === generation.current) { working.current = false; setGenerating(false); }
    }
  };
  const startAgain = () => {
    clearFile();
    setIdentity({ now: new Date(), reference: createQuoteReference() });
    setCategory(''); setCategoryQuery(''); setPackageId(''); setAddonIds([]); setClient(emptyClient);
    setError(''); setStep(0);
  };

  if (generated) return <div className="quote-flow quote-flow-finished" ref={root}>
    <span className="quote-flow-success"><CheckCircle2 size={28} /></span>
    <p className="quote-flow-kicker">YOUR NEXT STEP, READY</p>
    <Heading tabIndex={-1}>Your draft. Ready to move forward.</Heading>
    <p>Your quotation is prepared. Save the PDF, then send the details to HICH for a final scope and price review.</p>
    <div className="quote-flow-ready-card"><FileText size={23} /><span><strong>{generated.quote.reference}</strong><small>{generated.pages} pages · A4 PDF · {formatLkr(generated.quote.total)}</small></span><Check size={18} /></div>
    <a className="quote-flow-primary" href={generated.url} download={generated.filename}><Download size={16} />Download PDF</a>
    <a className="quote-flow-secondary" href={generated.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />Open PDF</a>
    <p className="quote-flow-share-note">If downloading is blocked, open the PDF and use your browser’s Save or Share option. These links reuse the prepared file.</p>
    {!generated.fontsReady && <p className="quote-flow-share-note">Brand fonts were unavailable, so the PDF uses a standard font. Your quotation details are unchanged.</p>}
    <ShareQuotation quote={generated.quote} />
    <div className="quote-flow-finish-actions">
      <button className="quote-flow-text" type="button" onClick={() => { clearFile(); setStep(4); }}>Edit this quotation</button>
      <button className="quote-flow-text" type="button" onClick={startAgain}>Start a new quotation</button>
    </div>
    {!standalone && <button className="quote-flow-cancel" type="button" onClick={onCancel}>Back to Chathu</button>}
  </div>;

  return <div className="quote-flow" ref={root} aria-busy={generating}>
    <Progress current={step} onChange={go} disabled={generating} />
    {quote && step >= 2 && step < 4 && <div className="quote-flow-running-total" aria-live="polite" aria-atomic="true">
      <span><small>YOUR DRAFT ESTIMATE</small><strong>{formatLkr(quote.total)}</strong></span>
      <span><small>SEPARATE ANNUAL RENEWAL</small><strong>{formatUsd(quote.renewalUsd)}</strong></span>
      <p>{quote.addons.length} optional add-on{quote.addons.length === 1 ? '' : 's'} · Taxes excluded · Subject to review</p>
    </div>}

    {step === 0 && <div className="quote-flow-stage">
      <p className="quote-flow-kicker">LET’S SHAPE YOUR NEXT CHAPTER</p>
      <Heading tabIndex={-1}>What are you planning to build?</Heading>
      <p>A clear scope, a transparent estimate, and something you can take to the team. Start with the closest project type.</p>
      <label className="quote-flow-search"><Search size={15} /><span className="assistant-chat-sr-only">Find a project type</span><input value={categoryQuery} onChange={event => setCategoryQuery(event.target.value)} placeholder="Search: e-commerce, hotel, ERP…" /></label>
      <div className="quote-flow-category-grid">{categories.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => selectCategory(item.id)}><span>{item.label}</span><ArrowRight size={14} /></button>)}</div>
      {!categories.length && <p className="quote-flow-empty">No exact match. Try a broader search{standalone ? ' or choose a related project type.' : ', or ask Chathu about your project.'}</p>}
      <p className="quote-flow-share-note">No payment or signup. Your brief is not submitted to HICH by this builder; you choose what to share.</p>
    </div>}

    {step === 1 && <div className="quote-flow-stage">
      <p className="quote-flow-kicker">YOUR PROJECT FOUNDATION</p>
      <Heading tabIndex={-1}>Choose your starting point.</Heading>
      <p>Options for <strong>{projectCategories.find(item => item.id === category)?.label}</strong>. Compare the scope before choosing; every price is an indicative draft estimate.</p>
      <div className="quote-flow-package-list">{packages.map(item => <div className={`quote-flow-package-card${packageId === item.id ? ' is-selected' : ''}`} key={item.id}>
        <span className="quote-flow-package-top"><strong>{item.name}</strong><b>{formatLkr(item.base_price_lkr)}</b></span>
        <p>{item.summary}</p>
        <details><summary>See all {item.features.length} included features</summary><ul>{item.features.map(feature => <li key={feature}>{feature}</li>)}</ul></details>
        <button
          className={`quote-flow-secondary quote-flow-package-action${packageId === item.id ? ' is-current' : ''}`}
          type="button"
          aria-pressed={packageId === item.id}
          onClick={() => selectPackage(item.id)}
        >
          {packageId === item.id ? <><Check size={14} />Keep this package</> : <>Choose package<ArrowRight size={14} /></>}
        </button>
      </div>)}</div>
      <button className="quote-flow-back" type="button" onClick={() => go(0)}><ArrowLeft size={14} />Change project type</button>
    </div>}

    {step === 2 && <div className="quote-flow-stage">
      <p className="quote-flow-kicker">MAKE IT YOURS</p>
      <Heading tabIndex={-1}>Add only what you need.</Heading>
      <p>Compatible extras for <strong>{selectedPackage.name}</strong>. Included features are never charged again. You can skip this step.</p>
      {selectedPackage.id === 'tourism_basic' && <button className="quote-flow-upgrade" type="button" onClick={() => selectPackage('tourism_booking')}><Sparkles size={15} /><span><strong>Need live bookings and automatic emails?</strong><small>Explore the complete Tourism booking package.</small></span><ArrowRight size={14} /></button>}
      <label className="quote-flow-search"><Search size={14} /><span className="assistant-chat-sr-only">Search add-ons</span><input value={addonQuery} onChange={event => setAddonQuery(event.target.value)} placeholder="Search all compatible add-ons" /></label>
      <div className="quote-flow-addon-list">{visibleAddons.map(addon => <button className={addonIds.includes(addon.id) ? 'is-selected' : ''} type="button" key={addon.id} onClick={() => toggleAddon(addon.id)} aria-pressed={addonIds.includes(addon.id)}>
        <span className="quote-flow-check">{addonIds.includes(addon.id) && <Check size={13} />}</span>
        <span><strong>{addon.name}</strong><small>{addon.description}</small>{addon.estimated_annual_operating_uplift_usd > 0 && <small>Annual renewal: +{formatUsd(addon.estimated_annual_operating_uplift_usd)}</small>}</span>
        <b>{addon.price_lkr ? formatLkr(addon.price_lkr) : 'Included'}</b>
      </button>)}</div>
      {!showAllAddons && !addonQuery && allAddons.length > visibleAddons.length && <button className="quote-flow-more" type="button" onClick={() => setShowAllAddons(true)}>Browse all {allAddons.length} compatible add-ons</button>}
      {!visibleAddons.length && <p className="quote-flow-empty">No compatible add-ons match that search.</p>}
      <div className="quote-flow-nav"><button className="quote-flow-back" type="button" onClick={() => go(1)}><ArrowLeft size={14} />Back</button><button className="quote-flow-primary" type="button" onClick={() => go(3)}>{addonIds.length ? `Continue with ${addonIds.length} add-on${addonIds.length > 1 ? 's' : ''}` : 'Continue without add-ons'}<ArrowRight size={14} /></button></div>
    </div>}

    {step === 3 && <form className="quote-flow-stage quote-flow-form" onSubmit={event => { event.preventDefault(); if (canContinueBrief) go(4); }}>
      <p className="quote-flow-kicker">A LITTLE CONTEXT GOES A LONG WAY</p>
      <Heading tabIndex={-1}>Tell us about your idea.</Heading>
      <p>Only your name and project goal are required. Your details appear in the PDF and in the message you choose to share.</p>
      <div className="quote-flow-fields">
        <label><span>Your name *</span><input name="name" autoComplete="name" value={client.name} onChange={updateClient} required maxLength={80} placeholder="Full name" /></label>
        <label><span>Business / organisation</span><input name="company" autoComplete="organization" value={client.company} onChange={updateClient} maxLength={100} placeholder="Company name" /></label>
        <label><span>Email</span><input type="email" name="email" autoComplete="email" value={client.email} onChange={updateClient} maxLength={120} placeholder="name@company.com" /></label>
        <label><span>Contact number</span><input type="tel" name="phone" autoComplete="tel" value={client.phone} onChange={updateClient} maxLength={30} placeholder="+94 …" /></label>
        <label className="quote-flow-field-wide"><span>What should this project achieve? *</span><textarea name="objective" value={client.objective} onChange={updateClient} required maxLength={500} rows={4} placeholder="Who is it for? What should they be able to do? What matters most?" /><small>{client.objective.length}/500 · Please do not include passwords or payment details.</small></label>
        <label className="quote-flow-field-wide"><span>Preferred launch date</span><input name="targetLaunch" value={client.targetLaunch} onChange={updateClient} maxLength={80} placeholder="A date, a month, or flexible" /><small>A preference, not a confirmed delivery commitment.</small></label>
      </div>
      <div className="quote-flow-nav"><button className="quote-flow-back" type="button" onClick={() => go(2)}><ArrowLeft size={14} />Back</button><button className="quote-flow-primary" type="submit" disabled={!canContinueBrief}>Review quotation<ArrowRight size={14} /></button></div>
    </form>}

    {step === 4 && quote && <div className="quote-flow-stage quote-flow-review">
      <p className="quote-flow-kicker">THE COMPLETE PICTURE</p>
      <Heading tabIndex={-1}>Make sure it feels right.</Heading>
      <p>Review your scope and separate one-time and annual costs. You can edit any earlier step before preparing the PDF.</p>
      <div className="quote-flow-review-client"><span>Prepared for</span><strong>{client.company || client.name}</strong><small>{[client.company && client.name, client.email, client.phone].filter(Boolean).join(' · ')}</small></div>
      <div className="quote-flow-brief-preview"><p>{client.objective}</p><small>Preferred launch: {client.targetLaunch || 'To be discussed'}</small></div>
      <div className="quote-flow-review-items">
        <div><span><strong>{quote.package.name}</strong><small>Project foundation</small></span><b>{formatLkr(quote.basePrice)}</b></div>
        {quote.addons.map(addon => <div key={addon.id}><span><strong>{addon.name}</strong><small>Optional enhancement</small></span><b>{formatLkr(addon.price_lkr)}</b></div>)}
      </div>
      <div className="quote-flow-total"><span>Indicative project investment<small>One-time · Taxes excluded</small></span><strong>{formatLkr(quote.total)}</strong></div>
      <div className="quote-flow-renewal"><span><strong>{formatUsd(quote.renewalUsd)}</strong><small>Separate consolidated annual renewal estimate · Usage-dependent</small></span><Sparkles size={16} /></div>
      <div className="quote-flow-milestones"><DetailHeading>Proposed payment stages</DetailHeading>{quote.milestones.map(stage => <div key={stage.title}><span><b>{stage.percentage}%</b>{stage.title}</span><strong>{formatLkr(stage.amount)}</strong></div>)}</div>
      <p className="quote-flow-share-note">Reference: {quote.reference} · Planning validity: {quote.validUntil}. Third-party processing, messaging and subscription fees are excluded unless agreed.</p>
      <p className="quote-flow-notice">This is a draft estimate, not a final quotation or contract. Validate the scope, pricing, timeline and terms with HICH before approval or payment.{quote.approvalRequired ? ' Custom or managed-service items also require technical review.' : ''}</p>
      {error && <p className="quote-flow-pdf-error" role="alert">{error}</p>}
      <div className="quote-flow-nav"><button className="quote-flow-back" type="button" onClick={() => go(3)} disabled={generating}><ArrowLeft size={14} />Edit brief</button><button className="quote-flow-primary quote-flow-generate" type="button" onClick={prepare} disabled={generating}>{generating ? <><LoaderCircle className="quote-flow-spin" size={16} />Preparing PDF…</> : <><FileText size={15} />Prepare quotation PDF</>}</button></div>
      {generating && <p className="quote-flow-share-note" role="status">Preparing your document. Download and Open PDF links will appear when it is ready.</p>}
      {error && <ShareQuotation quote={quote} />}
    </div>}
    {!standalone && <button className="quote-flow-cancel" type="button" onClick={onCancel} disabled={generating}>Back to chat · Keep this draft</button>}
  </div>;
}

