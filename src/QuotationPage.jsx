import React, { useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, FileCheck2, CreditCard, ChevronDown, Layers3, LockKeyhole } from 'lucide-react';
import QuotationFlow from './QuotationFlow.jsx';
import BrandSpark from './BrandSpark.jsx';
import { formatLkr, formatUsd, projectCategories } from './quotation-engine.js';
import './assistant-chat.css';
import './quotation-flow.css';
import './quotation-page.css';

const stageNames = ['Project type', 'Your package', 'The details', 'Your brief', 'Final review'];

function ProjectSummary({ state }) {
  const { quote, category, step, generated } = state;
  const [expanded, setExpanded] = useState(false);
  const categoryName = projectCategories.find(item => item.id === category)?.label;
  const status = generated ? 'Your PDF is ready' : quote ? 'Updated with your selections' : category ? 'Project selected · Choose your package' : 'Ready for your first selection';
  const announcement = quote
    ? `${categoryName}. ${quote.package.name}. ${quote.addons.length} add-ons selected. Project total ${formatLkr(quote.total)}. Annual renewal ${formatUsd(quote.renewalUsd)}.`
    : category ? `${categoryName} selected. Choose a package to see your estimate.` : 'Choose your project type to start your quotation.';
  return <aside className="quotation-summary" aria-label="Your quotation overview" data-expanded={expanded}>
    <p className="sr-only" role="status" aria-atomic="true">{announcement}</p>
    <div className="quotation-summary-card">
      <div className="quotation-summary-heading"><span>YOUR PROJECT, AT A GLANCE</span><Layers3 size={18} aria-hidden="true" /></div>
      <p className="quotation-summary-status"><i aria-hidden="true" />{status}</p>
      <h2>{categoryName || 'Your next big idea.'}</h2>
      <p className="quotation-summary-mobile-total">{quote ? formatLkr(quote.total) : 'Your estimate starts with a package'}{quote && <small>{quote.addons.length} selected add-on{quote.addons.length === 1 ? '' : 's'} · One-time estimate</small>}</p>
      <button className="quotation-summary-toggle" type="button" aria-expanded={expanded} aria-controls="quotation-selection-details" onClick={() => setExpanded(value => !value)}>{expanded ? 'Hide selection details' : 'View selection details'}<ChevronDown size={16} aria-hidden="true" /></button>
      <div className="quotation-summary-content" id="quotation-selection-details">
        <div className="quotation-selection-project"><span className="quotation-selection-check">{category ? <Check size={13} aria-hidden="true" /> : '01'}</span><div><small>PROJECT TYPE</small><strong>{categoryName || 'Not selected yet'}</strong></div><span className="quotation-selection-tag">{category ? 'Selected' : 'Next'}</span></div>
        {quote ? <>
          <section className="quotation-selection-package" aria-label="Selected package">
            <div className="quotation-selection-label"><span>YOUR PACKAGE</span><span className="quotation-selection-tag">Selected</span></div>
            <h3 key={quote.package.id}>{quote.package.name}</h3>
            <p>{quote.package.summary}</p>
            <strong className="quotation-selection-price">{formatLkr(quote.basePrice)}<small>One-time foundation</small></strong>
            <details className="quotation-selection-features" key={quote.package.id}>
              <summary>{quote.package.features.length} included features<ChevronDown size={14} aria-hidden="true" /></summary>
              <ul>{quote.package.features.map(feature => <li key={feature}><Check size={12} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
            </details>
          </section>
          <section className="quotation-selection-addons" aria-label="Selected add-ons">
            <div className="quotation-selection-label"><h3>SELECTED ADD-ONS</h3><span className="quotation-selection-count">{quote.addons.length}</span></div>
            {quote.addons.length ? <ul>{quote.addons.map(addon => <li key={addon.id} className="quotation-selection-addon">
              <div className="quotation-selection-addon-title"><span className="quotation-selection-icon">{addon.id === 'full_payment_gateway' ? <CreditCard size={16} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}</span><h4>{addon.name}</h4></div>
              <p>{addon.description}</p>
              <div className="quotation-selection-addon-cost"><strong>{addon.price_lkr ? `+ ${formatLkr(addon.price_lkr)}` : 'Included'}</strong><span>One-time</span></div>
              {addon.estimated_annual_operating_uplift_usd > 0 && <small className="quotation-selection-uplift">Annual operating uplift: +{formatUsd(addon.estimated_annual_operating_uplift_usd)}</small>}
              {addon.id === 'full_payment_gateway' && <small className="quotation-selection-uplift">Payment processing changes the annual renewal base; the updated renewal total is shown below.</small>}
            </li>)}</ul> : <p className="quotation-selection-hint">Package only for now. Select any optional extras to see each service and its price here.</p>}
          </section>
          <dl className="quotation-summary-breakdown">
            <div><dt>Package</dt><dd>{formatLkr(quote.basePrice)}</dd></div>
            <div><dt>Add-ons ({quote.addons.length})</dt><dd>{formatLkr(quote.addonsTotal)}</dd></div>
          </dl>
          <div className="quotation-summary-total"><span>INDICATIVE INVESTMENT</span><strong key={quote.total}>{formatLkr(quote.total)}</strong><small>One-time project cost · Taxes excluded</small></div>
          <div className="quotation-summary-renewal"><span>Separate annual renewal</span><strong key={quote.renewalUsd}>{formatUsd(quote.renewalUsd)}</strong><small>Includes applicable operating uplifts. Usage-dependent estimate.</small></div>
        </> : <div className="quotation-selection-pending">
          <span className="quotation-selection-check">02</span><div><h3>{category ? 'Choose your package next.' : 'Your package comes next.'}</h3><p>{category ? `Explore the packages for ${categoryName}. Your included services and prices will appear here as soon as you select one.` : 'Start with a project type. Then choose a package and tailor it with the services you need.'}</p></div>
        </div>}
        <div className="quotation-summary-step"><span>{generated ? <Check size={13} aria-hidden="true" /> : String(step + 1).padStart(2, '0')}</span><p>{generated ? 'Ready to save & share' : stageNames[step]}<small>{generated ? 'Review the final scope with HICH' : `Step ${step + 1} of 5`}</small></p><ArrowUpRight size={20} aria-hidden="true" /></div>
      </div>
    </div>
    <div className="quotation-summary-note"><LockKeyhole size={16} aria-hidden="true" /><p><strong>Your idea stays yours.</strong>Your brief stays in this page until you choose to share it. Download your PDF before leaving; refreshing resets the draft.</p></div>
  </aside>;
}

export default function QuotationPage() {
  const [state, setState] = useState({ step: 0, category: '', quote: null, generated: false });

  return <div className="quotation-page">
    <div className="quotation-page-content">
      <section className="hero shell quotation-hero-home" aria-labelledby="quotation-title">
        <div className="hero-top"><p>Shape your next project. Explore the possibilities,<br className="desktop-break" /> build your scope, and create your own quotation.</p><span className="hero-edition">THE QUOTATION STUDIO<br />YOUR NEXT CHAPTER STARTS HERE.</span></div>
        <h1 className="hero-title" id="quotation-title"><span className="title-line">GOOD IDEAS.</span><span className="title-line"><span className="blue-accent">CLEAR NUMBERS.</span><span className="hero-asterisk" aria-hidden="true"><BrandSpark /></span></span></h1>
        <div className="hero-bottom"><p>Your ambition. Your starting point.<br /><strong>No sign-up. No payment. Just possibilities.</strong></p><a className="pill quotation-start" href="#quotation-builder"><span>Create your quotation</span><ArrowDown size={19} aria-hidden="true" /></a></div>
        <div className="expertise-ribbon"><span>YOUR IDEA, TAKING SHAPE</span><div><b>Choose.</b><b>Customise.</b><b>Create.</b><span className="ribbon-star" aria-hidden="true"><BrandSpark /></span></div></div>
      </section>

      <div className="quotation-workspace-wrap">
        <div className="quotation-workspace shell">
          <section className="quotation-builder" id="quotation-builder" aria-label="Create your quotation">
            <div className="quotation-builder-top"><span><FileCheck2 size={17} aria-hidden="true" />BUILD YOUR QUOTATION</span><span>DRAFT / {state.generated ? 'READY' : 'IN PROGRESS'}</span></div>
            <QuotationFlow standalone onStateChange={setState} />
            <noscript><p className="quotation-no-script">Enable JavaScript to use the interactive quotation builder, or <a href="/contact.html">contact HICH</a> to prepare your quotation together.</p></noscript>
          </section>
          <ProjectSummary state={state} />
        </div>
      </div>

      <section className="quotation-details shell" aria-labelledby="quotation-details-title">
        <div><span className="quotation-eyebrow">A FEW USEFUL DETAILS</span><h2 id="quotation-details-title" data-reveal>CLEAR FROM<br /><span className="text-blue">THE START.</span></h2><p>A useful first estimate. A conversation before any commitment.</p><a href="/contact.html">Need a hand with your scope?<ArrowUpRight size={17} aria-hidden="true" /></a></div>
        <div className="quotation-details-list">
          <details><summary>What will my quotation include?<span aria-hidden="true">+</span></summary><p>Your selected package, compatible add-ons, project brief, one-time investment, separate annual renewal estimate and proposed payment stages. Prepare a branded PDF, then choose whether to send the full details to HICH through WhatsApp.</p></details>
          <details><summary>Is this the final price?<span aria-hidden="true">+</span></summary><p>This is a draft estimate for planning. Taxes are excluded and annual renewal is shown separately. HICH reviews your scope, price, timeline and terms before anything is approved. Custom and managed-service items can require a technical review.</p></details>
          <details><summary>Does creating this send an enquiry?<span aria-hidden="true">+</span></summary><p>No. Building or downloading a quotation does not submit your brief to HICH. You decide when to share it. A WhatsApp link opens a prepared message; you review and press Send in WhatsApp. Attach your PDF separately if needed.</p></details>
          <details><summary>Can I change my choices?<span aria-hidden="true">+</span></summary><p>Yes. Go back to any completed step to adjust your scope or brief. You can also edit the quotation after preparing your PDF and generate an updated copy. Save your PDF before leaving this page; your draft is not stored when you refresh or close it.</p></details>
        </div>
      </section>
    </div>
  </div>;
}
