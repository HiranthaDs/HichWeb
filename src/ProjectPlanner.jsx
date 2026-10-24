import { ArrowUpRight, ArrowDown, Check, Plus, Copy, Undo2 } from 'lucide-react';
import BrandSpark from './BrandSpark.jsx';
import { useEffect, useId, useRef, useState } from 'react';

const STORAGE_KEY = 'hich-project-preferences-v1';
const PROJECT_TYPES = [
  { value: 'Website', number: '01', detail: 'A distinctive home for your business.' },
  { value: 'E-commerce', number: '02', detail: 'A better way to browse, buy and come back.' },
  { value: 'Web application', number: '03', detail: 'A useful product, built around your users.' },
  { value: 'ERP / automation', number: '04', detail: 'Connected systems. Less repetitive work.' },
];
const GOALS = ['Build a new brand presence', 'Improve an existing website', 'Generate more enquiries', 'Sell products online', 'Launch a digital product', 'Automate business operations'];
const BUDGETS = ['Let’s work it out together', 'Under US$1,000', 'US$1,000–3,000', 'US$3,000–7,500', 'US$7,500+'];
const TIMINGS = ['Flexible / exploring', 'As soon as possible', 'Within 1–2 months', 'Within 3–6 months'];
const STEPS = ['The project', 'Your goals', 'The details', 'About you'];
const EMPTY = { type: '', goals: [], budget: '', timing: '' };

function readPreferences() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { preferences: EMPTY, remember: false };
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return { preferences: EMPTY, remember: false };
    return {
      remember: true,
      preferences: {
        type: PROJECT_TYPES.some((item) => item.value === saved.type) ? saved.type : '',
        goals: Array.isArray(saved.goals) ? GOALS.filter((goal) => saved.goals.includes(goal)) : [],
        budget: BUDGETS.includes(saved.budget) ? saved.budget : '',
        timing: TIMINGS.includes(saved.timing) ? saved.timing : '',
      },
    };
  } catch {
    return { preferences: EMPTY, remember: false };
  }
}

function Arrow({ back = false }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={back ? 'hich-planner-arrow is-back' : 'hich-planner-arrow'}><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

export default function ProjectPlanner() {
  const instanceId = useId();
  const [preferences, setPreferences] = useState(EMPTY);
  const [remember, setRemember] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState('');
  const [contact, setContact] = useState({ name: '', email: '', company: '' });
  const [errors, setErrors] = useState({});
  const [announcement, setAnnouncement] = useState('');
  const titleRef = useRef(null);
  const formRef = useRef(null);
  const briefRef = useRef(null);
  const hasMounted = useRef(false);
  const isReview = step === 4;
  const fieldId = (name) => `${instanceId}-${name}`;

  useEffect(() => {
    const saved = readPreferences();
    setPreferences(saved.preferences);
    setRemember(saved.remember);
    setDraftLoaded(true);
    if (saved.remember) setAnnouncement('Your saved project preferences have been restored.');
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    try {
      if (remember) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      if (remember) setAnnouncement('This browser could not save your preferences. You can still complete your project brief.');
    }
  }, [preferences, remember, draftLoaded]);

  useEffect(() => {
    if (hasMounted.current) titleRef.current?.focus();
    else hasMounted.current = true;
  }, [step]);

  function updatePreference(name, value) {
    setPreferences((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function toggleGoal(goal) {
    setPreferences((current) => ({ ...current, goals: current.goals.includes(goal) ? current.goals.filter((item) => item !== goal) : [...current.goals, goal] }));
    setErrors((current) => ({ ...current, goals: undefined }));
  }

  function updateContact(name, value) {
    setContact((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function advance(event) {
    event.preventDefault();
    const nextErrors = {};
    if (step === 0 && !preferences.type) nextErrors.type = 'Choose a project type to continue.';
    if (step === 1 && preferences.goals.length === 0) nextErrors.goals = 'Choose at least one goal to continue.';
    if (step === 3) {
      if (!contact.name.trim()) nextErrors.name = 'Please enter your name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) nextErrors.email = 'Please enter a valid email address.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setAnnouncement('There are a few details to check before continuing.');
      requestAnimationFrame(() => {
        const firstError = Object.keys(nextErrors)[0];
        formRef.current?.querySelector(`[name="${firstError}"]`)?.focus();
      });
      return;
    }
    setStep((current) => current + 1);
    setAnnouncement(step === 3 ? 'Your project brief is ready to review. It has not been sent.' : `Step ${step + 2} of 4: ${STEPS[step + 1]}.`);
  }

  function goBack() {
    setErrors({});
    setStep((current) => Math.max(0, current - 1));
    setAnnouncement('');
  }

  function reset() {
    setPreferences({ ...EMPTY, goals: [] });
    setRemember(false);
    setDetails('');
    setContact({ name: '', email: '', company: '' });
    setErrors({});
    setStep(0);
    setAnnouncement('Your brief and saved project preferences have been cleared.');
    titleRef.current?.focus();
  }

  const brief = [
    'HICH — NEW PROJECT ENQUIRY',
    '',
    `Project: ${preferences.type}`,
    `Goals: ${preferences.goals.join('; ')}`,
    `Budget: ${preferences.budget || 'To be discussed'}`,
    `Timing: ${preferences.timing || 'To be discussed'}`,
    '',
    'MORE ABOUT THE PROJECT',
    details.trim() || 'Let’s discuss the details.',
    '',
    'CONTACT',
    `Name: ${contact.name.trim()}`,
    `Email: ${contact.email.trim()}`,
    ...(contact.company.trim() ? [`Company: ${contact.company.trim()}`] : []),
    '',
    'Created with the project planner at https://hichweb.com',
  ].join('\n');

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      setAnnouncement('Project brief copied. Paste it into your preferred messaging app.');
    } catch {
      briefRef.current?.focus();
      briefRef.current?.select();
      setAnnouncement('Automatic copy is unavailable. Your brief is selected; use your device’s copy command.');
    }
  }

  function downloadBrief() {
    try {
      const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'HICH-project-brief.txt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setAnnouncement('Your project brief download has started.');
    } catch {
      setAnnouncement('The download could not start. Use Copy brief to keep a copy.');
    }
  }

  function ErrorMessage({ name }) {
    return errors[name] ? <p className="hich-planner-error" id={fieldId(`${name}-error`)} role="alert">{errors[name]}</p> : null;
  }

  return (
    <section className="hich-planner" aria-labelledby={fieldId('heading')}>
      <div className="hich-planner-intro">
        <p className="hich-planner-eyebrow"><span aria-hidden="true" /> A LITTLE CLARITY GOES A LONG WAY</p>
        <h2 id={fieldId('heading')}>Big ideas.<br />Start here.</h2>
        <p>Tell us what you have in mind. We’ll help turn the right questions into your next great project.</p>
        <div className="hich-planner-intro-note"><span aria-hidden="true"><ArrowUpRight size={20} aria-hidden="true" /></span><p>About two minutes.<br />No account. Just possibilities.</p></div>
      </div>

      <div className="hich-planner-workspace">
        <ol className="hich-planner-progress" aria-label="Project brief progress">
          {STEPS.map((label, index) => <li key={label} className={`${index === step ? 'is-current' : ''} ${index < step ? 'is-complete' : ''}`} aria-current={index === step ? 'step' : undefined}><span className="hich-planner-step-number" aria-hidden="true">{index < step ? <Check size={13} /> : `0${index + 1}`}</span><span>{label}</span><span className="hich-planner-sr-only">{index < step ? ', completed' : index === step ? ', current step' : ''}</span></li>)}
        </ol>

        {!isReview ? <form ref={formRef} onSubmit={advance} noValidate>
          <div className="hich-planner-stage-header">
            <p className="hich-planner-stage-kicker">STEP 0{step + 1} / 04</p>
            <h3 ref={titleRef} tabIndex={-1}>{['What are we building?', 'What would success look like?', 'A little more direction.', 'Let’s put a name to the idea.'][step]}</h3>
            <p>{['Choose the closest fit. We can refine the scope together.', 'Choose everything that matters to your business.', 'An early estimate is enough. Both fields are optional.', 'These details go into your brief. You choose when and how to send it.'][step]}</p>
          </div>

          {step === 0 && <fieldset className="hich-planner-fieldset" aria-describedby={errors.type ? fieldId('type-error') : undefined}>
            <legend className="hich-planner-sr-only">Project type (required)</legend>
            <div className="hich-planner-type-grid">{PROJECT_TYPES.map((item) => <label className={`hich-planner-type-card ${preferences.type === item.value ? 'is-selected' : ''}`} key={item.value}>
              <input type="radio" name="type" value={item.value} checked={preferences.type === item.value} onChange={() => updatePreference('type', item.value)} required aria-invalid={Boolean(errors.type)} aria-describedby={errors.type ? fieldId('type-error') : undefined} />
              <span className="hich-planner-card-top"><span>{item.number}</span><span className="hich-planner-choice-dot" aria-hidden="true" /></span>
              <strong>{item.value}</strong><span className="hich-planner-card-detail">{item.detail}</span>
            </label>)}</div>
            <ErrorMessage name="type" />
          </fieldset>}

          {step === 1 && <>
            <fieldset className="hich-planner-fieldset" aria-describedby={errors.goals ? fieldId('goals-error') : undefined}>
              <legend className="hich-planner-sr-only">Project goals (choose at least one)</legend>
              <div className="hich-planner-goals">{GOALS.map((goal) => <label className={`hich-planner-goal ${preferences.goals.includes(goal) ? 'is-selected' : ''}`} key={goal}><input name="goals" type="checkbox" checked={preferences.goals.includes(goal)} onChange={() => toggleGoal(goal)} aria-invalid={Boolean(errors.goals)} aria-describedby={errors.goals ? fieldId('goals-error') : undefined} /><span>{goal}</span><span className="hich-planner-goal-check" aria-hidden="true">{preferences.goals.includes(goal) ? <Check size={14} /> : <Plus size={13} />}</span></label>)}</div>
              <ErrorMessage name="goals" />
            </fieldset>
            <div className="hich-planner-field"><label htmlFor={fieldId('details')}>Anything else on your mind? <span>Optional</span></label><textarea id={fieldId('details')} name="details" rows={3} maxLength={2000} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Your idea, current challenges, or a website you love…" /><p className="hich-planner-field-hint">A few lines are plenty. Please leave out passwords or sensitive information.</p></div>
          </>}

          {step === 2 && <div className="hich-planner-details-grid">
            <div className="hich-planner-field"><label htmlFor={fieldId('budget')}>Working budget <span>Optional · USD</span></label><select id={fieldId('budget')} name="budget" value={preferences.budget} onChange={(event) => updatePreference('budget', event.target.value)}><option value="">Select a range</option>{BUDGETS.map((budget) => <option value={budget} key={budget}>{budget}</option>)}</select><p className="hich-planner-field-hint">This helps us understand scope. It is not a quote.</p></div>
            <div className="hich-planner-field"><label htmlFor={fieldId('timing')}>Ideal timing <span>Optional</span></label><select id={fieldId('timing')} name="timing" value={preferences.timing} onChange={(event) => updatePreference('timing', event.target.value)}><option value="">Select a timeframe</option>{TIMINGS.map((timing) => <option value={timing} key={timing}>{timing}</option>)}</select><p className="hich-planner-field-hint">We’ll agree on a realistic schedule together.</p></div>
            <div className="hich-planner-callout"><span aria-hidden="true"><BrandSpark /></span><p><strong>Still figuring it out?</strong> That’s a good place to start. Skip these for now and we can talk through the options.</p></div>
          </div>}

          {step === 3 && <div className="hich-planner-contact-fields">
            <div className="hich-planner-field"><label htmlFor={fieldId('name')}>Your name <span>Required</span></label><input id={fieldId('name')} name="name" autoComplete="name" required maxLength={100} value={contact.name} onChange={(event) => updateContact('name', event.target.value)} placeholder="Alex Morgan" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? fieldId('name-error') : undefined} /><ErrorMessage name="name" /></div>
            <div className="hich-planner-field"><label htmlFor={fieldId('email')}>Email address <span>Required</span></label><input id={fieldId('email')} name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={contact.email} onChange={(event) => updateContact('email', event.target.value)} placeholder="alex@yourcompany.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? fieldId('email-error') : undefined} /><ErrorMessage name="email" /></div>
            <div className="hich-planner-field"><label htmlFor={fieldId('company')}>Company / organisation <span>Optional</span></label><input id={fieldId('company')} name="company" autoComplete="organization" maxLength={150} value={contact.company} onChange={(event) => updateContact('company', event.target.value)} placeholder="Your company" /></div>
            <p className="hich-planner-privacy-note">Your name, email, company and project notes stay in this page’s memory until you choose a sharing option. They are not saved in browser storage. <a href="/privacy-policy.html">Privacy policy <ArrowUpRight size={12} aria-hidden="true" /></a></p>
          </div>}

          <div className="hich-planner-navigation">
            {step > 0 ? <button className="hich-planner-back" type="button" onClick={goBack}><Arrow back /> Back</button> : <span className="hich-planner-required-note">Choose one to get started.</span>}
            <button className="hich-planner-primary" type="submit">{step === 3 ? 'Review my brief' : 'Continue'}<Arrow /></button>
          </div>
        </form> : <div className="hich-planner-review">
          <div className="hich-planner-stage-header"><p className="hich-planner-stage-kicker">LOOKING GOOD</p><h3 ref={titleRef} tabIndex={-1}>Your next chapter,<br />in a nutshell.</h3><p>Your brief is ready. Review it below, then choose how to share it with HICH.</p></div>
          <label className="hich-planner-review-label" htmlFor={fieldId('brief')}>Your project brief</label>
          <textarea ref={briefRef} id={fieldId('brief')} className="hich-planner-brief" readOnly rows={11} value={brief} spellCheck={false} />
          <p className="hich-planner-send-note"><span aria-hidden="true"><ArrowUpRight size={20} aria-hidden="true" /></span> Nothing has been sent yet. Email and WhatsApp open a draft for you to send.</p>
          <div className="hich-planner-share-actions"><a className="hich-planner-primary" href={`mailto:info@hichweb.com?subject=${encodeURIComponent(`New ${preferences.type.toLowerCase()} project — ${contact.name.trim()}`)}&body=${encodeURIComponent(brief)}`}>Open email draft<Arrow /></a><a className="hich-planner-secondary" href={`https://wa.me/94714112113?text=${encodeURIComponent(brief)}`} target="_blank" rel="noopener noreferrer">Open WhatsApp<span aria-hidden="true"><ArrowUpRight size={20} aria-hidden="true" /></span><span className="hich-planner-sr-only"> (opens in a new tab)</span></a></div>
          <div className="hich-planner-utility-actions"><button type="button" onClick={copyBrief}>Copy brief <span aria-hidden="true"><Copy size={17} aria-hidden="true" /></span></button><button type="button" onClick={downloadBrief}>Download .txt <span aria-hidden="true"><ArrowDown size={17} aria-hidden="true" /></span></button><button type="button" onClick={goBack}>Edit details <span aria-hidden="true"><Undo2 size={17} aria-hidden="true" /></span></button></div>
          <p className="hich-planner-fallback">Prefer a direct conversation? <a href="mailto:info@hichweb.com">info@hichweb.com</a></p>
        </div>}

        <div className="hich-planner-draft-options"><label><input type="checkbox" checked={remember} onChange={(event) => { setRemember(event.target.checked); setAnnouncement(event.target.checked ? 'Only your project type, goals, budget and timing will be remembered on this device.' : 'Saved project preferences have been removed from this device.'); }} /><span>Remember project preferences on this device.<small>Only type, goals, budget and timing. No personal details.</small></span></label><button type="button" onClick={reset}>Start over</button></div>
        <p className="hich-planner-announcement" aria-live="polite" aria-atomic="true">{announcement}</p>
      </div>
    </section>
  );
}
