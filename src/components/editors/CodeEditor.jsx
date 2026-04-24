import { useEffect, useRef, useState } from "react";

export default function CodeEditor({
  isOpen,
  onClose,
  selectedProblem,
  onProblemCompleted,
  inputValue,
  onInputChange,
  onRunCurrentLine,
  onRunAll,
  arr,
  states,
  cx,
  arrayVarName,
  logs,
  onClearLogs,
  executionOutput,
  onClearPreview
}) {
  const fullscreenInputRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const editorModalRef = useRef(null);
  const logBoxRef = useRef(null);
  const [detectedOutput, setDetectedOutput] = useState("");
  const [autoStatus, setAutoStatus] = useState("idle");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLogCollapsed, setIsLogCollapsed] = useState(false);
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
  const expectedValue = normalizeOutput(selectedProblem?.output || "");
  const matchedPreviewIndices = autoStatus === "pass" && !is2d && !is3d
    ? arr.reduce((indices, value, index) => {
        if (normalizeOutput(value) === expectedValue) {
          indices.push(index);
        }
        return indices;
      }, [])
    : [];

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

  function normalizeOutput(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function getActiveLineNumber() {
    const textarea = fullscreenInputRef.current;
    if (!textarea) {
      return lineTotal;
    }

    const cursorIndex = textarea.selectionStart || 0;
    return String(inputValue || "").slice(0, cursorIndex).split(/\r\n|\r|\n/).length;
  }

  function outputsMatch(actual, expected) {
    if (!actual || !expected) {
      return false;
    }

    if (actual === expected) {
      return true;
    }

    if (actual.includes(expected)) {
      return true;
    }

    const actualNumber = actual.match(/-?\d+(?:\.\d+)?(?!.*-?\d+(?:\.\d+)?)/);
    const expectedNumber = expected.match(/-?\d+(?:\.\d+)?(?!.*-?\d+(?:\.\d+)?)/);
    return Boolean(actualNumber && expectedNumber && actualNumber[0] === expectedNumber[0]);
  }

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (fullscreenInputRef.current) {
        fullscreenInputRef.current.focus();
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    setDetectedOutput("");
    setAutoStatus("idle");
  }, [selectedProblem, isOpen]);

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
      // Browser can reject fullscreen requests unless triggered by user gesture.
      setIsFullscreen(false);
    }
  }

  async function toggleMinimize() {
    if (!isMinimized && document.fullscreenElement === editorModalRef.current) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        // Ignore browser-specific fullscreen exit issues.
      }
    }

    setIsMinimized((prev) => !prev);
  }

  async function handleRunCurrentLine() {
    const result = await onRunCurrentLine(getActiveLineNumber());
    const normalizedResult = normalizeOutput(result);

    setDetectedOutput(normalizedResult);

    if (!selectedProblem) {
      setAutoStatus(normalizedResult ? "detected" : "idle");
      return;
    }

    const expected = normalizeOutput(selectedProblem.output || "");
    if (!normalizedResult) {
      setAutoStatus("empty");
      return;
    }

    if (outputsMatch(normalizedResult, expected)) {
      setAutoStatus("pass");
      onProblemCompleted(selectedProblem.id);
      return;
    }

    setAutoStatus("fail");
  }

  async function handleRunAll() {
    const result = await onRunAll();
    const normalizedResult = normalizeOutput(result);

    setDetectedOutput(normalizedResult);

    if (!selectedProblem) {
      setAutoStatus(normalizedResult ? "detected" : "idle");
      return;
    }

    const expected = normalizeOutput(selectedProblem.output || "");
    if (!normalizedResult) {
      setAutoStatus("empty");
      return;
    }

    if (outputsMatch(normalizedResult, expected)) {
      setAutoStatus("pass");
      onProblemCompleted(selectedProblem.id);
      return;
    }

    setAutoStatus("fail");
  }

  function handleInputScroll(event) {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = event.target.scrollTop;
    }
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) {
        handleRunCurrentLine();
      } else {
        handleRunAll();
      }
    }
  }

  if (!isOpen) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="editor-overlay minimized" role="dialog" aria-label="Minimized code editor">
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
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-label="Full screen code editor">
      <div className="editor-modal" ref={editorModalRef}>
        <div className="editor-toolbar">
          <div>
            <strong>Shahira Code Full Screen Editor</strong>
            <p>Type commands and run with live animation demo.</p>
          </div>
          <div className="editor-toolbar-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
              title={isFullscreen ? "Exit full screen" : "Enter full screen"}
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
            <div className="leetcode-problem-panel">
              {selectedProblem ? (
                <>
                  <div className="problem-row">
                    <h3>{selectedProblem.title}</h3>
                    <span className={`pill level-${selectedProblem.level.toLowerCase()}`}>
                      {selectedProblem.level}
                    </span>
                  </div>
                  <p>{selectedProblem.statement}</p>
                  <div className="example-box">
                    <div><strong>Input:</strong> {selectedProblem.input}</div>
                    <div><strong>Expected Output:</strong> {selectedProblem.output}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="problem-row">
                    <h3>No Problem Selected</h3>
                    <span className="pill topic">Practice</span>
                  </div>
                  <p>
                    Open Problems and select an item (for example Arrays id 1) to show its statement here, similar to a
                    LeetCode layout.
                  </p>
                </>
              )}
            </div>

            <div className="editor-actions">
              <button className="bp small" onClick={handleRunCurrentLine}>Run Current Line</button>
              <button className="bg small-btn" onClick={handleRunAll}>Run All</button>
            </div>
            <div className="editor-input-wrap">
              <div className="editor-line-numbers" ref={lineNumbersRef} aria-hidden="true">
                {lineNumbers.map((line) => (
                  <div key={`modal-line-${line}`}>{line}</div>
                ))}
              </div>
              <textarea
                ref={fullscreenInputRef}
                className="full-editor-input"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleInputScroll}
                placeholder={"Type your code...\n\nExamples:\nnums = [2,7,11,15]\nnums.unshift(5)\nnums.set(1, 99)\nnums.get(2)\nnums.sum(9)\nnums.length()"}
              />
            </div>

            <div className="output-checker">
              <label htmlFor="problem-output-view">Auto-detected Output</label>
              <div id="problem-output-view" className="problem-output-view" aria-live="pgiolite">
                {detectedOutput || "Run the code to detect the result automatically."}
              </div>
              {selectedProblem ? (
                <div
                  className={`problem-output-hint ${autoStatus === "pass" ? "is-pass" : autoStatus === "fail" ? "is-fail" : ""}`}
                >
                  <span><strong>Expected:</strong> {selectedProblem.output}</span>
                </div>
              ) : null}
              {autoStatus === "pass" && <p className="result-pass">Detected output matches the problem.</p>}
              {autoStatus === "fail" && <p className="result-fail">Detected output does not match the expected value.</p>}
              {autoStatus === "empty" && <p className="result-fail">No output was detected from that run.</p>}
            </div>
          </section>

          <section className={`editor-preview ${autoStatus === "pass" ? "preview-pass" : ""}`}>
            <div className="editor-preview-head">
              <span className="alabel">Live Demo Preview</span>
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
                  <div
                    key={`modal-${value}-${i}`}
                    className={`abox ${states[i] || ""} ${matchedPreviewIndices.includes(i) ? "expected-match" : ""}`}
                  >
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

            <div className="cx-row">
              <span className="cxbadge cxt">Time: {cx.time}</span>
              <span className="cxbadge cxs">Space: {cx.space}</span>
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
                  <div key={`modal-log-${entry.id}`} className={`log-line ${entry.type}`}>
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
