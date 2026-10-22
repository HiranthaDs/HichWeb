import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Download, FileText, LoaderCircle, MessageCircle, Search, Sparkles } from 'lucide-react';
import {
  buildQuotation, compatibleAddons, formatLkr, formatUsd, packageById, packagesForCategory,
  projectCategories, quotationCatalog,
} from './quotation-engine.js';
import { generateQuotationPdf } from './quotation-pdf.js';

const steps = ['Project', 'Package', 'Add-ons', 'Brief', 'Review'];
const emptyClient = { name: '', company: '', email: '', phone: '', objective: '', targetLaunch: '' };

function FlowLoader({ label }) {
  return <div className="quote-flow-loader" role="status">
    <span><Sparkles size={19} /></span>
    <div><strong>{label}</strong><small>Matching your requirements with the HICH catalog</small></div>
    <i /><i /><i />
  </div>;
}

function Progress({ current }) {
  return <div className="quote-flow-progress" aria-label={`Quotation step ${current + 1} of ${steps.length}`}>
    <div><span style={{ width: `${((current + 1) / steps.length) * 100}%` }} /></div>
    <p><strong>{String(current + 1).padStart(2, '0')}</strong> / {String(steps.length).padStart(2, '0')} · {steps[current]}</p>
  </div>;
}

export default function QuotationFlow({ onCancel, onDone }) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [packageId, setPackageId] = useState('');
  const [addonIds, setAddonIds] = useState([]);
  const [client, setClient] = useState(emptyClient);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Loading project options');
  const [showAllAddons, setShowAllAddons] = useState(false);
  const [addonQuery, setAddonQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState('');
  const timer = useRef(null);
  const selectedPackage = packageById(packageId);
  const packages = useMemo(() => packagesForCategory(category), [category]);
  const allAddons = useMemo(() => compatibleAddons(selectedPackage), [selectedPackage]);
  const visibleAddons = useMemo(() => {
    const query = addonQuery.trim().toLowerCase();
    const filtered = query ? allAddons.filter(addon => `${addon.name} ${addon.description}`.toLowerCase().includes(query)) : allAddons;
    return showAllAddons || query ? filtered : filtered.filter(addon => addon.featured).slice(0, 8);
  }, [allAddons, addonQuery, showAllAddons]);
  const quote = useMemo(() => selectedPackage ? buildQuotation({ packageId, addonIds, client }) : null, [packageId, addonIds, client, selectedPackage]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (next, label) => {
    clearTimeout(timer.current);
    setLoadingLabel(label);
    setLoading(true);
    timer.current = window.setTimeout(() => {
      setStep(next);
      setLoading(false);
    }, 420);
  };

  const selectCategory = id => {
    setCategory(id);
    setPackageId('');
    setAddonIds([]);
    go(1, 'Finding the right project packages');
  };
  const selectPackage = id => {
    setPackageId(id);
    setAddonIds([]);
    go(2, 'Checking compatible add-ons');
  };
  const toggleAddon = id => setAddonIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const updateClient = event => setClient(current => ({ ...current, [event.target.name]: event.target.value }));
  const canContinueBrief = client.name.trim() && client.objective.trim();

  const download = async () => {
    if (!quote || generating) return;
    setGenerating(true);
    setError('');
    try {
      const result = await generateQuotationPdf(quote);
      setGenerated({ ...result, reference: quote.reference });
      onDone?.(quote);
    } catch (caught) {
      setError(caught?.message || 'The PDF could not be created. Please try again.');
    } finally { setGenerating(false); }
  };

  if (loading) return <div className="quote-flow"><Progress current={Math.min(step, 4)} /><FlowLoader label={loadingLabel} /></div>;

  if (generated) return <div className="quote-flow quote-flow-finished">
    <span className="quote-flow-success"><CheckCircle2 size={28} /></span>
    <p className="quote-flow-kicker">DRAFT QUOTATION READY</p>
    <h4>Your HICH draft quotation is ready.</h4>
    <p>The branded A4 PDF has been downloaded with your scope, indicative pricing, annual renewal, payment stages, commercial notes and HICH validation details.</p>
    <div className="quote-flow-ready-card"><FileText size={20} /><span><strong>{generated.reference}</strong><small>{generated.pages} page HICH draft quotation</small></span><Check size={18} /></div>
    <button className="quote-flow-primary" type="button" onClick={download} disabled={generating}><Download size={15} />Download again</button>
    <a className="quote-flow-secondary" href={`https://wa.me/${quotationCatalog.company.whatsapp}?text=${encodeURIComponent(`Hello HICH, I generated draft quotation ${generated.reference} with Chathu and would like to validate it with your team.`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} />Validate it on WhatsApp</a>
    <button className="quote-flow-text" type="button" onClick={onCancel}>Start another conversation</button>
  </div>;

  return <div className="quote-flow">
    <Progress current={step} />

    {step === 0 && <div className="quote-flow-stage">
      <p className="quote-flow-kicker">LET’S SHAPE THE PROJECT</p>
      <h4>What are you planning to build?</h4>
      <p>Choose the closest project type. Chathu will only show packages and extras that fit.</p>
      <div className="quote-flow-category-grid">
        {projectCategories.map(item => <button type="button" key={item.id} onClick={() => selectCategory(item.id)}><span>{item.label}</span><ArrowRight size={14} /></button>)}
      </div>
    </div>}

    {step === 1 && <div className="quote-flow-stage">
      <p className="quote-flow-kicker">MATCHED PACKAGES</p>
      <h4>Choose your starting point.</h4>
      <p>Every option below matches <strong>{projectCategories.find(item => item.id === category)?.label}</strong>.</p>
      <div className="quote-flow-package-list">
        {packages.map(item => <button type="button" key={item.id} onClick={() => selectPackage(item.id)}>
          <span className="quote-flow-package-top"><strong>{item.name}</strong><b>{formatLkr(item.base_price_lkr)}</b></span>
          <span>{item.summary}</span>
          <small>{item.features.slice(0, 3).join(' · ')}</small>
          <i>Choose package <ArrowRight size={13} /></i>
        </button>)}
      </div>
      <button className="quote-flow-back" type="button" onClick={() => setStep(0)}><ArrowLeft size={14} />Change project type</button>
    </div>}

    {step === 2 && <div className="quote-flow-stage">
      <p className="quote-flow-kicker">SMART EXTRAS</p>
      <h4>Would you like any add-ons?</h4>
      <p>These are compatible with <strong>{selectedPackage.name}</strong>. You can skip this step.</p>
      {selectedPackage.id === 'tourism_basic' && <button className="quote-flow-upgrade" type="button" onClick={() => selectPackage('tourism_booking')}><Sparkles size={15} /><span><strong>Need live bookings and automatic emails?</strong><small>Switch to the complete Tourism booking package instead of stacking an arbitrary fee.</small></span><ArrowRight size={14} /></button>}
      {showAllAddons && <label className="quote-flow-search"><Search size={14} /><span className="assistant-chat-sr-only">Search add-ons</span><input value={addonQuery} onChange={event => setAddonQuery(event.target.value)} placeholder="Search compatible add-ons" /></label>}
      <div className="quote-flow-addon-list">
        {visibleAddons.map(addon => <button className={addonIds.includes(addon.id) ? 'is-selected' : ''} type="button" key={addon.id} onClick={() => toggleAddon(addon.id)} aria-pressed={addonIds.includes(addon.id)}>
          <span className="quote-flow-check">{addonIds.includes(addon.id) && <Check size={13} />}</span>
          <span><strong>{addon.name}</strong><small>{addon.description}</small></span>
          <b>{addon.price_lkr ? formatLkr(addon.price_lkr) : 'Included'}</b>
        </button>)}
      </div>
      {!showAllAddons && allAddons.length > visibleAddons.length && <button className="quote-flow-more" type="button" onClick={() => setShowAllAddons(true)}>Browse all {allAddons.length} compatible add-ons</button>}
      {showAllAddons && !visibleAddons.length && <p className="quote-flow-empty">No compatible add-ons match that search.</p>}
      <div className="quote-flow-nav">
        <button className="quote-flow-back" type="button" onClick={() => setStep(1)}><ArrowLeft size={14} />Back</button>
        <button className="quote-flow-primary" type="button" onClick={() => go(3, 'Preparing your project brief')}>{addonIds.length ? `Continue with ${addonIds.length} add-on${addonIds.length > 1 ? 's' : ''}` : 'Continue without add-ons'}<ArrowRight size={14} /></button>
      </div>
    </div>}

    {step === 3 && <form className="quote-flow-stage quote-flow-form" onSubmit={event => { event.preventDefault(); if (canContinueBrief) go(4, 'Calculating your quotation'); }}>
      <p className="quote-flow-kicker">CLIENT BRIEF</p>
      <h4>Who is this draft for?</h4>
      <p>A few details make the draft quotation useful and presentation-ready.</p>
      <div className="quote-flow-fields">
        <label><span>Your name *</span><input name="name" value={client.name} onChange={updateClient} required maxLength={80} placeholder="Full name" /></label>
        <label><span>Business / organisation</span><input name="company" value={client.company} onChange={updateClient} maxLength={100} placeholder="Company name" /></label>
        <label><span>Email</span><input type="email" name="email" value={client.email} onChange={updateClient} maxLength={120} placeholder="name@company.com" /></label>
        <label><span>Contact number</span><input type="tel" name="phone" value={client.phone} onChange={updateClient} maxLength={30} placeholder="+94 ..." /></label>
        <label className="quote-flow-field-wide"><span>What should this project achieve? *</span><textarea name="objective" value={client.objective} onChange={updateClient} required maxLength={500} rows={4} placeholder="Describe the business goal, users and must-have outcome." /></label>
        <label className="quote-flow-field-wide"><span>Target launch</span><input name="targetLaunch" value={client.targetLaunch} onChange={updateClient} maxLength={80} placeholder="For example: January 2027 or flexible" /></label>
      </div>
      <div className="quote-flow-nav">
        <button className="quote-flow-back" type="button" onClick={() => setStep(2)}><ArrowLeft size={14} />Back</button>
        <button className="quote-flow-primary" type="submit" disabled={!canContinueBrief}>Review quotation<ArrowRight size={14} /></button>
      </div>
    </form>}

    {step === 4 && quote && <div className="quote-flow-stage quote-flow-review">
      <p className="quote-flow-kicker">READY TO GENERATE</p>
      <h4>Review your draft quotation.</h4>
      <p>The PDF will use HICH’s website typography, colours and text wordmark in a polished A4 layout.</p>
      <div className="quote-flow-review-client"><span>Prepared for</span><strong>{client.company || client.name}</strong><small>{client.company && client.name}{client.email && ` · ${client.email}`}{client.phone && ` · ${client.phone}`}</small></div>
      <div className="quote-flow-review-items">
        <div><span><strong>{quote.package.name}</strong><small>Project foundation</small></span><b>{formatLkr(quote.basePrice)}</b></div>
        {quote.addons.map(addon => <div key={addon.id}><span><strong>{addon.name}</strong><small>Optional enhancement</small></span><b>{formatLkr(addon.price_lkr)}</b></div>)}
      </div>
      <div className="quote-flow-total"><span>Indicative project investment<small>Taxes excluded</small></span><strong>{formatLkr(quote.total)}</strong></div>
      <div className="quote-flow-renewal"><span><strong>{formatUsd(quote.renewalUsd)}</strong><small>Consolidated annual renewal estimate</small></span><Sparkles size={16} /></div>
      <p className="quote-flow-notice">This PDF is a draft estimate, not a final quotation or proposal. Validate the scope, pricing, timeline and terms with the HICH team before approval or payment.{quote.approvalRequired ? ' This selection also contains custom or managed-service items requiring technical review.' : ''}</p>
      {error && <p className="quote-flow-pdf-error" role="alert">{error}</p>}
      <div className="quote-flow-nav">
        <button className="quote-flow-back" type="button" onClick={() => setStep(3)} disabled={generating}><ArrowLeft size={14} />Edit brief</button>
        <button className="quote-flow-primary quote-flow-generate" type="button" onClick={download} disabled={generating}>{generating ? <><LoaderCircle className="quote-flow-spin" size={16} />Building your PDF…</> : <><Download size={15} />Generate draft A4 PDF</>}</button>
      </div>
    </div>}

    <button className="quote-flow-cancel" type="button" onClick={onCancel}>Exit quotation builder</button>
  </div>;
}

