import React, { useId, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CheckCheck, CheckCircle2, CreditCard, Globe2, Layers3, LockKeyhole, Minus, Package, Plus, RotateCcw, ShoppingBag, Truck } from 'lucide-react';
import './commerce-experience.css';

const stages = [
  { title: 'Payment', subtitle: 'A considered checkout.', Icon: CreditCard },
  { title: 'Order', subtitle: 'The details, connected.', Icon: Package },
  { title: 'Fulfilment', subtitle: 'Keep the promise.', Icon: Truck },
];
const money = amount => `LKR ${amount.toLocaleString('en-US')}`;

function BrandLogo({ brand, decorative = false, className = '' }) {
  return <img className={`cx-brand-logo cx-brand-${brand.toLowerCase()} ${className}`} src={`/payment-icons/${brand.toLowerCase()}.svg`} alt={decorative ? '' : brand} width={brand === 'Stripe' ? 108 : 80} height={40} loading="lazy" decoding="async" />;
}

function ProductThumb() {
  return <span className="cx-product-thumb" aria-hidden="true"><ShoppingBag strokeWidth={1.2} /><span>FORM</span></span>;
}

function PaymentStory() {
  return <div className="cx-payment-story">
    <div className="cx-story-copy"><p className="cx-eyebrow">FAMILIAR WAYS TO PAY. A COHERENT EXPERIENCE.</p><h3>Less hesitation.<br /><span>More possibility.</span></h3><p>From a local storefront to a global audience, checkout should feel like a natural next step. We design the journey and connect the right payment provider for your business.</p><div className="cx-story-points"><span><CheckCircle2 size={16} aria-hidden="true" />Clear totals and payment choices</span><span><LockKeyhole size={16} aria-hidden="true" />Provider-managed payment details</span><span><Globe2 size={16} aria-hidden="true" />A gateway suited to your market</span></div><a href="/contact.html" className="cx-text-link">Plan your store <ArrowUpRight size={17} aria-hidden="true" /></a></div>
    <div className="cx-payment-canvas" aria-label="Illustrative payment integration: Visa and Mastercard card networks, and the Stripe payment platform">
      <div className="cx-canvas-top"><span>THE CHECKOUT CONNECTION</span><LockKeyhole size={15} aria-hidden="true" /></div>
      <div className="cx-provider-map">
        <div className="cx-network-group"><span className="cx-map-label">CARD NETWORKS</span><div className="cx-network-cards"><div><BrandLogo brand="Visa" /><span>Visa</span></div><div><BrandLogo brand="Mastercard" /><span>Mastercard</span></div></div></div>
        <div className="cx-map-connector" aria-hidden="true"><span /><ArrowDown size={19} /><span /></div>
        <div className="cx-gateway-card"><span className="cx-map-label">PAYMENT PLATFORM EXAMPLE</span><BrandLogo brand="Stripe" /><span className="cx-gateway-caption">For supported business locations</span></div>
        <div className="cx-map-connector cx-short-connector" aria-hidden="true"><span /><ArrowDown size={19} /><span /></div>
        <div className="cx-store-node"><span><ShoppingBag size={20} aria-hidden="true" /></span><div><strong>Your store.</strong><small>A connected buying journey.</small></div><Check size={17} aria-hidden="true" /></div>
      </div>
      <div className="cx-canvas-bottom"><span>DESIGNED AROUND YOUR BUSINESS</span><span className="cx-status-dot" aria-hidden="true" /></div>
    </div>
  </div>;
}

export default function CommerceExperience() {
  const id = useId();
  const tabs = useRef([]);
  const [stage, setStage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [provider, setProvider] = useState('local');
  const [network, setNetwork] = useState('Visa');
  const [paid, setPaid] = useState(false);
  const [allocated, setAllocated] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [delivery, setDelivery] = useState('Standard');
  const [status, setStatus] = useState('Explore a sample order from checkout to dispatch. No real payment or order is created.');
  const subtotal = quantity * 3200;
  const completed = [paid, allocated, dispatched];

  function changeStage(next, focus = false) {
    setStage(next);
    if (focus) tabs.current[next]?.focus();
  }
  function navigateStage(event, index) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    changeStage(next, true);
  }
  function clearProgress(message) {
    setPaid(false); setAllocated(false); setDispatched(false); setStatus(message);
  }
  function changeQuantity(next) {
    setQuantity(next);
    clearProgress(`Sample bag updated to ${next} ${next === 1 ? 'item' : 'items'}. Payment and order progress have been reset.`);
  }
  function changeProvider(next) {
    setProvider(next);
    clearProgress('Payment route changed. Run the payment simulation again to continue.');
  }
  function reset() {
    setQuantity(1); setProvider('local'); setNetwork('Visa'); setDelivery('Standard'); setStage(0);
    clearProgress('Demo reset. Your sample order is ready to explore again.');
  }
  function simulatePayment() {
    setPaid(true);
    setStatus(`Payment simulation complete for ${money(subtotal)} using ${network} through ${provider === 'stripe' ? 'Stripe' : 'a local gateway'}. No money was charged. Continue to the order stage.`);
  }
  function allocate() {
    if (!paid) return;
    setAllocated(true);
    setStatus(`Sample order confirmed. ${quantity} ${quantity === 1 ? 'unit' : 'units'} reserved; ${24 - quantity} remain available in the sample inventory. No real order was placed.`);
  }
  function dispatch() {
    if (!allocated) return;
    setDispatched(true);
    setStatus(`The sample order is marked as dispatched with ${delivery.toLowerCase()} delivery. This completes the demonstration. No shipment or customer notification was created.`);
  }

  return <section className="commerce-experience" aria-labelledby={`${id}-heading`}>
    <div className="shell">
      <div className="cx-section-heading"><div><p className="section-label"><span>THE BUSINESS BEHIND THE BUY BUTTON</span></p><h2 id={`${id}-heading`}>THE SALE IS<br /><span>JUST THE START.</span></h2></div><p>A beautiful storefront gets things moving. Payments, stock, orders and fulfilment keep them moving. We connect the whole experience.</p></div>
      <PaymentStory />
      <div className="cx-provider-disclosure"><p>Illustrative integration flow. Availability depends on your business location and provider approval.</p><a href="https://stripe.com/global" target="_blank" rel="noopener noreferrer">Stripe availability <ArrowUpRight size={13} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></div>

      <div className="cx-journey-heading"><div><p className="cx-eyebrow">TRY THE PART YOUR CUSTOMERS DON’T SEE</p><h3>One order.<br className="cx-mobile-break" /> Everything in motion.</h3></div><button className="cx-reset" type="button" onClick={reset}><RotateCcw size={14} aria-hidden="true" />Reset demo</button></div>
      <div className="cx-workflow">
        <div className="cx-workflow-top"><span><span className="cx-status-dot" aria-hidden="true" />FORM / COMMERCE OPERATIONS</span><span>INTERACTIVE DEMONSTRATION</span></div>
        <div className="cx-stage-tabs" role="tablist" aria-label="Sample order workflow">{stages.map(({ title, Icon }, index) => <button type="button" key={title} ref={element => { tabs.current[index] = element; }} id={`${id}-tab-${index}`} role="tab" aria-controls={`${id}-panel-${index}`} aria-selected={stage === index} tabIndex={stage === index ? 0 : -1} onClick={() => changeStage(index)} onKeyDown={event => navigateStage(event, index)}><span className="cx-stage-icon">{completed[index] ? <Check size={19} aria-hidden="true" /> : <Icon size={19} aria-hidden="true" />}</span><span><small>0{index + 1}</small>{title}</span><ArrowRight className="cx-stage-arrow" size={17} aria-hidden="true" />{completed[index] && <span className="sr-only">, simulation completed</span>}</button>)}</div>

        <div className="cx-workflow-body">
          <aside className="cx-order-summary" aria-label="Sample basket"><div className="cx-summary-top"><span>SAMPLE ORDER</span><span>#FM-1048</span></div><div className="cx-summary-product"><ProductThumb /><div><small>FORM / EVERYDAY OBJECTS</small><h4>The studio tote.</h4><span>Cobalt / One size</span></div></div><div className="cx-quantity-row"><span>Quantity</span><div className="cx-quantity"><button type="button" aria-label="Remove one sample tote" disabled={quantity === 1} onClick={() => changeQuantity(quantity - 1)}><Minus size={14} aria-hidden="true" /></button><output aria-label="Sample tote quantity">{quantity}</output><button type="button" aria-label="Add one sample tote" disabled={quantity === 4} onClick={() => changeQuantity(quantity + 1)}><Plus size={14} aria-hidden="true" /></button></div></div><div className="cx-total-line"><span>Unit price</span><span>{money(3200)}</span></div><div className="cx-summary-total"><span>Sample subtotal</span><strong>{money(subtotal)}</strong></div><p className="cx-summary-note">Illustrative product and price.<br />Delivery and taxes are outside this demo.</p><ol className="cx-mini-timeline" aria-label="Simulation progress">{['Payment simulated', 'Stock reserved', 'Dispatch simulated'].map((title, index) => <li key={title} className={completed[index] ? 'is-done' : ''}><span aria-hidden="true">{completed[index] ? <Check size={11} /> : index + 1}</span>{title}<small>{completed[index] ? 'Done' : 'Pending'}</small></li>)}</ol></aside>

          <div className="cx-stage-area">
            <div role="tabpanel" id={`${id}-panel-0`} aria-labelledby={`${id}-tab-0`} hidden={stage !== 0} className="cx-stage-panel" tabIndex={0}>
              <div className="cx-panel-heading"><span className="cx-eyebrow">01 / PAYMENT EXPERIENCE</span><h4>A familiar final step.</h4><p>Explore a payment route. In a live store, payment details are handled through the selected provider’s checkout.</p></div>
              <fieldset className="cx-provider-options"><legend>Choose an illustrative payment route</legend><label className={provider === 'local' ? 'is-selected' : ''}><input type="radio" name={`${id}-provider`} value="local" checked={provider === 'local'} onChange={() => changeProvider('local')} /><span className="cx-local-provider-icon"><Globe2 size={22} aria-hidden="true" /></span><span><strong>Local payment gateway</strong><small>Selected for your business and market</small></span><span className="cx-radio-mark" aria-hidden="true" /></label><label className={provider === 'stripe' ? 'is-selected' : ''}><input type="radio" name={`${id}-provider`} value="stripe" checked={provider === 'stripe'} onChange={() => changeProvider('stripe')} /><BrandLogo brand="Stripe" decorative /><span><strong>Stripe</strong><small>For supported business locations</small></span><span className="cx-radio-mark" aria-hidden="true" /></label></fieldset>
              <fieldset className="cx-card-networks"><legend>Sample card network</legend>{['Visa', 'Mastercard'].map(brand => <label key={brand} className={network === brand ? 'is-selected' : ''}><input type="radio" name={`${id}-network`} value={brand} checked={network === brand} onChange={() => { setNetwork(brand); clearProgress('Card network changed. Run the payment simulation again to continue.'); }} /><BrandLogo brand={brand} decorative /><span>{brand}</span>{network === brand && <Check size={14} aria-hidden="true" />}</label>)}</fieldset>
              <div className="cx-panel-action"><button type="button" className="cx-primary" onClick={paid ? () => changeStage(1, true) : simulatePayment}>{paid ? <>Continue to order<ArrowRight size={17} aria-hidden="true" /></> : <>Simulate payment<CreditCard size={17} aria-hidden="true" /></>}</button><span>{paid ? <><CheckCircle2 size={15} aria-hidden="true" />Payment simulated. No charge.</> : <><LockKeyhole size={15} aria-hidden="true" />No card details required.</>}</span></div>
            </div>

            <div role="tabpanel" id={`${id}-panel-1`} aria-labelledby={`${id}-tab-1`} hidden={stage !== 1} className="cx-stage-panel" tabIndex={0}>
              <div className="cx-panel-heading"><span className="cx-eyebrow">02 / ORDER ORCHESTRATION</span><h4>Goodbye, disconnected details.</h4><p>A confirmed payment can trigger one coordinated order flow: reserve stock, update the order and prepare the next task.</p></div>
              <div className="cx-operation-cards"><div><span><CreditCard size={18} aria-hidden="true" />PAYMENT</span><strong>{paid ? 'Simulated' : 'Not started'}</strong><small>{paid ? `${money(subtotal)} / no charge` : 'Complete the payment demo first'}</small></div><div><span><Package size={18} aria-hidden="true" />AVAILABLE STOCK</span><strong>{allocated ? 24 - quantity : 24}<small> units</small></strong><small>{allocated ? `${quantity} reserved for this sample order` : 'Sample inventory / Studio tote'}</small></div></div>
              <div className="cx-order-events"><div><span className={paid ? 'is-done' : ''}>{paid ? <Check size={13} aria-hidden="true" /> : <CreditCard size={13} aria-hidden="true" />}</span><p><strong>Payment confirmation</strong><small>{paid ? 'Sample confirmation is available.' : 'Waiting for the payment simulation.'}</small></p></div><div><span className={allocated ? 'is-done' : ''}><Layers3 size={13} aria-hidden="true" /></span><p><strong>Stock allocation + packing task</strong><small>{allocated ? 'Sample inventory updated. Packing task prepared.' : 'Reserve the selected quantity and prepare the order.'}</small></p></div></div>
              <div className="cx-panel-action"><button type="button" className="cx-primary" onClick={!paid ? () => changeStage(0, true) : allocated ? () => changeStage(2, true) : allocate}>{!paid ? <>Go to payment<ArrowRight size={17} aria-hidden="true" /></> : allocated ? <>Continue to fulfilment<ArrowRight size={17} aria-hidden="true" /></> : <>Confirm sample order<Package size={17} aria-hidden="true" /></>}</button><span>{allocated ? <><CheckCircle2 size={15} aria-hidden="true" />Sample stock reserved.</> : 'All records in this workspace are examples.'}</span></div>
            </div>

            <div role="tabpanel" id={`${id}-panel-2`} aria-labelledby={`${id}-tab-2`} hidden={stage !== 2} className="cx-stage-panel" tabIndex={0}>
              <div className="cx-panel-heading"><span className="cx-eyebrow">03 / FULFILMENT EXPERIENCE</span><h4>Keep the next step clear.</h4><p>Help the team see what is ready, give each order a clear status and keep the customer informed after checkout.</p></div>
              <div className={`cx-shipping-label ${dispatched ? 'is-dispatched' : ''}`}><div><span>FORM / DISPATCH PREVIEW</span><Truck size={23} aria-hidden="true" /></div><strong>{dispatched ? 'On its way.' : allocated ? 'Ready to pack.' : 'Waiting for the order.'}</strong><p>{quantity} × Studio tote / Cobalt</p><div className="cx-shipping-bottom"><span className="cx-barcode" aria-hidden="true" /><span>#FM-1048<br />SAMPLE LABEL</span></div>{dispatched && <span className="cx-dispatch-stamp"><CheckCheck size={15} aria-hidden="true" />DEMO COMPLETE</span>}</div>
              <fieldset className="cx-delivery-options"><legend>Illustrative delivery method</legend>{['Standard', 'Express'].map(method => <label key={method}><input type="radio" name={`${id}-delivery`} value={method} checked={delivery === method} disabled={dispatched} onChange={() => setDelivery(method)} /><span>{method}</span></label>)}</fieldset>
              <div className="cx-panel-action"><button type="button" className="cx-primary" onClick={!allocated ? () => changeStage(paid ? 1 : 0, true) : dispatched ? reset : dispatch}>{!allocated ? <>Complete earlier steps<ArrowRight size={17} aria-hidden="true" /></> : dispatched ? <>Try the journey again<RotateCcw size={17} aria-hidden="true" /></> : <>Simulate dispatch<Truck size={17} aria-hidden="true" /></>}</button><span>{dispatched ? <><CheckCircle2 size={15} aria-hidden="true" />No real shipment was created.</> : 'No label is purchased or notification sent.'}</span></div>
            </div>
          </div>
        </div>
        <div className="cx-demo-status" role="status" aria-live="polite" aria-atomic="true"><span className="cx-status-dot" aria-hidden="true" /><p>{status}</p></div>
      </div>
      <p className="cx-trademark-note">Visa, Mastercard and Stripe are trademarks of their respective owners, shown to illustrate payment technologies. No partnership or endorsement is implied.</p>
    </div>
  </section>;
}
