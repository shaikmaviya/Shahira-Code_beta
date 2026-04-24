export default function HomePlaygroundLivePreview({
  logRef,
  arr,
  states,
  cx,
  logs,
  onClearLogs
}) {
  return (
    <div className="apane">
      <span className="alabel">Live Preview</span>
      <div style={{ position: "relative", paddingBottom: "22px" }}>
        <div className="arow">
          {arr.map((value, i) => (
            <div key={`${value}-${i}`} className={`abox ${states[i] || ""}`}>
              {value}
              <span className="idx">{i}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cx-row">
        <span className="cxbadge cxt">Time: {cx.time}</span>
        <span className="cxbadge cxs">Space: {cx.space}</span>
      </div>

      <div className="log-box" ref={logRef}>
        <div className="log-box-head">
          <button
            type="button"
            className="log-clear-btn"
            onClick={onClearLogs}
            aria-label="Clear logs"
            title="Clear logs"
          >
            <img src="/src/assets/broom.png" alt="" className="icon-image" />
          </button>
        </div>
        {logs.length === 0 && (
          <div className="log-empty">No logs yet.</div>
        )}
        {logs.map((entry) => (
          <div key={entry.id} className={`log-line ${entry.type}`}>
            <span className="ts">{entry.time}</span>
            <span className="lm">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
