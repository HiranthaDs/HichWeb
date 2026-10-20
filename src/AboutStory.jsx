import React, { useId } from 'react';
import { ArrowUpRight, Plus, Check, Code2, PenTool, Workflow } from 'lucide-react';
import './about-story.css';

const disciplines = [
  { icon: PenTool, number: '01', title: 'Find your expression.', label: 'STRATEGY + DESIGN', text: 'We connect your business goals with the way people see, understand and use your brand. Content structure, interface design, typography and motion work together to give the experience a clear personality.', details: 'Discovery, information architecture, wireframes, visual direction and interactive prototypes.' },
  { icon: Code2, number: '02', title: 'Make it work beautifully.', label: 'ENGINEERING + EXPERIENCE', text: 'We turn the approved direction into responsive websites, storefronts, applications and business tools. Reusable components and considered data structures give the product room to develop as your needs change.', details: 'React interfaces, content systems, application logic, databases and responsive development.' },
  { icon: Workflow, number: '03', title: 'Connect the whole picture.', label: 'INTEGRATIONS + EVOLUTION', text: 'A website lives alongside the people and systems running your business. We plan the connections between enquiries, orders, records and everyday workflows, then agree how the product will be maintained after launch.', details: 'API integrations, workflow automation, launch coordination, documentation and scoped support.' },
];

const questions = [
  ['Who do we build for?', 'We work with people who want a clearer, more useful digital presence: businesses taking their first serious website online, brands refining an established experience, and teams replacing disconnected tools with a focused application. The starting point can be a rough idea, an existing product or a specific operational problem. We help translate that starting point into a brief with priorities you can understand.'],
  ['How do we choose the technology?', 'The product comes first. React and TypeScript help shape interactive interfaces; Supabase and PostgreSQL can support structured data and application features; Python can support automation and data workflows; Google services can connect the tools your team already uses. We evaluate the fit, ownership, recurring costs and maintenance needs before choosing a stack. Each project gets the tools its requirements call for.'],
  ['What does working together feel like?', 'You bring the knowledge of your business. We bring questions, design thinking and technical experience. Together, we agree scope, responsibilities and review points. Working previews make progress visible and give feedback something concrete to respond to. We explain the consequences of a decision, flag dependencies and discuss changes before they become unexpected work.'],
  ['What happens after launch?', 'A considered handover includes the agreed files, account responsibilities, editing guidance and documentation. We discuss maintenance, updates and future improvements as part of the project, with support scope and response expectations set out in writing. The aim is an experience your team understands and a practical plan for keeping it useful.'],
];

export default function AboutStory() {
  const id = useId();
  return <section className="about-story shell" aria-labelledby={`${id}-title`}>
    <div className="about-story-heading" data-reveal>
      <p className="section-label"><span className="label-number">H</span>THE PEOPLE BEHIND THE PIXELS</p>
      <h2 id={`${id}-title`}>CURIOUS BY NATURE.<br /><span>PRECISE BY DESIGN.</span></h2>
      <div className="about-story-intro">
        <p className="about-story-lead">From Sri Lanka.<br />For your next big chapter.</p>
        <div><p>Hich Web Development is a digital design and development studio based in Sri Lanka, working with businesses around the world. We bring the story, the interface and the engineering into one conversation, so your website feels connected to the business behind it.</p><p>We care about the details people notice: a layout that feels right, a response that feels immediate, a small animation that makes an action understandable. We give the same attention to the details behind the screen, from content editing and data flows to the way your team takes ownership.</p><p>Our approach starts with listening. What are your customers trying to do? What is slowing your team down? What should the next version make possible? Those answers guide the work, from the first sketch to the release plan.</p></div>
      </div>
    </div>
    <div className="about-story-disciplines">{disciplines.map(({ icon: Icon, number, title, label, text, details }) => <article key={number} data-reveal>
      <div className="about-story-card-top"><span>{number} / {label}</span><Icon size={24} aria-hidden="true" /></div>
      <h3>{title}</h3><p>{text}</p><div className="about-story-card-detail"><Check size={16} aria-hidden="true" /><p>{details}</p></div>
    </article>)}</div>
    <div className="about-story-questions"><div><p className="section-label">GET TO KNOW THE STUDIO</p><h3>Good work starts<br />with understanding.</h3><a href="/contact.html" className="text-link">Tell us what you have in mind <ArrowUpRight size={18} aria-hidden="true" /></a></div><div>{questions.map(([question, answer], index) => <details key={question} open={index === 0}><summary><h4>{question}</h4><Plus size={19} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div>
  </section>;
}
