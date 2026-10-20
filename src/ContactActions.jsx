import React from 'react';
import { ArrowUpRight, Phone } from 'lucide-react';
import './contact-actions.css';

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width="25" height="25" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.47 0 .11 5.36.1 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.25-1.64a11.93 11.93 0 0 0 5.8 1.48h.01C18.65 23.84 24 18.48 24 11.89c0-3.18-1.24-6.17-3.48-8.41Zm-8.46 18.34a9.91 9.91 0 0 1-5.05-1.38l-.36-.22-3.71.97.99-3.61-.24-.37a9.88 9.88 0 0 1-1.51-5.26c0-5.48 4.46-9.94 9.95-9.94a9.86 9.86 0 0 1 7.03 2.92 9.87 9.87 0 0 1 2.91 7.04c0 5.48-4.46 9.94-10.01 9.85Zm5.46-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.21 3.08c.15.2 2.1 3.21 5.09 4.5.71.3 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" /></svg>;
}

export default function ContactActions() {
  return <div className="contact-direct">
    <div className="contact-direct-links" aria-label="Talk directly to HICH">
      <a className="contact-direct-button contact-direct-whatsapp" href="https://wa.me/94714112113" target="_blank" rel="noopener noreferrer">
        <span className="contact-direct-icon"><WhatsAppIcon /></span><span><strong>Chat on WhatsApp</strong><small>Tell us what you have in mind</small></span><ArrowUpRight size={23} aria-hidden="true" />
      </a>
      <a className="contact-direct-button contact-direct-call" href="tel:+94714112113">
        <span className="contact-direct-icon"><Phone size={23} aria-hidden="true" /></span><span><strong>Call the studio</strong><small>+94 714 112 113</small></span><ArrowUpRight size={23} aria-hidden="true" />
      </a>
    </div>
    <p>No brief needed. Just a good conversation.<a href="#project-enquiry">Prefer to write it down? Build a brief <ArrowUpRight size={14} aria-hidden="true" /></a></p>
  </div>;
}
