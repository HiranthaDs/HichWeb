import React from 'react';
import './client-marquee.css';

const clients = [
  { name: 'AutoXO', file: 'autoxo.png', width: 864, height: 289 },
  { name: 'C.K. Plastics', file: 'C-K-Plastics-Logo-350.png', width: 350, height: 129 },
  { name: 'Dsign Wedding Films', file: 'Dsign.png', width: 714, height: 330 },
  { name: 'French Mobile', file: 'French Mobile.png', width: 408, height: 270 },
  { name: 'Icon Mobile', file: 'icon-mobile.png', width: 350, height: 100, dark: true },
  { name: 'JNET', file: 'jnet.png', width: 520, height: 480 },
  { name: 'Jubili Enterprises', file: 'jubilienterprises.png', width: 311, height: 304 },
  { name: 'Miss Piumi', file: 'Miss Piumi.png', width: 462, height: 465 },
  { name: 'Ride and Rest', file: 'Ride and rest.png', width: 305, height: 309 },
  { name: 'SD Glass', file: 'SD glass.png', width: 1886, height: 728 },
  { name: 'Sithagi Villa', file: 'Sithagi villa.png', width: 1425, height: 1165 },
  { name: 'Vision Engineering', file: 'Vision Engineers.png', width: 536, height: 466 },
];

function ClientGroup({ duplicate = false }) {
  return <div className="client-marquee-group" aria-hidden={duplicate ? 'true' : undefined}>{clients.map(client => <div className={`client-logo-tile ${client.dark ? 'client-logo-tile-dark' : ''}`} key={client.file}><img src={`/Clients/${encodeURIComponent(client.file)}`} alt={duplicate ? '' : client.name} width={client.width} height={client.height} loading={duplicate ? 'lazy' : 'eager'} fetchPriority="low" decoding="async" /></div>)}</div>;
}

export default function ClientMarquee() {
  return <section className="client-marquee" aria-labelledby="client-marquee-title"><div className="client-marquee-heading"><span>SELECTED CLIENTS</span><h2 id="client-marquee-title">BUILT<br />TOGETHER.</h2></div><div className="client-marquee-window"><div className="client-marquee-track"><ClientGroup /><ClientGroup duplicate /></div></div></section>;
}
