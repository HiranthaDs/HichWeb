import React from 'react';
import LogoLoop from './LogoLoop.jsx';
import './client-marquee.css';

const clients = [
  { alt: 'AutoXO', src: '/Clients/autoxo.png', width: 864, height: 289 },
  { alt: 'C.K. Plastics', src: '/Clients/C-K-Plastics-Logo-350.png', width: 350, height: 129 },
  { alt: 'Dsign Wedding Films', src: '/Clients/Dsign.png', width: 714, height: 330 },
  { alt: 'French Mobile', src: '/Clients/French%20Mobile.png', width: 408, height: 270 },
  { alt: 'Icon Mobile', src: '/Clients/icon-mobile.png', width: 350, height: 100, dark: true },
  { alt: 'JNET', src: '/Clients/jnet.png', width: 520, height: 480 },
  { alt: 'Jubili Enterprises', src: '/Clients/jubilienterprises.png', width: 311, height: 304 },
  { alt: 'Miss Piumi', src: '/Clients/Miss%20Piumi.png', width: 462, height: 465 },
  { alt: 'Ride and Rest', src: '/Clients/Ride%20and%20rest.png', width: 305, height: 309 },
  { alt: 'SD Glass', src: '/Clients/SD%20glass.png', width: 1886, height: 728 },
  { alt: 'Sithagi Villa', src: '/Clients/Sithagi%20villa.png', width: 1425, height: 1165 },
  { alt: 'Vision Engineering', src: '/Clients/Vision%20Engineers.png', width: 536, height: 466 },
];

const renderClient = client => <span className={`client-logo-tile${client.dark ? ' client-logo-tile-dark' : ''}`}><img src={client.src} alt={client.alt} width={client.width} height={client.height} loading="lazy" fetchPriority="low" decoding="async" draggable={false} /></span>;

export default function ClientMarquee() {
  return <section className="client-marquee" aria-labelledby="client-marquee-title"><div className="client-marquee-heading"><span>SELECTED CLIENTS</span><h2 id="client-marquee-title">BUILT<br />TOGETHER.</h2></div><div className="client-marquee-window"><LogoLoop className="client-logo-loop" logos={clients} speed={54} direction="left" logoHeight={86} gap={22} hoverSpeed={0} fadeOut fadeOutWidth={0.05} draggable scrollBoost={0.18} intro renderItem={renderClient} ariaLabel="Selected HICH client logos" /></div></section>;
}
