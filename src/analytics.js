const rawMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || '';
const measurementId = /^G-[A-Z0-9]+$/i.test(rawMeasurementId) ? rawMeasurementId.toUpperCase() : '';
const collectInDevelopment = import.meta.env.VITE_GA_ENABLE_DEV === 'true';
const debugMode = import.meta.env.VITE_GA_DEBUG === 'true';
const consentKey = 'hich.analytics-consent.v1';
const consentEvent = 'hich:analytics-consent';
const eventNamePattern = /^[a-z][a-z0-9_]{0,39}$/;
const emailValuePattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const phoneValuePattern = /(?:\+?\d[\d\s().-]{7,}\d)/;

let initialized = false;
let collectionStarted = false;
let engagementTrackingStarted = false;
let pageViewSent = false;
let memoryConsent = 'unknown';

const canUseBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

export function isAnalyticsConfigured() {
  return Boolean(measurementId) && (!import.meta.env.DEV || collectInDevelopment);
}

export function getAnalyticsConsent() {
  if (!canUseBrowser()) return 'unknown';
  try {
    const value = window.localStorage.getItem(consentKey);
    memoryConsent = value === 'granted' || value === 'denied' ? value : memoryConsent;
    return memoryConsent;
  } catch {
    return memoryConsent;
  }
}

function gtag(...args) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

function setDefaultConsent() {
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);
}

function updateGoogleConsent(value) {
  gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: value === 'granted' ? 'granted' : 'denied',
  });
}

function canonicalLocation() {
  return document.querySelector('link[rel="canonical"]')?.href
    || `${window.location.origin}${window.location.pathname}`;
}

function pageType(pathname = window.location.pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/contact.html') return 'contact';
  if (pathname === '/quotation.html') return 'quotation';
  if (pathname === '/services.html' || pathname.endsWith('-development.html') || pathname.endsWith('-design.html')) return 'service';
  if (pathname === '/insights.html' || pathname.includes('guide') || pathname.includes('checklist')) return 'insight';
  return 'page';
}

function cleanParameters(parameters) {
  return Object.fromEntries(Object.entries(parameters).flatMap(([key, value]) => {
    if (!/^[a-z][a-z0-9_]{0,39}$/i.test(key) || value === undefined || value === null) return [];
    if (typeof value === 'number') return Number.isFinite(value) ? [[key, value]] : [];
    if (typeof value === 'boolean') return [[key, value]];
    if (typeof value !== 'string') return [];
    const clean = value.replace(/\s+/g, ' ').trim().slice(0, 100);
    if (!clean) return [];
    return [[key, emailValuePattern.test(clean) || phoneValuePattern.test(clean) ? '[redacted]' : clean]];
  }));
}

export function trackEvent(name, parameters = {}) {
  if (!eventNamePattern.test(name) || !collectionStarted || getAnalyticsConsent() !== 'granted') return false;
  gtag('event', name, {
    page_type: pageType(),
    ...cleanParameters(parameters),
    send_to: measurementId,
    transport_type: 'beacon',
  });
  return true;
}

export function trackPageView() {
  if (pageViewSent || !collectionStarted) return;
  pageViewSent = true;
  trackEvent('page_view', {
    page_title: document.title,
    page_location: canonicalLocation(),
    page_path: window.location.pathname,
    page_type: pageType(),
  });
}

function safeLabel(element) {
  return (element.getAttribute('aria-label') || element.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function leadMethod(url) {
  if (url.protocol === 'mailto:') return 'email';
  if (url.protocol === 'tel:') return 'phone';
  if (url.hostname === 'wa.me' || url.hostname.endsWith('.whatsapp.com')) return 'whatsapp';
  return '';
}

function interactionSource(element) {
  if (element.closest('.hich-planner')) return 'project_planner';
  if (element.closest('.quotation-page, .quote-flow')) return 'quotation_builder';
  if (element.closest('.assistant-chat')) return 'assistant';
  if (element.closest('.contact-direct-actions')) return 'contact_page';
  if (element.closest('.site-footer')) return 'footer';
  if (element.closest('.menu-dialog')) return 'navigation_menu';
  if (element.closest('.mobile-dock')) return 'mobile_navigation';
  return pageType();
}

function downloadDetails(element, url) {
  if (!(element instanceof HTMLAnchorElement) || (!element.hasAttribute('download') && !/\.(?:pdf|docx?|xlsx?|zip|txt)$/i.test(url.pathname))) return null;
  const requestedName = element.getAttribute('download') || url.pathname.split('/').pop() || '';
  const extension = requestedName.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() || 'file';
  const context = element.closest('.quote-flow') ? 'quotation' : element.closest('.hich-planner') ? 'project_planner' : pageType();
  return { file_extension: extension, file_context: context };
}

function quotationAction(element) {
  if (!element.closest('.quotation-page')) return '';
  if (element.closest('.quote-flow-generate')) return 'prepare_pdf';
  if (element.closest('.quote-flow-whatsapp')) return 'share_whatsapp';
  const label = safeLabel(element).toLowerCase();
  if (label.includes('copy full quotation')) return 'copy_quotation';
  if (label.includes('start a new quotation')) return 'restart';
  if (label.includes('review quotation')) return 'review';
  return '';
}

function startClickTracking() {
  document.addEventListener('click', event => {
    const element = event.target instanceof Element ? event.target.closest('a, button') : null;
    if (!element) return;

    const quoteAction = quotationAction(element);
    if (quoteAction) {
      trackEvent('quotation_action', { action_name: quoteAction });
      if (quoteAction === 'copy_quotation' || quoteAction === 'share_whatsapp') {
        trackEvent('share', { method: quoteAction === 'copy_quotation' ? 'copy' : 'whatsapp', content_type: 'quotation' });
      }
    }

    const href = element instanceof HTMLAnchorElement ? element.getAttribute('href') : '';
    if (href) {
      let url;
      try { url = new URL(href, window.location.href); } catch { return; }
      const download = downloadDetails(element, url);
      if (download) trackEvent('file_download', download);
      const method = leadMethod(url);
      if (method) {
        trackEvent('generate_lead', { method, lead_source: interactionSource(element) });
        return;
      }
      if (url.origin !== window.location.origin && ['http:', 'https:'].includes(url.protocol)) {
        trackEvent('outbound_click', { link_domain: url.hostname, link_label: safeLabel(element) });
        return;
      }
      if (element.closest('.search-results')) {
        trackEvent('select_content', { content_type: 'site_search_result', item_id: url.pathname });
        return;
      }
      if (element.matches('.pill, .text-link') || element.closest('.footer-cta, .contact-direct-actions')) {
        trackEvent('cta_click', {
          cta_label: safeLabel(element),
          destination_path: url.pathname,
        });
      }
    }
  }, { capture: true });
}

function startFormTracking() {
  const startedForms = new WeakSet();
  document.addEventListener('focusin', event => {
    const form = event.target instanceof Element ? event.target.closest('form[data-analytics-form]') : null;
    if (!form || startedForms.has(form)) return;
    startedForms.add(form);
    trackEvent('form_start', { form_name: form.dataset.analyticsForm });
  });
}

function startErrorTracking() {
  window.addEventListener('error', event => {
    trackEvent('exception', { description: 'browser_runtime_error', error_type: event.error?.name || 'Error', fatal: false });
  });
  window.addEventListener('unhandledrejection', event => {
    trackEvent('exception', { description: 'unhandled_promise_rejection', error_type: event.reason?.name || 'Error', fatal: false });
  });
}

function startScrollTracking() {
  const sent = new Set();
  const thresholds = [25, 50, 75, 90];
  let scheduled = false;
  const measure = () => {
    scheduled = false;
    const available = document.documentElement.scrollHeight - window.innerHeight;
    if (available <= 0) return;
    const depth = Math.round((window.scrollY / available) * 100);
    thresholds.forEach(threshold => {
      if (depth >= threshold && !sent.has(threshold)) {
        sent.add(threshold);
        trackEvent('scroll_depth', { percent_scrolled: threshold });
      }
    });
  };
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(measure);
  }, { passive: true });
}

function metricRating(name, value) {
  const limits = {
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    INP: [200, 500],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
  }[name];
  if (!limits) return 'unknown';
  return value <= limits[0] ? 'good' : value <= limits[1] ? 'needs_improvement' : 'poor';
}

function sendWebVital(name, value) {
  if (!Number.isFinite(value)) return;
  trackEvent('web_vital', {
    metric_name: name,
    metric_value: name === 'CLS' ? Math.round(value * 1000) / 1000 : Math.round(value),
    metric_rating: metricRating(name, value),
  });
}

function observeWebVitals() {
  if (!('PerformanceObserver' in window)) return;
  const supported = PerformanceObserver.supportedEntryTypes || [];
  const observers = [];
  let lcp = 0;
  let cls = 0;
  let inp = 0;

  const observe = (type, callback, options = {}) => {
    if (!supported.includes(type)) return;
    try {
      const observer = new PerformanceObserver(list => list.getEntries().forEach(callback));
      observer.observe({ type, buffered: true, ...options });
      observers.push(observer);
    } catch { /* Older browsers can omit individual performance entry types. */ }
  };

  observe('paint', entry => {
    if (entry.name === 'first-contentful-paint') sendWebVital('FCP', entry.startTime);
  });
  observe('largest-contentful-paint', entry => { lcp = entry.startTime; });
  observe('layout-shift', entry => { if (!entry.hadRecentInput) cls += entry.value; });
  observe('event', entry => { inp = Math.max(inp, entry.duration || 0); }, { durationThreshold: 40 });

  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation) sendWebVital('TTFB', navigation.responseStart);

  let sent = false;
  const flush = () => {
    if (sent) return;
    sent = true;
    if (lcp) sendWebVital('LCP', lcp);
    sendWebVital('CLS', cls);
    if (inp) sendWebVital('INP', inp);
    observers.forEach(observer => observer.disconnect());
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  }, { once: true });
  window.addEventListener('pagehide', flush, { once: true });
}

function startEngagementTracking() {
  if (engagementTrackingStarted) return;
  engagementTrackingStarted = true;
  startClickTracking();
  startFormTracking();
  startErrorTracking();
  startScrollTracking();
  observeWebVitals();
}

function loadGoogleAnalytics() {
  if (collectionStarted || !isAnalyticsConfigured()) return;
  collectionStarted = true;
  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(debugMode ? { debug_mode: true } : {}),
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.hichAnalytics = measurementId;
  document.head.append(script);
}

function startAnalyticsCollection() {
  if (getAnalyticsConsent() !== 'granted') return;
  startEngagementTracking();
  trackPageView();
}

export function setAnalyticsConsent(value) {
  if (!isAnalyticsConfigured() || !['granted', 'denied'].includes(value)) return;
  memoryConsent = value;
  try { window.localStorage.setItem(consentKey, value); } catch { /* Consent still applies to this page. */ }
  updateGoogleConsent(value);
  loadGoogleAnalytics();
  if (value === 'granted') startAnalyticsCollection();
  window.dispatchEvent(new CustomEvent(consentEvent, { detail: value }));
}

export function subscribeToAnalyticsConsent(callback) {
  if (!canUseBrowser()) return () => {};
  const listener = event => callback(event.detail);
  window.addEventListener(consentEvent, listener);
  return () => window.removeEventListener(consentEvent, listener);
}

export function initAnalytics() {
  if (!canUseBrowser() || initialized) return;
  initialized = true;
  if (rawMeasurementId && !measurementId) {
    console.warn('HICH analytics: VITE_GA_MEASUREMENT_ID must look like G-XXXXXXXXXX.');
  }
  if (!isAnalyticsConfigured()) return;
  setDefaultConsent();
  const consent = getAnalyticsConsent();
  if (consent !== 'unknown') updateGoogleConsent(consent);
  // Advanced Consent Mode: load the Google tag after the denied default so
  // Tag Assistant can connect and Google can receive cookieless consent pings.
  // HICH interaction events and analytics storage remain gated by permission.
  loadGoogleAnalytics();
  if (consent === 'granted') startAnalyticsCollection();
}
