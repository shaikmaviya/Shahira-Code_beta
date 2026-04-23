import { useEffect, useMemo, useRef, useState } from "react";
import Problems from "./pages/Problems";
import CodeEditor from "./CodeEditor";
import SimpleEditor from "./SimpleEditor";
import ProfilePage from "./pages/profile";
import ContactPage from "./pages/Contact";
import PricingPage from "./pages/Pricing";
import Login from "./authentication/Login";
import Signup from "./authentication/Signup";
import { logoutUser } from "./authentication/authApi";
import { createPricingSignup, saveUserProblem, upsertUserProgress } from "./profileApi";
import { executeArrayCode } from "./dsa/arrays/arrays";
import { executeCode } from "./editorApi";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function now() {
  return new Date().toLocaleTimeString("en", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function syntaxColor(code) {
  return code
    .replace(/\b([A-Za-z_$][\w$]*)\b(?=\s*\.)/g, '<span class="kw">$1</span>')
    .replace(
      /\.(push|append|add|pop|shift|unshift|sort|search|find|insert|set|get|remove|delete|removeat|reverse|index|sum|length|size|clear|min|max)\b/g,
      '.<span class="fn">$1</span>'
    )
    .replace(/(\d+)/g, '<span class="num">$1</span>');
}

function parseArrayValues(rawValues) {
  if (!rawValues) {
    return [];
  }

  return rawValues
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      if (/^[-+]?\d+(\.\d+)?$/.test(value)) {
        return Number(value);
      }

      const match = value.match(/^['"](.*)['"]$/);
      return match ? match[1] : value;
    });
}

function extractArrayLiteral(code, openIndex, openChar, closeChar) {
  let depth = 0;
  for (let i = openIndex; i < code.length; i += 1) {
    const char = code[i];
    if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return code.slice(openIndex, i + 1);
      }
    }
  }

  return null;
}

function parseArrayLiteral(rawLiteral, isJava) {
  if (!rawLiteral) {
    return null;
  }

  let normalized = rawLiteral.trim();
  if (isJava) {
    normalized = normalized.replace(/\{/g, "[").replace(/\}/g, "]");
  }

  normalized = normalized
    .replace(/'/g, '"')
    .replace(/\bNone\b/g, "null")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false");

  try {
    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function extractArrayFromCode(code) {
  const patterns = [
    { regex: /\b([A-Za-z_][\w]*)\s*=\s*\[/g, open: "[", close: "]", isJava: false },
    {
      regex: /\b(?:int|long|double|float|Integer|Long|Double|Float|String)\s*(?:\[\])+\s*([A-Za-z_][\w]*)\s*=\s*\{/g,
      open: "{",
      close: "}",
      isJava: true
    }
  ];

  for (const pattern of patterns) {
    let match;
    let lastMatch = null;
    while ((match = pattern.regex.exec(code)) !== null) {
      lastMatch = match;
    }

    if (lastMatch) {
      const openIndex = lastMatch.index + lastMatch[0].lastIndexOf(pattern.open);
      const literal = extractArrayLiteral(code, openIndex, pattern.open, pattern.close);
      const parsed = parseArrayLiteral(literal, pattern.isJava);
      if (parsed) {
        return { name: lastMatch[1], values: parsed };
      }

      if (literal) {
        const inner = literal.slice(1, -1);
        const values = parseArrayValues(inner);
        return { name: lastMatch[1], values };
      }
    }
  }

  return null;
}

const curatedProblems = [
  {
    title: "Two Sum",
    level: "Easy",
    topic: "Arrays",
    command: "arr.index(45)",
    description: "Visualize lookup flow and watch where the pointer lands."
  },
  {
    title: "Move Zeroes",
    level: "Easy",
    topic: "Two Pointers",
    command: "arr.reverse()",
    description: "Understand element movement and in-place updates."
  },
  {
    title: "Insert Interval",
    level: "Medium",
    topic: "Intervals",
    command: "arr.insert(2, 99)",
    description: "Observe insertion shifts and index re-alignment."
  },
  {
    title: "Sort Colors",
    level: "Medium",
    topic: "Sorting",
    command: "arr.sort()",
    description: "See each compare/swap transition in sequence."
  }
];

export default function App() {
  const [arr, setArr] = useState([12, 45, 7, 33, 21]);
  const [states, setStates] = useState(["", "", "", "", ""]);
  const [lineCount, setLineCount] = useState(6);
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [activeTopic, setActiveTopic] = useState("Arrays");
  const [arrayVarName, setArrayVarName] = useState("arr");
  const [cx, setCx] = useState({ time: "O(1)", space: "O(n)" });
  const [logs, setLogs] = useState([]);
  const [executionOutput, setExecutionOutput] = useState({
    stdout: "",
    stderr: "",
    output: "",
    language: ""
  });
  const [particles, setParticles] = useState([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSimpleEditorOpen, setIsSimpleEditorOpen] = useState(false);
  const [simpleEditorLanguage, setSimpleEditorLanguage] = useState("python");
  const [isProblemsOpen, setIsProblemsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [completedProblemIds, setCompletedProblemIds] = useState(() => {
    try {
      const raw = localStorage.getItem("codeviz_completed_ids");
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [authPage, setAuthPage] = useState("none");
  const [currentUser, setCurrentUser] = useState(null);

  const runningRef = useRef(false);
  const arrRef = useRef(arr);
  const scalarVarsRef = useRef({});
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const editorPanelRef = useRef(null);
  const [editorGlow, setEditorGlow] = useState(false);

  const topics = useMemo(
    () => [
      "Arrays",
      "Strings",
      "Hashing",
      "Two Pointers",
      "Sliding Window",
      "Stacks",
      "Queues",
      "Linked Lists",
      "Trees",
      "Binary Trees",
      "BST",
      "Heaps",
      "Priority Queues",
      "Graphs",
      "DFS",
      "BFS",
      "Shortest Paths",
      "Union Find",
      "Tries",
      "Sorting",
      "Searching",
      "Recursion",
      "Backtracking",
      "Dynamic Programming",
      "Greedy",
      "Bit Manipulation",
      "Math",
      "Intervals",
      "Monotonic Stack"
    ],
    []
  );
  const topicMarquee = useMemo(() => [...topics, ...topics], [topics]);

  function addLog(message, type = "ok") {
    setLogs((prev) => {
      const next = [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, time: now(), type, message }
      ];

      // Keep logs bounded so long sessions do not grow UI/memory without limit.
      return next.slice(-200);
    });
  }

  function clearLogs() {
    setLogs([]);
  }

  function clearPreview() {
    setArr([]);
    setStates([]);
    scalarVarsRef.current = {};
    setExecutionOutput({
      stdout: "",
      stderr: "",
      output: "",
      language: ""
    });
  }

  useEffect(() => {
    const existingSession = localStorage.getItem("codeviz_user");
    if (existingSession) {
      try {
        setCurrentUser(JSON.parse(existingSession));
      } catch {
        localStorage.removeItem("codeviz_user");
      }
    }

    const generated = Array.from({ length: 18 }).map((_, idx) => {
      const size = Math.random() * 4 + 2;
      const colors = ["#00f5a0", "#00d4ff", "#ffaa00", "#c084fc"];
      return {
        id: idx,
        size,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: 8 + Math.random() * 14,
        delay: Math.random() * 8
      };
    });
    setParticles(generated);

    addLog("Shahira Code ready: animated DSA practice", "info");
    addLog("Try: nums = [3,1,2], nums.sort(), nums.insert(1, 99)", "info");
  }, []);


  useEffect(() => {
    arrRef.current = arr;
  }, [arr]);

  useEffect(() => {
    try {
      localStorage.setItem("codeviz_completed_ids", JSON.stringify(completedProblemIds));
    } catch {
      // Ignore storage errors.
    }
  }, [completedProblemIds]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const isAuthOpen = authPage === "login" || authPage === "signup";

    if (!isEditorOpen && !isSimpleEditorOpen && !isAuthOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditorOpen, isSimpleEditorOpen, authPage]);


  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isProfileOpen, isPricingOpen, isProblemsOpen, isContactOpen, isEditorOpen, isSimpleEditorOpen, authPage]);

  async function runCode(rawCode) {
    if (runningRef.current) {
      return "";
    }

    const code = rawCode.trim();
    if (!code) {
      return "";
    }

    runningRef.current = true;
    setHistory((prev) => {
      const next = [...prev, { line: lineCount, code }];

      // Keep command history bounded for a stable editor height/performance.
      return next.slice(-250);
    });
    setLineCount((prev) => prev + 1);
    let result = "";

    try {
      result = await executeArrayCode(code, {
        getArr: () => arrRef.current,
        setArr: (nextArr) => {
          arrRef.current = nextArr;
          setArr(nextArr);
        },
        getVar: (name) => scalarVarsRef.current[name],
        hasVar: (name) => Object.prototype.hasOwnProperty.call(scalarVarsRef.current, name),
        setVar: (name, value) => {
          scalarVarsRef.current[name] = value;
        },
        setStates,
        setCx,
        addLog,
        sleep,
        setArrayVarName
      });
    } catch (error) {
      addLog(`Error: ${error.message}`, "err");
    } finally {
      runningRef.current = false;
    }

    return result;
  }

  function onEnter(e) {
    if (e.key === "Enter") {
      const value = inputValue;
      setInputValue("");
      runCode(value);
    }
  }

  function openEditor() {
    if (!currentUser) {
      setAuthPage("login");
      return;
    }

    setInputValue("");
    setArrayVarName("arr");
    setArr([]);
    setStates([]);
    setSelectedProblem(null);
    setIsEditorOpen(false);
    setSimpleEditorLanguage("python");
    setIsSimpleEditorOpen(true);
    setEditorGlow(true);

    window.setTimeout(() => {
      setEditorGlow(false);
    }, 1500);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setSelectedProblem(null);
  }

  function closeSimpleEditor() {
    setIsSimpleEditorOpen(false);
  }

  function openProblemsPage(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    setIsProfileOpen(false);
    setIsPricingOpen(false);
    setAuthPage("none");
    setIsContactOpen(false);
    setIsProblemsOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeProblemsPage() {
    setIsProblemsOpen(false);
  }

  function openProfilePage() {
    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    setIsProblemsOpen(false);
    setAuthPage("none");
    setIsProfileOpen(true);
    setIsPricingOpen(false);
    setIsContactOpen(false);
  }

  function closeProfilePage() {
    setIsProfileOpen(false);
  }

  function openPricingPage() {
    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    setIsProblemsOpen(false);
    setAuthPage("none");
    setIsProfileOpen(false);
    setIsPricingOpen(true);
    setIsContactOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openContactPage(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    setIsProblemsOpen(false);
    setIsProfileOpen(false);
    setIsPricingOpen(false);
    setAuthPage("none");
    setIsContactOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setIsProfileOpen(false);
    setIsPricingOpen(false);
    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    setIsProblemsOpen(false);
    setIsContactOpen(false);
    setAuthPage("none");
    setSelectedProblem(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProblemInEditor(problem) {
    setIsProblemsOpen(false);
    setInputValue("");
    setArrayVarName("arr");
    setArr([]);
    setStates([]);
    setSelectedProblem(problem || null);
    setIsSimpleEditorOpen(false);
    setIsEditorOpen(true);
  }

  async function markProblemAsCompleted(problemId) {
    if (!problemId) {
      return;
    }

    setCompletedProblemIds((prev) => {
      if (prev.includes(problemId)) {
        return prev;
      }

      return [...prev, problemId];
    });
    addLog(`Problem #${problemId} marked as completed`, "ok");

    const resolvedProblem = selectedProblem
      && String(selectedProblem.id) === String(problemId)
      ? selectedProblem
      : curatedProblems.find((item) => String(item.id) === String(problemId));

    if (!resolvedProblem) {
      return;
    }

    const problemKey = resolvedProblem.title || String(problemId);

    try {
      const cacheKey = "codeviz_solved_cache";
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
      const hasEntry = cached.some((item) => String(item.problemId) === String(problemKey));
      if (!hasEntry) {
        cached.push({
          problemId: String(problemKey),
          title: resolvedProblem.title || "Untitled",
          topic: resolvedProblem.topic || "General",
          level: resolvedProblem.level || "Easy",
          completedAt: new Date().toISOString()
        });
        localStorage.setItem(cacheKey, JSON.stringify(cached));
      }
    } catch {
      // Cache is optional; ignore failures (private mode or storage limits).
    }

    const token = localStorage.getItem("codeviz_token");
    if (!token) {
      return;
    }

    try {
      await saveUserProblem(token, {
        problemId: String(problemKey),
        title: resolvedProblem.title || "Untitled",
        topic: resolvedProblem.topic || "General",
        level: resolvedProblem.level || "Easy",
        statement: resolvedProblem.statement || resolvedProblem.description || "",
        input: resolvedProblem.input || "",
        output: resolvedProblem.output || "",
        status: "completed",
        solutionCode: inputValue
      });

      await upsertUserProgress(token, {
        problemId: String(problemKey),
        status: "completed"
      });
    } catch (error) {
      addLog(error.message || "Unable to save problem progress.", "err");
    }
  }

  async function runCurrentLineFromEditor() {
    const lines = inputValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const latest = lines.length ? lines[lines.length - 1] : "";
    if (latest) {
      return await runCode(latest);
    }

    return "";
  }

  async function runAllFromEditor() {
    const lines = inputValue
      .split("\n")
      .map((line) => line.replace(/\r$/, ""))
      .filter((line) => line.trim().length > 0);

    // Run-All should behave like a fresh script execution for scalar variables.
    scalarVarsRef.current = {};

    let latestResult = "";
    for (const line of lines) {
      // Run each command in sequence so animations remain understandable.
      const currentResult = await runCode(line);
      if (String(currentResult || "").trim()) {
        latestResult = currentResult;
      }
    }

    return latestResult;
  }

  async function runSimpleEditorCode() {
    const code = inputValue.trim();
    if (!code) {
      return;
    }

    addLog(`Running ${simpleEditorLanguage} code...`, "info");

    const parsedArray = extractArrayFromCode(code);
    if (parsedArray) {
      setArrayVarName(parsedArray.name || "arr");
      setArr(parsedArray.values);
      if (Array.isArray(parsedArray.values) && !Array.isArray(parsedArray.values[0])) {
        setStates(parsedArray.values.map(() => ""));
      } else {
        setStates([]);
      }
    }

    try {
      const result = await executeCode(simpleEditorLanguage, code);
      const stdout = result?.stdout || "";
      const stderr = result?.stderr || "";
      const output = result?.output || "";

      setExecutionOutput({
        stdout,
        stderr,
        output,
        language: simpleEditorLanguage
      });
      if (stdout) {
        addLog(stdout, "ok");
      }

      if (stderr) {
        addLog(stderr, "err");
      }

      if (!stdout && !stderr && output) {
        addLog(output, "ok");
      }
    } catch (error) {
      setExecutionOutput({
        stdout: "",
        stderr: error.message || "Execution error.",
        output: "",
        language: simpleEditorLanguage
      });
      addLog(`Execution error: ${error.message}`, "err");
    }
  }

  function runDemo() {
    runCode("arr.sort()");
  }

  function goToTopics(topic = "Sorting") {
    setActiveTopic(topic);
    const section = document.getElementById("topics");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function runProblemDemo(command) {
    if (!currentUser) {
      setAuthPage("login");
      return;
    }

    openEditor();
    setInputValue(command);
    runCode(command);
  }

  function openAuthLogin() {
    setAuthPage("login");
  }

  function closeAuthPages() {
    setAuthPage("none");
  }

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setAuthPage("none");
    addLog(`Welcome back, ${user.name}`, "ok");
  }

  function handleSignupSuccess(user) {
    setCurrentUser(user);
    setAuthPage("none");
    addLog(`Account created for ${user.name}`, "ok");
  }

  function logout() {
    const token = localStorage.getItem("codeviz_token");
    if (token) {
      logoutUser(token).catch(() => {
        // Keep logout resilient even if backend is unavailable.
      });
    }

    localStorage.removeItem("codeviz_token");
    localStorage.removeItem("codeviz_user");
    setCurrentUser(null);
    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    setIsProblemsOpen(false);
    setIsProfileOpen(false);
    setSelectedProblem(null);
    addLog("Logged out", "info");
  }

  async function handlePricingSignup(planName, price) {
    const token = localStorage.getItem("codeviz_token");
    if (!token) {
      setIsPricingOpen(false);
      setAuthPage("login");
      return;
    }

    try {
      await createPricingSignup(token, {
        planName,
        price,
        currency: "INR"
      });
      addLog(`Pricing signup saved: ${planName}`, "ok");
    } catch (error) {
      addLog(error.message || "Unable to save pricing signup.", "err");
    }
  }

  return (
    <>
      <div className="particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      <nav data-reveal>
        <div className="nav-left">
          <div className="logo" onClick={goHome} style={{ cursor: "pointer" }}>
            Shahira <em>Code</em> <small>beta</small>
          </div>
        </div>
        <div className="nav-center">
          <ul className="nav-links">
            <li>
              <a
                href="#playground"
                onClick={(event) => {
                  event.preventDefault();
                  goHome();
                }}
              >
                Home
              </a>
            </li>
            <li><a href="#topics" onClick={goHome}>Topics</a></li>
            <li><button type="button" className="nav-link-btn" onClick={openProblemsPage}>Problems</button></li>
            <li><button type="button" className="nav-link-btn" onClick={openPricingPage}>Pricing</button></li>
            <li><button type="button" className="nav-link-btn" onClick={openContactPage}>Contact</button></li>
          </ul>
        </div>
        <div className="nav-right">
          {currentUser ? (
            <div className="nav-auth">
              <span className="nav-user">{currentUser.name}</span>
              <button
                type="button"
                className="nav-icon-btn"
                onClick={openProfilePage}
                aria-label="Open profile"
                title="Profile"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <button
              className="nbtn"
              onClick={openPricingPage}
            >
              Start Free →
            </button>
          )}
        </div>
      </nav>

      {isProfileOpen && (
        <ProfilePage
          onBack={goHome}
          onRequireLogin={() => {
            setIsProfileOpen(false);
            setAuthPage("login");
          }}
        />
      )}

      {isPricingOpen && (
        <PricingPage
          onBack={goHome}
          onStartFree={() => handlePricingSignup("Free", 0)}
          onGetSimple={() => handlePricingSignup("Simple", 99)}
          onGetAdvance={() => handlePricingSignup("Advance", 199)}
        />
      )}

      {isProblemsOpen && (
        <Problems
          onClose={goHome}
          onSelectProblem={openProblemInEditor}
          completedProblemIds={completedProblemIds}
        />
      )}

      {isContactOpen && (
        <ContactPage onBack={goHome} />
      )}

      {!isPricingOpen && !isProfileOpen && !isProblemsOpen && !isContactOpen && authPage === "none" && <>
      <section className="hero" id="playground" data-reveal>
        <div>
          <div className="badge"><span className="dot" />LIVE CODE → ANIMATION</div>
          <h1>Type Code.<br /><span className="hl">See It Move.</span></h1>
          <p className="sub">
            Build deep intuition using live visual animation of array operations, comparisons, shifts, and complexity impact.
          </p>
          <div className="hbtns">
            <button className="bp" onClick={openEditor}>Open Editor ↗</button>
            <button className="bg demo-btn" onClick={runDemo}>
              Watch Demo
              <span className="demo-arrow" aria-hidden="true">→</span>
            </button>
          </div>
          <div className="quick-actions">
            <button className="qa" onClick={() => runCode("arr.append(88)")}>append</button>
            <button className="qa" onClick={() => runCode("arr.index(33)")}>search</button>
            <button className="qa" onClick={() => runCode("arr.insert(1, 50)")}>insert</button>
            <button className="qa" onClick={() => runCode("arr.reverse()")}>reverse</button>
          </div>
        </div>

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
              <div className="cpane">
                <div className="cline"><span className="ln">1</span><span className="ct"><span className="cm">// Shahira Code React Live Editor</span></span></div>
                <div className="cline"><span className="ln">2</span><span className="ct"><span className="cm">// Use any variable: nums, myArray, data...</span></span></div>
                <div className="cline"><span className="ln">3</span><span className="ct" /></div>
                <div className="cline"><span className="ln">4</span><span className="ct"><span className="kw">{arrayVarName}</span> = []</span></div>
                <div className="cline"><span className="ln">5</span><span className="ct" /></div>

                {history.map((item) => (
                  <div key={`${item.line}-${item.code}`} className="cline">
                    <span className="ln">{item.line}</span>
                    <span className="ct" dangerouslySetInnerHTML={{ __html: syntaxColor(item.code) }} />
                  </div>
                ))}

                <div id="inputLine">
                  <span className="ln">{lineCount}</span>
                  <input
                    ref={inputRef}
                    id="userInput"
                    placeholder="nums = [3,1,2] or myArray.append(9)"
                    spellCheck="false"
                    autoComplete="off"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={onEnter}
                  />
                </div>
              </div>

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
                      onClick={clearLogs}
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
            </div>
          </div>
        </div>
      </section>

      <section className="sec" id="problems" data-reveal>
        <p className="stag">Problem Sets</p>
        <h2>Curated Practice With Live Demos</h2>
        <p className="ssub">Pick a problem card to trigger an animation pattern and understand the operation sequence visually.</p>
        <div className="problem-grid">
          {curatedProblems.map((item) => (
            <article key={item.title} className="problem-card">
              <div className="problem-top">
                <span className={`pill level-${item.level.toLowerCase()}`}>{item.level}</span>
                <span className="pill topic">{item.topic}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button className="bp small" onClick={() => runProblemDemo(item.command)}>
                Run: {item.command}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="sec" data-reveal>
        <p className="stag">Why Shahira Code</p>
        <h2>Built Different</h2>
        <p className="ssub">Every feature is designed around one goal - making DSA logic click instantly.</p>
        <div className="fgrid">
          <div className="fc"><div className="fic" style={{ background: "rgba(0,245,160,.1)" }}>⚡</div><h3>Live Sync</h3><p>Every character you type drives the animation instantly.</p></div>
          <div className="fc"><div className="fic" style={{ background: "rgba(0,212,255,.1)" }}>🧠</div><h3>Step Logic</h3><p>Step messages make every memory change obvious.</p></div>
          <div className="fc"><div className="fic" style={{ background: "rgba(255,170,0,.1)" }}>📊</div><h3>Complexity Live</h3><p>Time and space update as each operation runs.</p></div>
          <div className="fc"><div className="fic" style={{ background: "rgba(192,132,252,.1)" }}>🎯</div><h3>Placement Ready</h3><p>Practice with realistic operation patterns and visuals.</p></div>
          <div className="fc"><div className="fic" style={{ background: "rgba(0,245,160,.1)" }}>🌐</div><h3>Python Friendly</h3><p>Use Python-like syntax such as arr.append and arr.index.</p></div>
          <div className="fc"><div className="fic" style={{ background: "rgba(0,212,255,.1)" }}>📈</div><h3>Progress Feel</h3><p>Visual feedback helps build intuition faster.</p></div>
        </div>
      </section>

      <section className="topics-sec" id="topics" data-reveal>
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
                  onClick={() => setActiveTopic(topic)}
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
                  onClick={() => setActiveTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cta" data-reveal>
        <p className="stag" style={{ textAlign: "center" }}>GET STARTED</p>
        <h2>Start Visualizing Today</h2>
        <p>Free for students. No install. No credit card. Just open and start coding.</p>
        <div className="ctabtns">
          <button className="bp" onClick={openEditor}>Open Shahira Code Free ↗</button>
          <button className="bg" onClick={() => goToTopics("Sorting")}>See All Topics</button>
        </div>
      </section>

      <footer data-reveal>
        <div className="fl">Shahira <em>Code</em></div>
        <span className="fn2">Built for students. Powered by Shahira Pvt Ltd.</span>
        <span className="fn2">© 2026 Shahira Code</span>
      </footer>
      </>}

      <CodeEditor
        isOpen={isEditorOpen}
        onClose={closeEditor}
        selectedProblem={selectedProblem}
        onProblemCompleted={markProblemAsCompleted}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onRunCurrentLine={runCurrentLineFromEditor}
        onRunAll={runAllFromEditor}
        arr={arr}
        states={states}
        cx={cx}
        logs={logs}
        onClearLogs={clearLogs}
        onClearPreview={clearPreview}
        executionOutput={executionOutput}
      />

      <SimpleEditor
        isOpen={isSimpleEditorOpen}
        onClose={closeSimpleEditor}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onRunAll={runSimpleEditorCode}
        activeLanguage={simpleEditorLanguage}
        onLanguageChange={setSimpleEditorLanguage}
        arr={arr}
        states={states}
        logs={logs}
        onClearLogs={clearLogs}
        onClearPreview={clearPreview}
        executionOutput={executionOutput}
      />

      {authPage === "login" && (
        <Login
          onClose={closeAuthPages}
          onSwitchToSignup={() => setAuthPage("signup")}
          onLogin={handleLoginSuccess}
        />
      )}

      {authPage === "signup" && (
        <Signup
          onClose={closeAuthPages}
          onSwitchToLogin={() => setAuthPage("login")}
          onSignup={handleSignupSuccess}
        />
      )}
    </>
  );
}
