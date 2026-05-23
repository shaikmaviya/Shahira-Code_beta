import "./PricingPage.css";

const plans = [
  {
    name: "Starter",
    price: "₹0",
    cadence: "forever",
    accent: "starter",
    description: "Everything you need to explore visual DSA basics.",
    features: [
      "Live array animations",
      "Quick actions + curated demos",
      "Community templates",
      "Save up to 10 runs"
    ],
    cta: "Start Free"
  },
  {
    name: "Pro",
    price: "₹99",
    cadence: "per month",
    accent: "pro",
    description: "For daily practice and interview sprints.",
    features: [
      "Unlimited runs + history",
      "Problem packs with solutions",
      "Complexity coach panel",
      "Priority editor performance"
    ],
    cta: "Go Pro"
  },
  {
    name: "Team",
    price: "₹499",
    cadence: "per month",
    accent: "team",
    description: "Shared dashboards for coaching and classrooms.",
    features: [
      "Team workspaces",
      "Progress analytics",
      "Shared problem sets",
      "Admin controls"
    ],
    cta: "Start Team"
  }
];

const faqs = [
  {
    q: "Can I stay on the free plan forever?",
    a: "Yes. Starter stays free with core visualizations and basic history."
  },
  {
    q: "Is there a student discount?",
    a: "Yes. Pro is 50% off for verified students."
  },
  {
    q: "Do you offer refunds?",
    a: "Absolutely. Cancel anytime in the first 7 days for a full refund."
  }
];

export default function PricingPage({ onBack }) {
  return (
    <section className="sec pricing-page" data-reveal>
      <div className="pricing-hero">
        <div>
          <p className="stag">Pricing</p>
          <h2>Pick a plan and keep learning in motion.</h2>
          <p className="ssub">
            Start free, upgrade when you want deeper analytics and unlimited runs.
          </p>
        </div>
        <button type="button" className="pricing-back" onClick={onBack}>Back</button>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <article key={plan.name} className={`pricing-card ${plan.accent}`}>
            {plan.name === "Pro" && <span className="pricing-badge">Most popular</span>}
            <h3>{plan.name}</h3>
            <p className="pricing-desc">{plan.description}</p>
            <div className="pricing-price">
              <span className="price-value">{plan.price}</span>
              <span className="price-cadence">{plan.cadence}</span>
            </div>
            <ul className="pricing-features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button type="button" className="pricing-cta">
              {plan.cta}
            </button>
          </article>
        ))}
      </div>

      <div className="pricing-callout">
        <div>
          <h3>Need a custom plan?</h3>
          <p>Talk to us about campus bundles, bootcamps, and enterprise labs.</p>
        </div>
        <button type="button" className="pricing-cta ghost">Contact sales</button>
      </div>

      <div className="pricing-faq">
        <h3>Frequently asked</h3>
        <div className="faq-grid">
          {faqs.map((item) => (
            <div key={item.q} className="faq-card">
              <h4>{item.q}</h4>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
