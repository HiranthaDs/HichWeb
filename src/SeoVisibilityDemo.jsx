import React from 'react';
import { Check, Search } from 'lucide-react';
import './seo-visibility-demo.css';

export default function SeoVisibilityDemo() {
  return <div className="seo-visibility-demo" aria-hidden="true">
    <img
      className="seo-demo-google"
      src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
      alt="Google"
      width="272"
      height="92"
    />

    <div className="seo-demo-search">
      <Search size={14} strokeWidth={2} />
      <span className="seo-demo-query">Your Website</span>
      <span className="seo-demo-caret" />
      <span className="seo-demo-submit"><Search size={13} /></span>
    </div>

    <div className="seo-demo-result-meta">Search results</div>
    <div className="seo-demo-result">
      <div className="seo-result-source"><span>Y</span><p><b>Your Website</b><small>yourwebsite.com</small></p></div>
      <div className="seo-result-title">The service your customers are searching for</div>
      <p className="seo-result-copy">A useful, clearly structured page that helps people and search platforms understand what your business offers.</p>
      <div className="seo-result-signals"><span><Check size={9} /> Clear content</span><span><Check size={9} /> Search ready</span></div>
    </div>

    <div className="seo-demo-cursor">
      <svg viewBox="0 0 24 28" aria-hidden="true"><path d="M2 2 21 15l-8.3 1.5L8 25.5 2 2Z" /></svg>
    </div>
    <span className="seo-demo-click" />

  </div>;
}
