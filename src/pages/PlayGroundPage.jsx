import { useMemo, useState } from "react";
import "./PlayGroundPage.css";

export default function PlayGroundPage({ onNavigate }) {
  const [activeTool, setActiveTool] = useState(null);
  const navigateTo = typeof onNavigate === "function" ? onNavigate : (path) => {
    if (path) {
      window.location.assign(path);
    }
  };

  const playgroundCards = useMemo(
    () => [
      {
        id: "array-visualizer",
        title: "Array Visualizer",
        subtitle: "1D + 2D interactive DSA playground",
        url: "/playground-visualizer.html",
        badge: "Arrays"
      },
      {
        id: "profile",
        title: "Profile",
        subtitle: "View and edit your profile, progress, and settings.",
        url: "/profile",
        badge: "User"
      },
      {
        id: "problems",
        title: "Problems",
        subtitle: "Browse and solve coding problems.",
        url: "/problems",
        badge: "Practice"
      }
    ],
    []
  );

  const selectedCard = playgroundCards.find((card) => card.id === activeTool) || null;


  if (selectedCard && selectedCard.id === "array-visualizer") {
    return (
      <section className="playground-page">
        <div className="viewer-header">
          <button type="button" className="viewer-btn" onClick={() => setActiveTool(null)}>
            Back To Playground
          </button>
          <h2>{selectedCard.title}</h2>
          <a className="viewer-btn secondary" href={selectedCard.url} target="_blank" rel="noreferrer">
            Open In New Tab
          </a>
        </div>
        <iframe className="playground-frame" title={selectedCard.title} src={selectedCard.url} />
      </section>
    );
  }

  if (selectedCard && selectedCard.id === "profile") {
    navigateTo("/profile");
    return null;
  }
  if (selectedCard && selectedCard.id === "problems") {
    navigateTo("/problems");
    return null;
  }

  return (
    <section className="playground-page">
      <div className="launcher-head">
        <h2>Playground</h2>
        <p>Click a big card to open that visualizer.</p>
      </div>

      <div className="playground-grid">
        {playgroundCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className="playground-card"
            onClick={() => setActiveTool(card.id)}
          >
            <div className="card-thumb">
              <span className="card-badge">{card.badge}</span>
            </div>
            <div className="card-meta">
              <h3>{card.title}</h3>
              <p>{card.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
