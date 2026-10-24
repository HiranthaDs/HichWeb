import React, { useEffect, useState } from 'react';
import {
  getAnalyticsConsent,
  initAnalytics,
  isAnalyticsConfigured,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from './analytics.js';
import './analytics-consent.css';

export default function AnalyticsConsent() {
  const [available, setAvailable] = useState(false);
  const [choice, setChoice] = useState('unknown');
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    initAnalytics();
    const configured = isAnalyticsConfigured();
    setAvailable(configured);
    if (!configured) return undefined;
    setChoice(getAnalyticsConsent());
    return subscribeToAnalyticsConsent(value => {
      setChoice(value);
      setPreferencesOpen(false);
    });
  }, []);

  if (!available) return null;
  const showPanel = choice === 'unknown' || preferencesOpen;

  return <>
    {showPanel && <section className="analytics-consent" role="dialog" aria-label="Analytics privacy choices" aria-live="polite">
      <div>
        <strong>YOUR PRIVACY. YOUR CHOICE.</strong>
        <p>With your permission, Google Analytics helps us understand page visits, useful actions and site performance. Advertising signals are off, and we never send your form entries, quotation details or search text.</p>
        <a href="/privacy-policy.html">Read the privacy notice</a>
      </div>
      <div className="analytics-consent-actions">
        <button type="button" className="analytics-consent-decline" onClick={() => setAnalyticsConsent('denied')}>Decline</button>
        <button type="button" className="analytics-consent-allow" onClick={() => setAnalyticsConsent('granted')}>Allow analytics</button>
      </div>
    </section>}
    {!showPanel && <button type="button" className="analytics-preferences" onClick={() => setPreferencesOpen(true)}>Privacy choices</button>}
  </>;
}
