import "./PricingPage.css";

export default function PricingPage({ onBack, onStartFree, onGetSimple, onGetAdvance }) {
  return (
    
    <section className="sec pricing-page" id="pricing" data-reveal>
      
      <p className="stag">Pricing</p>
      <h2>Subscriptions that stay simple</h2>
      <p className="ssub">
        Start free and upgrade only when you need more control. Two plans,
        no hidden steps.
      </p>
<div className="pricing-grid">
  <article className="pricing-card">
    <div className="pricing-head">
      <div>
        <p className="pricing-tier">Free</p>
        <p className="pricing-price">0</p>
        <p className="pricing-cycle">Forever free</p>
      </div>
      <span className="pricing-tag">Starter</span>
    </div>
    <ul className="pricing-list">
      <li>Live array & sorting animations</li>
      <li>10 curated practice problems</li>
      <li>Complexity hints (Big-O)</li>
      <li>2 topic cheatsheets</li>
      <li>Community discussion access</li>
    </ul>
    <button className="bg pricing-cta" onClick={onStartFree}>Start Free</button>
  </article>

  <article className="pricing-card featured">
    <div className="pricing-head">
      <div>
        <p className="pricing-tier">Simple</p>
        <p className="pricing-price">99</p>
        <p className="pricing-cycle">Per month</p>
      </div>
      <span className="pricing-tag">Popular</span>
    </div>
    <ul className="pricing-list">
      <li>Everything in Free</li>
      <li>Unlimited live visualizations</li>
      <li>Full problem library (100+)</li>
      <li>Step-by-step code walkthroughs</li>
      <li>PDF notes & topic summaries</li>
      <li>Progress tracker & streaks</li>
      <li>Saved sessions (unlimited)</li>
      <li>Email support</li>
    </ul>
    <button className="bp pricing-cta" onClick={onGetSimple}>Get Simple</button>
  </article>

  <article className="pricing-card">
    <div className="pricing-head">
      <div>
        <p className="pricing-tier">Advanced</p>
        <p className="pricing-price">199</p>
        <p className="pricing-cycle">Per month</p>
      </div>
      <span className="pricing-tag">Pro</span>
    </div>
    <ul className="pricing-list">
      <li>Everything in Simple</li>
      <li>Interview-ready problem sets</li>
      <li>Mock interview simulator</li>
      <li>Company-wise filter (FAANG+)</li>
      <li>1-on-1 doubt sessions (2/mo)</li>
      <li>Resume & GitHub review</li>
      <li>Custom learning roadmap</li>
      <li>24/7 priority support</li>
    </ul>
    <button className="bp pricing-cta" onClick={onGetAdvance}>Get Advanced</button>
  </article>
</div>

    </section>
  );
}
