import { useEffect, useRef, useState } from "react";

export default function SimpleEditor({
  isOpen,
  onClose,
  inputValue,
  onInputChange,
  onRunAll,
  activeLanguage,
  onLanguageChange,
  arr,
  states,
  arrayVarName,
  logs,
  onClearLogs,
  executionOutput,
  onClearPreview
}) {
  const inputRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const editorModalRef = useRef(null);
  const logBoxRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLogCollapsed, setIsLogCollapsed] = useState(false);
  const language = activeLanguage || "python";
  const outputStdout = executionOutput?.stdout || "";
  const outputStderr = executionOutput?.stderr || "";
  const outputFallback = executionOutput?.output || "";
  const outputLang = executionOutput?.language || "";
  const displayStdout = outputStdout || (!outputStderr ? outputFallback : "");
  const hasExecutionOutput = Boolean(displayStdout || outputStderr);
  const outputText = displayStdout || outputStderr || "";
  const outputType = displayStdout ? "ok" : outputStderr ? "err" : "";
  const lineTotal = Math.max(1, String(inputValue || "").split(/\r\n|\r|\n/).length);
  const lineNumbers = Array.from({ length: lineTotal }, (_, idx) => idx + 1);
  const arrayLabel = arrayVarName || "array";
  const is2d = Array.isArray(arr[0]) && !Array.isArray(arr[0]?.[0]);
  const is3d = Array.isArray(arr[0]) && Array.isArray(arr[0]?.[0]);

  function renderRow(row, rowKey) {
    const cells = Array.isArray(row) ? row : [row];
    return (
      <div key={rowKey} className="arow nested">
        {cells.map((value, colIdx) => (
          <div key={`${rowKey}-${colIdx}`} className="abox">
            {String(value)}
          </div>
        ))}
      </div>
    );
  }

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
      setIsFullscreen(false);
      setIsLogCollapsed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === editorModalRef.current);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || isLogCollapsed || !logBoxRef.current) {
      return;
    }

    // Wait for DOM paint so scrollHeight includes the just-rendered log line.
    const frameId = window.requestAnimationFrame(() => {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [logs, isLogCollapsed, isOpen]);

  if (!isOpen) {
    return null;
  }

  async function toggleFullscreen() {
    if (!editorModalRef.current) {
      return;
    }

    try {
      if (document.fullscreenElement === editorModalRef.current) {
        await document.exitFullscreen();
      } else {
        await editorModalRef.current.requestFullscreen();
        setIsMinimized(false);
      }
    } catch (error) {
      setIsFullscreen(false);
    }
  }

  async function toggleMinimize() {
    if (!isMinimized && document.fullscreenElement === editorModalRef.current) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        // Ignore fullscreen exit issues.
      }
    }

    setIsMinimized((prev) => !prev);
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onRunAll();
    }
  }

  function handleInputScroll(event) {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = event.target.scrollTop;
    }
  }

  const placeholderText =
    language === "java"

      ? "Type your Java code...\n\n(Note: class is already created)\n\nExample:\nint[] nums = {2, 7, 11, 15};\nSystem.out.println(nums[0] + nums[1]);"
      : "Type your Python code...\n\nExample:\nnums = [2, 7, 11, 15]\nprint(nums[0] + nums[1])";

  if (isMinimized) {
    return (
      <div className="editor-overlay minimized" role="dialog" aria-label="Minimized simple editor">
        <div className="editor-minimized">
          <div>
            <strong>Shahira Code Editor</strong>
            <p>Editor is minimized</p>
          </div>
          <div className="editor-toolbar-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleMinimize}
              aria-label="Restore editor"
              title="Restore"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 14l6-6 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={onClose}
              aria-label="Close editor"
              title="Close"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6l-12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-label="Simple code editor">
      <div className="editor-modal" ref={editorModalRef}>
        <div className="editor-toolbar">
          <div>
            <strong>Shahira Code Editor</strong>
          </div>
          <div className="editor-lang-toggle" role="tablist" aria-label="Editor language">
            <button
              type="button"
              className={`lang-btn ${language === "python" ? "active" : ""}`}
              onClick={() => onLanguageChange?.("python")}
              role="tab"
              aria-selected={language === "python"}
            >
              Python
            </button>
            <button
              type="button"
              className={`lang-btn ${language === "java" ? "active" : ""}`}
              onClick={() => onLanguageChange?.("java")}
              role="tab"
              aria-selected={language === "java"}
            >
              Java
            </button>
          </div>
          <div className="editor-toolbar-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
              title={isFullscreen ? "Exit full screen" : "Full screen"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={toggleMinimize}
              aria-label="Minimize editor"
              title="Minimize"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 12h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={onClose}
              aria-label="Close editor"
              title="Close"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6l-12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="editor-main">
          <section className="editor-pane">
            <div className="editor-actions">
              <button className="bp small" onClick={onRunAll}>Run</button>
            </div>
            <div className="editor-input-wrap">
              <div className="editor-line-numbers" ref={lineNumbersRef} aria-hidden="true">
                {lineNumbers.map((line) => (
                  <div key={`simple-line-${line}`}>{line}</div>
                ))}
              </div>
              <textarea
                ref={inputRef}
                className="full-editor-input"
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleInputScroll}
                placeholder={placeholderText}
              />
            </div>
          </section>

          <section className="editor-preview">
            <div className="editor-preview-head">
              <span className="alabel">Live Preview</span>
              <div className="editor-preview-actions">
                <button
                  type="button"
                  className="log-clear-btn"
                  onClick={() => setIsLogCollapsed((prev) => !prev)}
                  aria-label={isLogCollapsed ? "Show logs" : "Hide logs"}
                  title={isLogCollapsed ? "Show logs" : "Hide logs"}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d={isLogCollapsed ? "M6 10l6 6 6-6" : "M6 14l6-6 6 6"}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="log-clear-btn"
                  onClick={() => onClearPreview?.()}
                  aria-label="Clear live preview"
                  title="Clear live preview"
                >
                  <img src="/src/assets/broom.png" alt="" className="icon-image" />
                </button>
              </div>
            </div>
            <div className="preview-label">{arrayLabel}</div>
            {is3d ? (
              <div className="agrid">
                {arr.map((layer, layerIdx) => (
                  <div key={`layer-${layerIdx}`} className="alayer">
                    <div className="alayer-title">{arrayLabel}[{layerIdx}]</div>
                    {Array.isArray(layer)
                      ? layer.map((row, rowIdx) => renderRow(row, `layer-${layerIdx}-${rowIdx}`))
                      : renderRow(layer, `layer-${layerIdx}-0`)}
                  </div>
                ))}
              </div>
            ) : is2d ? (
              <div className="agrid">
                {arr.map((row, rowIdx) => renderRow(row, `row-${rowIdx}`))}
              </div>
            ) : (
              <div className="arow">
                {arr.map((value, i) => (
                  <div key={`simple-${value}-${i}`} className={`abox ${states[i] || ""}`}>
                    {value}
                    <span className="idx">{i}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={`output-box ${outputType || ""}`}>
              <div className="output-box-head">
                <span>Output</span>
                {outputLang && <span className="tag">{outputLang}</span>}
              </div>
              {hasExecutionOutput ? (
                <pre>{outputText}</pre>
              ) : (
                <div className="output-empty">No output yet.</div>
              )}
            </div>

            {!isLogCollapsed && (
              <div className="log-box" ref={logBoxRef}>
                <div className="log-box-head">
                  <button
                    type="button"
                    className="log-clear-btn"
                    onClick={() => onClearLogs?.()}
                    aria-label="Clear logs"
                    title="Clear logs"
                  >
                    <img src="/src/assets/broom.png" alt="" className="icon-image" />
                  </button>
                  <span>Logs</span>
                </div>
                {logs.length === 0 && (
                  <div className="log-empty">No logs yet.</div>
                )}
                {logs.map((entry) => (
                  <div key={`simple-log-${entry.id}`} className={`log-line ${entry.type}`}>
                    <span className="ts">{entry.time}</span>
                    <span className="lm">{entry.message}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
