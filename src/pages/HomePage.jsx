
import HomePlaygroundPreview from "../components/HomePlaygroundPreview";
import "./HomePage.css";

function HeroArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="home-inline-icon">
      <path
        d="M7 17L17 7M17 7H9M17 7V15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuickActionIcon({ type }) {
  const icons = {
    append: (
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15 15l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    insert: (
      <>
        <path d="M6 7h12M6 17h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 9v6M9 12h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    reverse: (
      <>
        <path d="M7 8h9l-2-2M17 16H8l2 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="home-chip-icon">
      {icons[type]}
    </svg>
  );
}

function FeatureIcon({ kind }) {
  const icons = {
    sync: <path d="M7 8a6 6 0 0 1 10-2M17 6V3M17 16a6 6 0 0 1-10 2M7 18v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    logic: (
      <>
        <path d="M9 9a3 3 0 1 1 6 0c0 2-3 2.5-3 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 18h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
    complexity: (
      <>
        <path d="M5 17l4-5 3 2 5-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7h2v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    placement: (
      <>
        <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
    python: (
      <>
        <path d="M8 8c0-2 1-3 3-3h2c2 0 3 1 3 3v2H10c-1.1 0-2 .9-2 2v1H7c-2 0-3-1-3-3v-1c0-1.7 1.3-3 3-3h1Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M16 16c0 2-1 3-3 3h-2c-2 0-3-1-3-3v-2h6c1.1 0 2-.9 2-2v-1h1c2 0 3 1 3 3v1c0 1.7-1.3 3-3 3h-1Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </>
    ),
    progress: (
      <>
        <path d="M6 16l4-4 3 2 5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 8h2v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="home-feature-icon">
      {icons[kind]}
    </svg>
  );
}

export default function HomePage({
  inputRef,
  editorPanelRef,
  logRef,
  editorGlow,
  introEditorLines,
  history,
  nextLandingLineNumber,
  syntaxColor,
  inputValue,
  onInputChange,
  onInputKeyDown,
  arr,
  states,
  cx,
  logs,
  onClearLogs,
  onOpenEditor,
  onRunDemo,
  onRunQuickAction,
  curatedProblems,
  onRunProblemDemo,
  topicMarquee,
  activeTopic,
  onSetActiveTopic,
  onGoToTopics
}) {
  return (
    <>
      <section className="hero home-hero" id="playground" data-reveal>
        <div className="home-hero-copy">
          <div className="badge home-badge"><span className="dot" />LIVE CODE - ANIMATION</div>
          <h1>Type Code.<br /><span className="hl">See It Move.</span></h1>
          <p className="sub">
            Build deep intuition using live visual animation of array operations, comparisons, shifts, and complexity impact.
          </p>
          <div className="hbtns home-hero-actions">
            <button className="bp home-hero-btn" onClick={onOpenEditor}>
              <span>Open Editor</span>
              <HeroArrowIcon />
            </button>
            <button className="bg demo-btn home-hero-btn secondary" onClick={onRunDemo}>
              <span>Watch Demo</span>
              <HeroArrowIcon />
            </button>
          </div>
          <div className="quick-actions home-quick-actions">
            <button className="qa home-qa" onClick={() => onRunQuickAction("arr.append(88)")}><QuickActionIcon type="append" />append</button>
            <button className="qa home-qa" onClick={() => onRunQuickAction("arr.index(33)")}><QuickActionIcon type="search" />search</button>
            <button className="qa home-qa" onClick={() => onRunQuickAction("arr.insert(1, 50)")}><QuickActionIcon type="insert" />insert</button>
            <button className="qa home-qa" onClick={() => onRunQuickAction("arr.reverse()")}><QuickActionIcon type="reverse" />reverse</button>
          </div>
        </div>

        <HomePlaygroundPreview
          inputRef={inputRef}
          editorPanelRef={editorPanelRef}
          logRef={logRef}
          editorGlow={editorGlow}
          introEditorLines={introEditorLines}
          history={history}
          nextLandingLineNumber={nextLandingLineNumber}
          syntaxColor={syntaxColor}
          inputValue={inputValue}
          onInputChange={onInputChange}
          onInputKeyDown={onInputKeyDown}
          arr={arr}
          states={states}
          cx={cx}
          logs={logs}
          onClearLogs={onClearLogs}
        />
      </section>

      <section className="sec home-problems-section" id="problems" data-reveal>
        <p className="stag">Problem Sets</p>
        <h2>Curated Practice With Live Demos</h2>
        <p className="ssub">Pick a problem card to trigger an animation pattern and understand the operation sequence visually.</p>
        <div className="problem-grid home-problem-grid">
          {curatedProblems.map((item) => (
            <article key={item.title} className="problem-card home-problem-card">
              <div className="problem-top">
                <span className={`pill level-${item.level.toLowerCase()}`}>{item.level}</span>
                <span className="pill topic">{item.topic}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button className="bp small" onClick={() => onRunProblemDemo(item.command)}>
                Run: {item.command}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="sec home-features-section" data-reveal>
        <p className="stag">Why Shahira Code</p>
        <h2>Built Different</h2>
        <p className="ssub">Every feature is designed around one goal - making DSA logic click instantly.</p>
        <div className="fgrid home-feature-grid">
          <div className="fc home-feature-card"><div className="fic" style={{ background: "rgba(0,245,160,.1)" }}><FeatureIcon kind="sync" /></div><h3>Live Sync</h3><p>Every character you type drives the animation instantly.</p></div>
          <div className="fc home-feature-card"><div className="fic" style={{ background: "rgba(0,212,255,.1)" }}><FeatureIcon kind="logic" /></div><h3>Step Logic</h3><p>Step messages make every memory change obvious.</p></div>
          <div className="fc home-feature-card"><div className="fic" style={{ background: "rgba(255,170,0,.1)" }}><FeatureIcon kind="complexity" /></div><h3>Complexity Live</h3><p>Time and space update as each operation runs.</p></div>
          <div className="fc home-feature-card"><div className="fic" style={{ background: "rgba(192,132,252,.1)" }}><FeatureIcon kind="placement" /></div><h3>Placement Ready</h3><p>Practice with realistic operation patterns and visuals.</p></div>
          <div className="fc home-feature-card"><div className="fic" style={{ background: "rgba(0,245,160,.1)" }}><FeatureIcon kind="python" /></div><h3>Python Friendly</h3><p>Use Python-like syntax such as arr.append and arr.index.</p></div>
          <div className="fc home-feature-card"><div className="fic" style={{ background: "rgba(0,212,255,.1)" }}><FeatureIcon kind="progress" /></div><h3>Progress Feel</h3><p>Visual feedback helps build intuition faster.</p></div>
        </div>
      </section>

      <section className="topics-sec home-topics-section" id="topics" data-reveal>
        <div className="tinner">
          <p className="stag">Topics</p>
          <h2>All Core DSA Topics</h2>
          <p className="ssub">Every must-know area, always in motion. Tap one to spotlight it.</p>
          <div className="topic-marquee">
            <div className="topic-track">
              {topicMarquee.map((topic, index) => (
                <button
                  key={`topic-a-${topic}-${index}`}
                  type="button"
                  className={`tp ${topic === activeTopic ? "act" : ""}`}
                  onClick={() => onSetActiveTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
            <div className="topic-track reverse">
              {topicMarquee.map((topic, index) => (
                <button
                  key={`topic-b-${topic}-${index}`}
                  type="button"
                  className={`tp ${topic === activeTopic ? "act" : ""}`}
                  onClick={() => onSetActiveTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cta home-cta" data-reveal>
        <p className="stag" style={{ textAlign: "center" }}>GET STARTED</p>
        <h2>Start Visualizing Today</h2>
        <p>Free for students. No install. No credit card. Just open and start coding.</p>
        <div className="ctabtns">
          <button className="bp home-hero-btn" onClick={onOpenEditor}>
            <span>Open Shahira Code Free</span>
            <HeroArrowIcon />
          </button>
          <button className="bg home-hero-btn secondary" onClick={() => onGoToTopics("Sorting")}>
            <span>See All Topics</span>
            <HeroArrowIcon />
          </button>
        </div>
      </section>

      <footer data-reveal>
        <div className="fl">Shahira <em>Code</em></div>
        <span className="fn2">Built for students. Powered by Shahira Pvt Ltd.</span>
        <span className="fn2">Copyright 2026 Shahira Code</span>
      </footer>
    </>
  );
}
