import "./PricingPage.css";

export default function PricingPage({
  currentPlan = "free",
  pendingPlan = "",
  pricingMessage = "",
  pricingMessageType = "info",
  onBack,
  onStartFree,
  onGetPro,
  onGetAdvanced
}) {
  const normalizedPlan = String(currentPlan || "free").toLowerCase();
  const isPending = Boolean(pendingPlan);

  return (
    
    <section className="sec pricing-page" id="pricing" data-reveal>
      
      <p className="stag">Pricing</p>
      <h2>Subscriptions that stay simple</h2>
      <p className="ssub">
        Start free and upgrade when you need premium access. Pro unlocks
        problem practice and Advanced unlocks the Playground.
      </p>
      {pricingMessage && (
        <div className={`pricing-status ${pricingMessageType === "error" ? "is-error" : "is-success"}`}>
          {pricingMessage}
        </div>
      )}
<div className="pricing-grid">
  <article className={`pricing-card ${normalizedPlan === "free" ? "current" : ""}`}>
    <div className="pricing-head">
      <div>
        <p className="pricing-tier">Free</p>
        <p className="pricing-price">0</p>
        <p className="pricing-cycle">Forever free</p>
      </div>
      <span className="pricing-tag">{normalizedPlan === "free" ? "Current" : "Starter"}</span>
    </div>
    <ul className="pricing-list">
      <li>Live array & sorting animations</li>
      <li>10 curated practice problems</li>
      <li>Complexity hints (Big-O)</li>
      <li>2 topic cheatsheets</li>
      <li>Community discussion access</li>
    </ul>
    <button type="button" className="bg pricing-cta" onClick={onStartFree} disabled={isPending}>
      {pendingPlan === "free" ? "Activating..." : "Start Free"}
    </button>
  </article>

  <article className={`pricing-card featured ${normalizedPlan === "pro" ? "current" : ""}`}>
    <div className="pricing-head">
      <div>
        <p className="pricing-tier">Pro</p>
        <p className="pricing-price">99</p>
        <p className="pricing-cycle">Per month</p>
      </div>
      <span className="pricing-tag">{normalizedPlan === "pro" ? "Current" : "Popular"}</span>
    </div>
    <ul className="pricing-list">
      <li>Everything in Free</li>
      <li>Unlimited live visualizations</li>
      <li>Problem practice access</li>
      <li>Step-by-step code walkthroughs</li>
      <li>PDF notes & topic summaries</li>
      <li>Progress tracker & streaks</li>
      <li>Saved sessions (unlimited)</li>
      <li>Email support</li>
    </ul>
    <button type="button" className="bp pricing-cta" onClick={onGetPro} disabled={isPending}>
      {pendingPlan === "pro" ? "Activating..." : normalizedPlan === "pro" ? "Pro Active" : "Get Pro"}
    </button>
  </article>

  <article className={`pricing-card ${normalizedPlan === "advanced" ? "current" : ""}`}>
    <div className="pricing-head">
      <div>
        <p className="pricing-tier">Advanced</p>
        <p className="pricing-price">199</p>
        <p className="pricing-cycle">Per month</p>
      </div>
      <span className="pricing-tag">{normalizedPlan === "advanced" ? "Current" : "Advanced"}</span>
    </div>
    <ul className="pricing-list">
      <li>Everything in Pro</li>
      <li>Interview-ready problem sets</li>
      <li>PlayGround access</li>
      <li>Company-wise filter (FAANG+)</li>
      <li>1-on-1 doubt sessions (2/mo)</li>
      <li>Resume & GitHub review</li>
      <li>Custom learning roadmap</li>
      <li>24/7 priority support</li>
    </ul>
    <button type="button" className="bp pricing-cta" onClick={onGetAdvanced} disabled={isPending}>
      {pendingPlan === "advanced" ? "Activating..." : normalizedPlan === "advanced" ? "Advanced Active" : "Get Advanced"}
    </button>
  </article>
</div>

    </section>
  );
}
