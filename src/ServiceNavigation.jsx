import React, { useEffect, useState } from 'react';
import { ArrowDownRight } from 'lucide-react';
import './service-navigation.css';

const sections = [
  ['service-experience', 'Try the experience'],
  ['service-scenarios', 'Where it helps'],
  ['service-scope', 'Your deliverables'],
  ['process', 'How we work'],
  ['faq', 'Good questions'],
];

export default function ServiceNavigation() {
  const [active, setActive] = useState('');
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: '-12% 0px -60% 0px', threshold: 0 });
    sections.forEach(([id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  return <nav className="service-navigation" aria-label="On this service page">
    <div className="shell service-navigation-inner">
      <span className="service-navigation-label"><ArrowDownRight size={17} aria-hidden="true" /> EXPLORE THE DETAILS</span>
      <div className="service-navigation-links">{sections.map(([id, label], index) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => setActive(id)}><span>{String(index + 1).padStart(2, '0')}</span>{label}</a>)}</div>
    </div>
  </nav>;
}

export const serviceHeadlines = {
  'website-development': 'MAKE AN IMPRESSION.',
  'ecommerce-solutions': 'FROM BROWSE TO BUY.',
  'web-application-development': 'COMPLEXITY, SIMPLIFIED.',
  'erp-systems': 'EVERYTHING. CONNECTED.',
  'ui-ux-design': 'FEELS SECOND NATURE.',
  'mobile-app-development': 'ALWAYS WITH YOU.',
  'seo-digital-growth': 'GET FOUND. GO FURTHER.',
  'api-integrations-automation': 'LET THE WORK FLOW.',
  'website-maintenance-support': 'READY FOR WHAT’S NEXT.',
  'digital-product-strategy': 'START WITH CLARITY.',
  'brand-content-design': 'MAKE YOURSELF KNOWN.',
  'technology-stack': 'BUILT TO BUILD ON.',
};

const related = {
  'website-development': ['brand-content-design', 'ui-ux-design', 'seo-digital-growth'],
  'ecommerce-solutions': ['erp-systems', 'api-integrations-automation', 'ui-ux-design'],
  'web-application-development': ['digital-product-strategy', 'ui-ux-design', 'technology-stack'],
  'erp-systems': ['api-integrations-automation', 'web-application-development', 'technology-stack'],
  'ui-ux-design': ['brand-content-design', 'website-development', 'web-application-development'],
  'mobile-app-development': ['ui-ux-design', 'api-integrations-automation', 'digital-product-strategy'],
  'seo-digital-growth': ['brand-content-design', 'website-development', 'website-maintenance-support'],
  'api-integrations-automation': ['erp-systems', 'ecommerce-solutions', 'technology-stack'],
  'website-maintenance-support': ['technology-stack', 'seo-digital-growth', 'website-development'],
  'digital-product-strategy': ['ui-ux-design', 'technology-stack', 'web-application-development'],
  'brand-content-design': ['ui-ux-design', 'website-development', 'seo-digital-growth'],
  'technology-stack': ['web-application-development', 'api-integrations-automation', 'website-maintenance-support'],
};

export function relatedServices(service, services) {
  return (related[service.slug] || []).map(slug => services.find(item => item.slug === slug)).filter(Boolean);
}
