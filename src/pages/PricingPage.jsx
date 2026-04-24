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
              <p className="pricing-cycle">Forever</p>
            </div>
            <span className="pricing-tag">Starter</span>
          </div>
          <ul className="pricing-list">
            <li>Live array animations</li>
            <li>Curated practice problems</li>
            <li>Complexity hints</li>
            <li>Community updates</li>
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
            <li>Unlimited saved sessions</li>
            <li>Priority support</li>
            <li>Team-ready sharing</li>
            <li>Add your own features</li>
          </ul>
          <button className="bp pricing-cta" onClick={onGetSimple}>Get Simple</button>
        </article>
        
        <article className="pricing-card">
          <div className="pricing-head">
            <div>
              <p className="pricing-tier">Advance</p>
              <p className="pricing-price">199</p>
              <p className="pricing-cycle">Per month</p>
            </div>
            <span className="pricing-tag">Pro</span>
          </div>
          <ul className="pricing-list">
            <li>Everything in Simple</li>
            <li>Unlimited private workspaces</li>
            <li>Advanced analytics</li>
            <li>Team onboarding support</li>
            <li>Priority roadmap access</li>
          </ul>
          <button className="bp pricing-cta" onClick={onGetAdvance}>Get Advance</button>
        </article>
        
      </div>

    </section>
  );
}
