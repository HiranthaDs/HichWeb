import React from 'react';

/** A consistent vector brand device, never a platform-dependent emoji glyph. */
export default function BrandSpark({ className = '' }) {
  return <svg className={`brand-spark ${className}`} width="1em" height="1em" viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false"><path d="M50 4v92M4 50h92M17.5 17.5l65 65M17.5 82.5l65-65" stroke="currentColor" strokeWidth="6" /></svg>;
}
