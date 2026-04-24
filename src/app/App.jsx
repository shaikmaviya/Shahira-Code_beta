import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProblemsPage from "../pages/ProblemsPage";
import CodeEditor from "../components/editors/CodeEditor";
import SimpleEditor from "../components/editors/SimpleEditor";
import ProfilePage from "../pages/ProfilePage";
import ContactPage from "../pages/ContactPage";
import PricingPage from "../pages/PricingPage";
import HomePage from "../pages/HomePage";
import Login from "../features/auth/Login";
import Signup from "../features/auth/Signup";
import { logoutUser } from "../features/auth/authApi";
import { createPricingSignup, saveUserProblem, upsertUserProgress } from "../services/profileApi";
import { executeArrayCode } from "../features/arrays/executeArrayCode";
import { executeCode } from "../services/editorApi";

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

function extractAssignmentFromProblemInput(problemInput) {
  if (!problemInput) {
    return null;
  }

  const match = String(problemInput).match(/([A-Za-z_$][\w$]*)\s*=\s*\[[^\]]*\]/);
  return match ? match[0] : null;
}

function buildProblemStarterCode(problem) {
  if (!problem) {
    return "";
  }

  const assignment = extractAssignmentFromProblemInput(problem.input || "");
  const variableNameMatch = assignment?.match(/^([A-Za-z_$][\w$]*)\s*=/);
  const variableName = variableNameMatch ? variableNameMatch[1] : "arr";
  const starterCommand = (problem.starterCommand || "").replace(/\barr\b/g, variableName);

  return [assignment, starterCommand].filter(Boolean).join("\n");
}

function isPrintStatement(code) {
  const normalized = String(code || "").trim();
  return /^(?:print|System\.out\.println)\s*\(.*\)\s*;?\s*$/.test(normalized);
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

const ROUTE_PATHS = {
  home: "/",
  problems: "/problems",
  profile: "/profile",
  pricing: "/pricing",
  contact: "/contact",
  login: "/login",
  signup: "/signup"
};

function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export default function App() {
  const [arr, setArr] = useState([12, 45, 7, 33, 21]);
  const [states, setStates] = useState(["", "", "", "", ""]);
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
  const introEditorLines = useMemo(
    () => [
      { type: "comment", content: "Shahira Code React Live Editor" },
      { type: "comment", content: "Use any variable: nums, myArray, data..." },
      { type: "blank", content: "" },
      { type: "code", content: `${arrayVarName} = []` },
      { type: "blank", content: "" }
    ],
    [arrayVarName]
  );
  const nextLandingLineNumber = introEditorLines.length + history.length + 1;

  const syncRouteState = useCallback((pathname) => {
    const normalizedPath = normalizePath(pathname);
    const knownPaths = new Set(Object.values(ROUTE_PATHS));
    const resolvedPath = knownPaths.has(normalizedPath) ? normalizedPath : ROUTE_PATHS.home;

    if (resolvedPath !== normalizedPath) {
      window.history.replaceState({}, "", resolvedPath);
    }

    setIsProblemsOpen(resolvedPath === ROUTE_PATHS.problems);
    setIsProfileOpen(resolvedPath === ROUTE_PATHS.profile);
    setIsPricingOpen(resolvedPath === ROUTE_PATHS.pricing);
    setIsContactOpen(resolvedPath === ROUTE_PATHS.contact);
    setAuthPage(
      resolvedPath === ROUTE_PATHS.login
        ? "login"
        : resolvedPath === ROUTE_PATHS.signup
          ? "signup"
          : "none"
    );
  }, []);

  const navigateTo = useCallback((pathname) => {
    const normalizedPath = normalizePath(pathname);

    if (window.location.pathname !== normalizedPath) {
      window.history.pushState({}, "", normalizedPath);
    }

    syncRouteState(normalizedPath);
  }, [syncRouteState]);

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

  useEffect(() => {
    syncRouteState(window.location.pathname);

    function handlePopState() {
      syncRouteState(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [syncRouteState]);

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
      const next = [...prev, { code }];

      // Keep command history bounded for a stable editor height/performance.
      return next.slice(-250);
    });
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
      navigateTo(ROUTE_PATHS.login);
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
    navigateTo(ROUTE_PATHS.problems);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeProblemsPage() {
    navigateTo(ROUTE_PATHS.home);
  }

  function openProfilePage() {
    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    navigateTo(ROUTE_PATHS.profile);
  }

  function closeProfilePage() {
    navigateTo(ROUTE_PATHS.home);
  }

  function openPricingPage() {
    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    navigateTo(ROUTE_PATHS.pricing);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openContactPage(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    navigateTo(ROUTE_PATHS.contact);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setIsEditorOpen(false);
    setIsSimpleEditorOpen(false);
    setSelectedProblem(null);
    navigateTo(ROUTE_PATHS.home);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProblemInEditor(problem) {
    const starterCode = buildProblemStarterCode(problem);
    const extractedProblemArray = extractArrayFromCode(starterCode);

    setIsProblemsOpen(false);
    setInputValue(starterCode);
    setArrayVarName(extractedProblemArray?.name || "arr");
    setArr(extractedProblemArray?.values || []);
    setStates(Array.isArray(extractedProblemArray?.values) ? extractedProblemArray.values.map(() => "") : []);
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

  async function runCurrentLineFromEditor(lineNumber) {
    const lines = inputValue.split("\n");
    const requestedIndex = typeof lineNumber === "number" ? lineNumber - 1 : lines.length - 1;
    const safeIndex = Math.min(Math.max(requestedIndex, 0), Math.max(lines.length - 1, 0));
    const latest = (lines[safeIndex] || "").trim();
    if (latest) {
      const result = await runCode(latest);
      setExecutionOutput({
        stdout: isPrintStatement(latest) && result ? result : "",
        stderr: "",
        output: isPrintStatement(latest) && result ? result : "",
        language: "visual"
      });
      return result;
    }

    setExecutionOutput({
      stdout: "",
      stderr: "",
      output: "",
      language: "visual"
    });

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
    const printOutputs = [];
    for (const line of lines) {
      // Run each command in sequence so animations remain understandable.
      const currentResult = await runCode(line);
      if (String(currentResult || "").trim()) {
        latestResult = currentResult;
      }

      if (isPrintStatement(line) && String(currentResult || "").trim()) {
        printOutputs.push(String(currentResult).trim());
      }
    }

    const combinedPrintOutput = printOutputs.join("\n");
    setExecutionOutput({
      stdout: combinedPrintOutput,
      stderr: "",
      output: combinedPrintOutput,
      language: "visual"
    });

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
      navigateTo(ROUTE_PATHS.login);
      return;
    }

    openEditor();
    setInputValue(command);
    runCode(command);
  }

  function openAuthLogin() {
    navigateTo(ROUTE_PATHS.login);
  }

  function closeAuthPages() {
    navigateTo(ROUTE_PATHS.home);
  }

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    navigateTo(ROUTE_PATHS.home);
    addLog(`Welcome back, ${user.name}`, "ok");
  }

  function handleSignupSuccess(user) {
    setCurrentUser(user);
    navigateTo(ROUTE_PATHS.home);
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
    setSelectedProblem(null);
    navigateTo(ROUTE_PATHS.home);
    addLog("Logged out", "info");
  }

  async function handlePricingSignup(planName, price) {
    const token = localStorage.getItem("codeviz_token");
    if (!token) {
      navigateTo(ROUTE_PATHS.login);
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
                href={ROUTE_PATHS.home}
                onClick={(event) => {
                  event.preventDefault();
                  goHome();
                }}
              >
                Home
              </a>
            </li>
            <li><a href={`${ROUTE_PATHS.home}#topics`} onClick={goHome}>Topics</a></li>
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
            navigateTo(ROUTE_PATHS.login);
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
        <ProblemsPage
          onClose={goHome}
          onSelectProblem={openProblemInEditor}
          completedProblemIds={completedProblemIds}
        />
      )}

      {isContactOpen && (
        <ContactPage onBack={goHome} />
      )}

      {!isPricingOpen && !isProfileOpen && !isProblemsOpen && !isContactOpen && authPage === "none" && (
        <HomePage
          inputRef={inputRef}
          editorPanelRef={editorPanelRef}
          logRef={logRef}
          editorGlow={editorGlow}
          introEditorLines={introEditorLines}
          history={history}
          nextLandingLineNumber={nextLandingLineNumber}
          syntaxColor={syntaxColor}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onInputKeyDown={onEnter}
          arr={arr}
          states={states}
          cx={cx}
          logs={logs}
          onClearLogs={clearLogs}
          onOpenEditor={openEditor}
          onRunDemo={runDemo}
          onRunQuickAction={runCode}
          curatedProblems={curatedProblems}
          onRunProblemDemo={runProblemDemo}
          topicMarquee={topicMarquee}
          activeTopic={activeTopic}
          onSetActiveTopic={setActiveTopic}
          onGoToTopics={goToTopics}
        />
      )}

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
        arrayVarName={arrayVarName}
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
        arrayVarName={arrayVarName}
        logs={logs}
        onClearLogs={clearLogs}
        onClearPreview={clearPreview}
        executionOutput={executionOutput}
      />

      {authPage === "login" && (
        <Login
          onClose={closeAuthPages}
          onSwitchToSignup={() => navigateTo(ROUTE_PATHS.signup)}
          onLogin={handleLoginSuccess}
        />
      )}

      {authPage === "signup" && (
        <Signup
          onClose={closeAuthPages}
          onSwitchToLogin={() => navigateTo(ROUTE_PATHS.login)}
          onSignup={handleSignupSuccess}
        />
      )}
    </>
  );
}

