import HomePlaygroundCodePane from "./HomePlaygroundCodePane";
import HomePlaygroundLivePreview from "./HomePlaygroundLivePreview";

export default function HomePlaygroundPreview({
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
  onClearLogs
}) {
  return (
    <div ref={editorPanelRef}>
      <div className={`ewin ${editorGlow ? "editor-glow" : ""}`}>
        <div className="ebar">
          <div className="ed" style={{ background: "#ff5f57" }} />
          <div className="ed" style={{ background: "#febc2e" }} />
          <div className="ed" style={{ background: "#28c840" }} />
          <span className="etitle">playground.dsa - Shahira Code</span>
          <span className="elang">DSA</span>
        </div>

        <div className="esplit">
          <HomePlaygroundCodePane
            inputRef={inputRef}
            introEditorLines={introEditorLines}
            history={history}
            nextLandingLineNumber={nextLandingLineNumber}
            syntaxColor={syntaxColor}
            inputValue={inputValue}
            onInputChange={onInputChange}
            onInputKeyDown={onInputKeyDown}
          />

          <HomePlaygroundLivePreview
            logRef={logRef}
            arr={arr}
            states={states}
            cx={cx}
            logs={logs}
            onClearLogs={onClearLogs}
          />
        </div>
      </div>
    </div>
  );
}
