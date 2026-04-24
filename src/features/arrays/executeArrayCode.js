function toInt(value) {
  return /^-?\d+$/.test(value) ? Number.parseInt(value, 10) : null;
}

function normalizeLoopCode(code) {
  return code.endsWith("{") ? code.slice(0, -1).trim() : code;
}

function normalizePythonLoopCode(code) {
  return code.endsWith(":") ? code.slice(0, -1).trim() : code;
}

function parseStep(rawStep) {
  const step = rawStep.replace(/\s+/g, "");
  if (step === "++") {
    return 1;
  }

  if (step === "--") {
    return -1;
  }

  const plusEq = step.match(/^\+=(-?\d+)$/);
  if (plusEq) {
    return Number.parseInt(plusEq[1], 10);
  }

  const minusEq = step.match(/^-=(\d+)$/);
  if (minusEq) {
    return -Number.parseInt(minusEq[1], 10);
  }

  return null;
}

function evaluateCondition(index, operator, bound) {
  if (operator === "<") {
    return index < bound;
  }

  if (operator === "<=") {
    return index <= bound;
  }

  if (operator === ">") {
    return index > bound;
  }

  return index >= bound;
}

function readVar(runtime, name) {
  if (typeof runtime.getVar === "function") {
    return runtime.getVar(name);
  }

  return undefined;
}

function hasVar(runtime, name) {
  if (typeof runtime.hasVar === "function") {
    return runtime.hasVar(name);
  }

  return false;
}

function writeVar(runtime, name, value) {
  if (typeof runtime.setVar === "function") {
    runtime.setVar(name, value);
  }
}

function resolveScalarValue(runtime, token) {
  const trimmed = token.trim();
  const asInt = toInt(trimmed);
  if (asInt !== null) {
    return asInt;
  }

  const builtinExtremaMatch = trimmed.match(/^(max|min)\(\s*([A-Za-z_$][\w$]*)\s*\)$/);
  if (builtinExtremaMatch) {
    const [, op] = builtinExtremaMatch;
    const arr = runtime.getArr();
    if (!arr.length) {
      return undefined;
    }

    return op === "max" ? Math.max(...arr) : Math.min(...arr);
  }

  const methodExtremaMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\.\s*(max|min)\s*\(\s*\)$/);
  if (methodExtremaMatch) {
    const [, , op] = methodExtremaMatch;
    const arr = runtime.getArr();
    if (!arr.length) {
      return undefined;
    }

    return op === "max" ? Math.max(...arr) : Math.min(...arr);
  }

  const lenMatch = trimmed.match(/^len\(\s*([A-Za-z_$][\w$]*)\s*\)$/);
  if (lenMatch) {
    return runtime.getArr().length;
  }

  const indexMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s*\[\s*(-?\d+)\s*\]$/);
  if (indexMatch) {
    const index = Number.parseInt(indexMatch[2], 10);
    const arr = runtime.getArr();
    if (index >= 0 && index < arr.length) {
      return arr[index];
    }

    return undefined;
  }

  return readVar(runtime, trimmed);
}

function parsePrintArgument(rawArg) {
  const arg = rawArg.trim();
  const quoted = arg.match(/^(["'])(.*)\1$/);
  if (quoted) {
    return { type: "string", value: quoted[2] };
  }

  return { type: "value", value: arg };
}

function splitPrintArgs(rawArgs) {
  const args = [];
  let current = "";
  let quote = "";

  for (let i = 0; i < rawArgs.length; i += 1) {
    const ch = rawArgs[i];

    if ((ch === '"' || ch === "'") && (!quote || quote === ch)) {
      if (quote === ch) {
        quote = "";
      } else {
        quote = ch;
      }
      current += ch;
      continue;
    }

    if (ch === "," && !quote) {
      if (current.trim()) {
        args.push(current.trim());
      }
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

async function flash(runtime, nextArr, nextStates, wait) {
  runtime.setArr(nextArr);
  runtime.setStates(nextStates);
  await runtime.sleep(wait);
}

async function execPush(runtime, value) {
  const currentArr = runtime.getArr();
  runtime.setCx({ time: "O(1)", space: "O(1)" });
  runtime.addLog(`push(${value}) -> adding`, "info");
  const next = [...currentArr, value];
  await flash(runtime, next, next.map((_, i) => (i === next.length - 1 ? "new" : "")), 340);
  runtime.setStates(next.map(() => ""));
  runtime.addLog(`Added ${value} at index ${next.length - 1}`, "ok");
  return JSON.stringify(next);
}

async function execPop(runtime) {
  const currentArr = runtime.getArr();
  if (!currentArr.length) {
    runtime.addLog("Array is empty", "err");
    return "";
  }

  runtime.setCx({ time: "O(1)", space: "O(1)" });
  const value = currentArr[currentArr.length - 1];
  runtime.addLog(`pop() -> removing ${value}`, "info");
  await flash(runtime, currentArr, currentArr.map((_, i) => (i === currentArr.length - 1 ? "removing" : "")), 430);
  const next = currentArr.slice(0, -1);
  runtime.setArr(next);
  runtime.setStates(next.map(() => ""));
  runtime.addLog(`Removed ${value}`, "ok");
  return JSON.stringify(next);
}

async function execShift(runtime) {
  const currentArr = runtime.getArr();
  if (!currentArr.length) {
    runtime.addLog("Array is empty", "err");
    return "";
  }

  runtime.setCx({ time: "O(n)", space: "O(1)" });
  const value = currentArr[0];
  runtime.addLog(`shift() -> removing ${value} from front`, "info");
  await flash(runtime, currentArr, currentArr.map((_, i) => (i === 0 ? "removing" : "compare")), 380);
  const next = currentArr.slice(1);
  runtime.setArr(next);
  runtime.setStates(next.map(() => ""));
  runtime.addLog(`Shifted ${value}`, "ok");
  return JSON.stringify(next);
}

async function execUnshift(runtime, value) {
  const currentArr = runtime.getArr();
  runtime.setCx({ time: "O(n)", space: "O(1)" });
  runtime.addLog(`unshift(${value}) -> adding to front`, "info");
  await flash(runtime, currentArr, currentArr.map(() => "compare"), 320);
  const next = [value, ...currentArr];
  await flash(runtime, next, next.map((_, i) => (i === 0 ? "new" : "")), 340);
  runtime.setStates(next.map(() => ""));
  runtime.addLog(`Inserted ${value} at index 0`, "ok");
  return JSON.stringify(next);
}

async function execSort(runtime) {
  const currentArr = runtime.getArr();
  runtime.setCx({ time: "O(n^2)", space: "O(1)" });
  runtime.addLog("sort() -> bubble sort", "info");

  const a = [...currentArr];
  for (let i = 0; i < a.length - 1; i += 1) {
    for (let j = 0; j < a.length - i - 1; j += 1) {
      runtime.setArr([...a]);
      runtime.setStates(a.map((_, k) => (k === j || k === j + 1 ? "compare" : "")));
      await runtime.sleep(280);
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        runtime.setArr([...a]);
        runtime.setStates(a.map((_, k) => (k === j || k === j + 1 ? "swap" : "")));
        runtime.addLog(`Swapped ${a[j]} and ${a[j + 1]}`, "warn");
        await runtime.sleep(300);
      }
    }
  }

  runtime.setArr([...a]);
  runtime.setStates(a.map(() => "sorted"));
  runtime.addLog("Array sorted", "ok");
  await runtime.sleep(500);
  runtime.setStates(a.map(() => ""));
  return JSON.stringify(a);
}

async function execSearch(runtime, value) {
  const currentArr = runtime.getArr();
  runtime.setCx({ time: "O(n)", space: "O(1)" });
  runtime.addLog(`search(${value}) -> scanning`, "info");

  for (let i = 0; i < currentArr.length; i += 1) {
    runtime.setStates(currentArr.map((_, k) => (k === i ? "active" : "")));
    runtime.addLog(`Index ${i}: ${currentArr[i]}`, "info");
    await runtime.sleep(320);
    if (currentArr[i] === value) {
      runtime.setStates(currentArr.map((_, k) => (k === i ? "found" : "")));
      runtime.addLog(`Found ${value} at index ${i}`, "ok");
      await runtime.sleep(620);
      runtime.setStates(currentArr.map(() => ""));
      return String(i);
    }
  }

  runtime.setStates(currentArr.map(() => ""));
  runtime.addLog(`${value} not found`, "err");
  return "";
}

async function execInsert(runtime, index, value) {
  const currentArr = runtime.getArr();
  if (index < 0 || index > currentArr.length) {
    runtime.addLog(`Index out of bounds (0-${currentArr.length})`, "err");
    return "";
  }

  runtime.setCx({ time: "O(n)", space: "O(1)" });
  runtime.addLog(`insert(${index}, ${value}) -> shift right`, "info");
  await flash(runtime, currentArr, currentArr.map((_, i) => (i >= index ? "compare" : "")), 340);

  const next = [...currentArr];
  next.splice(index, 0, value);
  await flash(runtime, next, next.map((_, i) => (i === index ? "new" : "")), 340);
  runtime.setStates(next.map(() => ""));
  runtime.addLog(`Inserted ${value} at index ${index}`, "ok");
  return JSON.stringify(next);
}

async function execRemove(runtime, index) {
  const currentArr = runtime.getArr();
  if (index < 0 || index >= currentArr.length) {
    runtime.addLog(`Index out of bounds (0-${currentArr.length - 1})`, "err");
    return "";
  }

  runtime.setCx({ time: "O(n)", space: "O(1)" });
  const value = currentArr[index];
  runtime.addLog(`remove(${index}) -> removing ${value}`, "info");
  await flash(runtime, currentArr, currentArr.map((_, i) => (i === index ? "removing" : "")), 400);

  const next = [...currentArr];
  next.splice(index, 1);
  await flash(runtime, next, next.map((_, i) => (i >= index ? "compare" : "")), 280);
  runtime.setStates(next.map(() => ""));
  runtime.addLog(`Removed ${value}`, "ok");
  return JSON.stringify(next);
}

async function execReverse(runtime) {
  const currentArr = runtime.getArr();
  runtime.setCx({ time: "O(n)", space: "O(1)" });
  runtime.addLog("reverse() -> two-pointer swap", "info");
  const a = [...currentArr];
  let l = 0;
  let r = a.length - 1;

  while (l < r) {
    runtime.setArr([...a]);
    runtime.setStates(a.map((_, i) => (i === l || i === r ? "swap" : "")));
    await runtime.sleep(320);
    [a[l], a[r]] = [a[r], a[l]];
    l += 1;
    r -= 1;
    runtime.setArr([...a]);
    runtime.setStates(a.map(() => ""));
    await runtime.sleep(180);
  }

  runtime.setArr([...a]);
  runtime.setStates(a.map(() => "sorted"));
  runtime.addLog("Array reversed", "ok");
  await runtime.sleep(450);
  runtime.setStates(a.map(() => ""));
  return JSON.stringify(a);
}

async function execSum(runtime, target) {
  const currentArr = runtime.getArr();
  runtime.setCx({ time: "O(n)", space: "O(n)" });
  runtime.addLog(`sum(${target}) -> finding two indices`, "info");

  const seen = new Map();
  for (let i = 0; i < currentArr.length; i += 1) {
    const needed = target - currentArr[i];
    runtime.setStates(currentArr.map((_, k) => (k === i ? "active" : "")));
    await runtime.sleep(300);

    if (seen.has(needed)) {
      const j = seen.get(needed);
      runtime.setStates(currentArr.map((_, k) => (k === i || k === j ? "found" : "")));
      runtime.addLog(`Two Sum result: [${j}, ${i}]`, "ok");
      await runtime.sleep(650);
      runtime.setStates(currentArr.map(() => ""));
      return JSON.stringify([j, i]);
    }

    seen.set(currentArr[i], i);
  }

  runtime.setStates(currentArr.map(() => ""));
  runtime.addLog(`No two numbers found for target ${target}`, "err");
  return "";
}

async function execSumByIndices(runtime, i, j) {
  const currentArr = runtime.getArr();
  if (i < 0 || i >= currentArr.length || j < 0 || j >= currentArr.length) {
    runtime.addLog(`Index out of bounds (0-${currentArr.length - 1})`, "err");
    return "";
  }

  runtime.setCx({ time: "O(1)", space: "O(1)" });
  runtime.setStates(currentArr.map((_, k) => (k === i || k === j ? "found" : "")));
  await runtime.sleep(450);

  const result = currentArr[i] + currentArr[j];
  runtime.addLog(`sum([${i}, ${j}]) -> ${currentArr[i]} + ${currentArr[j]} = ${result}`, "ok");
  runtime.setStates(currentArr.map(() => ""));
  return String(result);
}

async function execGet(runtime, index) {
  const currentArr = runtime.getArr();
  if (index < 0 || index >= currentArr.length) {
    runtime.addLog(`Index out of bounds (0-${currentArr.length - 1})`, "err");
    return "";
  }

  runtime.setCx({ time: "O(1)", space: "O(1)" });
  runtime.setStates(currentArr.map((_, i) => (i === index ? "found" : "")));
  await runtime.sleep(320);
  runtime.setStates(currentArr.map(() => ""));
  runtime.addLog(`get(${index}) -> ${currentArr[index]}`, "ok");
  return String(currentArr[index]);
}

async function execSet(runtime, index, value) {
  const currentArr = runtime.getArr();
  if (index < 0 || index >= currentArr.length) {
    runtime.addLog(`Index out of bounds (0-${currentArr.length - 1})`, "err");
    return "";
  }

  runtime.setCx({ time: "O(1)", space: "O(1)" });
  const next = [...currentArr];
  next[index] = value;
  await flash(runtime, next, next.map((_, i) => (i === index ? "new" : "")), 320);
  runtime.setStates(next.map(() => ""));
  runtime.addLog(`set(${index}, ${value}) -> updated`, "ok");
  return JSON.stringify(next);
}

async function execIndexLoop(runtime, iteratorName, start, operator, boundOffset, step) {
  const initialArr = runtime.getArr();
  const baseBound = initialArr.length;
  const bound = baseBound + boundOffset;
  let iterations = 0;
  let index = start;

  runtime.setCx({ time: "O(n)", space: "O(1)" });
  runtime.addLog(`for-loop start (${iteratorName})`, "info");
  runtime.setStates(initialArr.map(() => ""));
  await runtime.sleep(100);

  while (evaluateCondition(index, operator, bound)) {
    const currentArr = runtime.getArr();
    if (iterations > currentArr.length * 4 + 20) {
      runtime.addLog("Loop stopped (safety limit reached)", "err");
      break;
    }

    const inRange = index >= 0 && index < currentArr.length;
    writeVar(runtime, iteratorName, index);
    runtime.setStates(currentArr.map((_, i) => (i === index ? "active" : "")));

    if (inRange) {
      runtime.addLog(`${iteratorName}=${index}, value=${currentArr[index]}`, "info");
    } else {
      runtime.addLog(`${iteratorName}=${index} (out of bounds)`, "warn");
    }

    await runtime.sleep(280);
    index += step;
    iterations += 1;
  }

  runtime.setStates(runtime.getArr().map(() => ""));
  runtime.addLog(`for-loop complete (${iterations} iterations)`, "ok");
  return JSON.stringify(runtime.getArr());
}

async function execForOfLoop(runtime, valueName) {
  const currentArr = runtime.getArr();
  const trackMax = hasVar(runtime, "max_val");
  let maxValue = trackMax ? readVar(runtime, "max_val") : undefined;

  runtime.setCx({ time: "O(n)", space: "O(1)" });
  runtime.addLog(`for-of loop start (${valueName})`, "info");

  if (trackMax) {
    runtime.addLog("Compare with next values:", "info");
  }

  runtime.setStates(currentArr.map(() => ""));
  await runtime.sleep(100);

  for (let i = 0; i < currentArr.length; i += 1) {
    writeVar(runtime, valueName, currentArr[i]);
    runtime.setStates(currentArr.map((_, k) => (k === i ? "active" : "")));

    if (trackMax && Number.isFinite(maxValue)) {
      const value = currentArr[i];
      if (value > maxValue) {
        runtime.addLog(`${value} > ${maxValue} -> update max = ${value}`, "ok");
        maxValue = value;
        writeVar(runtime, "max_val", maxValue);
      } else {
        runtime.addLog(`${value} > ${maxValue} -> no change`, "info");
      }
    } else {
      runtime.addLog(`${valueName}=${currentArr[i]} at index ${i}`, "info");
    }

    await runtime.sleep(280);
  }

  runtime.setStates(currentArr.map(() => ""));
  runtime.addLog(`for-of loop complete (${currentArr.length} iterations)`, "ok");
  return JSON.stringify(currentArr);
}

function execLength(runtime) {
  const len = runtime.getArr().length;
  runtime.setCx({ time: "O(1)", space: "O(1)" });
  runtime.addLog(`length() -> ${len}`, "ok");
  return String(len);
}

function execClear(runtime) {
  runtime.setCx({ time: "O(1)", space: "O(1)" });
  runtime.setArr([]);
  runtime.setStates([]);
  runtime.addLog("clear() -> array reset", "ok");
  return JSON.stringify([]);
}

function execMin(runtime) {
  const currentArr = runtime.getArr();
  if (!currentArr.length) {
    runtime.addLog("Array is empty", "err");
    return "";
  }

  const min = Math.min(...currentArr);
  runtime.setCx({ time: "O(n)", space: "O(1)" });
  runtime.addLog(`min() -> ${min}`, "ok");
  return String(min);
}

function execMax(runtime) {
  const currentArr = runtime.getArr();
  if (!currentArr.length) {
    runtime.addLog("Array is empty", "err");
    return "";
  }

  runtime.setCx({ time: "O(n)", space: "O(1)" });

  let maxValue = currentArr[0];
  runtime.addLog(`Start with max_val = ${maxValue}`, "info");
  runtime.addLog("Compare with next values:", "info");

  for (let i = 1; i < currentArr.length; i += 1) {
    const value = currentArr[i];
    if (value > maxValue) {
      runtime.addLog(`${value} > ${maxValue} -> update max = ${value}`, "ok");
      maxValue = value;
    } else {
      runtime.addLog(`${value} > ${maxValue} -> no change`, "info");
    }
  }

  runtime.addLog(`Maximum value: ${maxValue}`, "ok");
  return String(maxValue);
}

export async function executeArrayCode(code, runtime) {
  const normalizedCode = normalizeLoopCode(code.trim());
  const pythonNormalizedCode = normalizePythonLoopCode(normalizedCode);
  if (!normalizedCode || normalizedCode === "}") {
    return "";
  }

  const forIndexMatch = normalizedCode.match(
    /^for\s*\(\s*(?:(?:let|const|var)\s+)?([A-Za-z_$][\w$]*)\s*=\s*(-?\d+)\s*;\s*\1\s*(<=|<|>=|>)\s*([A-Za-z_$][\w$]*)\.length\s*(?:([+-])\s*(\d+))?\s*;\s*\1\s*(\+\+|--|\+=\s*-?\d+|-=\s*\d+)\s*\)\s*$/
  );

  if (forIndexMatch) {
    const [, iteratorName, rawStart, operator, variableName, offsetSign, rawOffset, rawStep] = forIndexMatch;
    const start = Number.parseInt(rawStart, 10);
    const offset = rawOffset ? Number.parseInt(rawOffset, 10) : 0;
    const boundOffset = offsetSign === "-" ? -offset : offset;
    const step = parseStep(rawStep);

    runtime.setArrayVarName(variableName);

    if (step === null || step === 0) {
      runtime.addLog("Invalid loop step. Use ++, --, +=k, or -=k", "err");
      return "";
    }

    return await execIndexLoop(runtime, iteratorName, start, operator, boundOffset, step);
  }

  const forOfMatch = normalizedCode.match(
    /^for\s*\(\s*(?:(?:let|const|var)\s+)?([A-Za-z_$][\w$]*)\s+of\s+([A-Za-z_$][\w$]*)\s*\)\s*$/
  );

  if (forOfMatch) {
    const [, valueName, variableName] = forOfMatch;
    runtime.setArrayVarName(variableName);
    return await execForOfLoop(runtime, valueName);
  }

  const pythonForRangeSimple = pythonNormalizedCode.match(
    /^for\s+([A-Za-z_$][\w$]*)\s+in\s+range\(\s*len\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\)\s*$/
  );

  if (pythonForRangeSimple) {
    const [, iteratorName, variableName] = pythonForRangeSimple;
    runtime.setArrayVarName(variableName);
    return await execIndexLoop(runtime, iteratorName, 0, "<", 0, 1);
  }

  const pythonForRangeAdvanced = pythonNormalizedCode.match(
    /^for\s+([A-Za-z_$][\w$]*)\s+in\s+range\(\s*(-?\d+)\s*,\s*len\(\s*([A-Za-z_$][\w$]*)\s*\)\s*(?:([+-])\s*(\d+))?\s*(?:,\s*(-?\d+)\s*)?\)\s*$/
  );

  if (pythonForRangeAdvanced) {
    const [, iteratorName, rawStart, variableName, offsetSign, rawOffset, rawStep] = pythonForRangeAdvanced;
    const start = Number.parseInt(rawStart, 10);
    const offset = rawOffset ? Number.parseInt(rawOffset, 10) : 0;
    const boundOffset = offsetSign === "-" ? -offset : offset;
    const step = rawStep ? Number.parseInt(rawStep, 10) : 1;

    if (step === 0) {
      runtime.addLog("Python range step cannot be 0", "err");
      return "";
    }

    runtime.setArrayVarName(variableName);
    return await execIndexLoop(runtime, iteratorName, start, step > 0 ? "<" : ">", boundOffset, step);
  }

  const pythonForOfMatch = pythonNormalizedCode.match(
    /^for\s+([A-Za-z_$][\w$]*)\s+in\s+([A-Za-z_$][\w$]*)\s*$/
  );

  if (pythonForOfMatch) {
    const [, valueName, variableName] = pythonForOfMatch;
    runtime.setArrayVarName(variableName);
    return await execForOfLoop(runtime, valueName);
  }

  const printMatch = pythonNormalizedCode.match(/^(?:print|System\.out\.println)\((.*)\)\s*;?$/);
  if (printMatch) {
    const rawArgs = printMatch[1].trim();
    if (!rawArgs) {
      runtime.addLog("", "ok");
      return "";
    }

    const parts = splitPrintArgs(rawArgs)
      .map(parsePrintArgument)
      .map((part) => {
        if (part.type === "string") {
          return part.value;
        }

        const resolved = resolveScalarValue(runtime, part.value);
        return resolved === undefined ? null : String(resolved);
      });

    if (parts.some((item) => item === null)) {
      runtime.addLog("print(...) has unresolved value", "warn");
      return "";
    }

    const output = parts.join(" ");
    runtime.addLog(output, "ok");
    return output;
  }

  if (/^(if|elif)\b/.test(pythonNormalizedCode) || /^(else|pass|continue|break)\b/.test(pythonNormalizedCode)) {
    // Visual mode handles loops and operations directly, so control-flow body lines are accepted as no-op.
    return "";
  }

  const declarationMatch = pythonNormalizedCode.match(/^(?:(?:const|let|var)\s+)?([A-Za-z_$][\w$]*)\s*=\s*\[([^\]]*)\]\s*$/);

  if (declarationMatch) {
    const [, variableName, rawValues] = declarationMatch;
    const values = rawValues
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => Number.parseInt(x, 10))
      .filter((x) => Number.isFinite(x));

    runtime.setArrayVarName(variableName);
    runtime.setArr(values);
    runtime.setStates(values.map(() => ""));
    runtime.addLog(`${variableName} initialized with ${values.length} values`, "ok");
    return JSON.stringify(values);
  }

  const scalarAssignment = pythonNormalizedCode.match(/^([A-Za-z_$][\w$]*)\s*=\s*(.+)$/);
  if (scalarAssignment) {
    const [, name, rawValue] = scalarAssignment;
    const value = resolveScalarValue(runtime, rawValue);

    if (value !== undefined) {
      writeVar(runtime, name, value);
      if (name === "max_val") {
        runtime.addLog(`Start with max_val = ${value}`, "info");
      } else {
        runtime.addLog(`${name} = ${value}`, "info");
      }

      return String(value);
    }

    return "";
  }

  const opMatch = pythonNormalizedCode.match(/^([A-Za-z_$][\w$]*)\s*\.\s*([A-Za-z_][\w]*)\s*\((.*)\)\s*$/);
  if (!opMatch) {
    runtime.addLog(
      "Unknown command. Try nums = [1,2,3], nums.append(9), for (let i = 0; i < nums.length; i++), or for i in range(len(nums)):",
      "err"
    );
    return "";
  }

  const variableName = opMatch[1];
  const operation = opMatch[2].toLowerCase();
  const rawArgs = opMatch[3].trim();
  const args = rawArgs ? rawArgs.split(",").map((x) => x.trim()) : [];
  runtime.setArrayVarName(variableName);

  if (operation === "push" || operation === "append" || operation === "add") {
    const value = toInt(args[0] || "");
    if (value === null) {
      runtime.addLog("add/append/push expects one numeric value", "err");
      return "";
    }

    return await execPush(runtime, value);
  }

  if (operation === "pop") {
    return await execPop(runtime);
  }

  if (operation === "shift") {
    return await execShift(runtime);
  }

  if (operation === "unshift") {
    const value = toInt(args[0] || "");
    if (value === null) {
      runtime.addLog("unshift expects one numeric value", "err");
      return "";
    }

    return await execUnshift(runtime, value);
  }

  if (operation === "sort") {
    return await execSort(runtime);
  }

  if (operation === "search" || operation === "find" || operation === "index") {
    const value = toInt(args[0] || "");
    if (value === null) {
      runtime.addLog("search/find/index expects one numeric value", "err");
      return "";
    }

    return await execSearch(runtime, value);
  }

  if (operation === "sum") {
    const pairMatch = rawArgs.match(/^\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]$/);
    const firstArg = toInt(args[0] || "");
    const secondArg = toInt(args[1] || "");

    if (pairMatch) {
      const i = Number.parseInt(pairMatch[1], 10);
      const j = Number.parseInt(pairMatch[2], 10);
      return await execSumByIndices(runtime, i, j);
    }

    if (firstArg !== null && secondArg !== null && args.length >= 2) {
      return await execSumByIndices(runtime, firstArg, secondArg);
    }

    if (firstArg !== null) {
      return await execSum(runtime, firstArg);
    }

    runtime.addLog("sum expects sum(target) or sum([i,j]) or sum(i,j)", "err");
    return "";
  }

  if (operation === "insert") {
    const index = toInt(args[0] || "");
    const value = toInt(args[1] || "");
    if (index === null || value === null) {
      runtime.addLog("insert expects index and numeric value", "err");
      return "";
    }

    return await execInsert(runtime, index, value);
  }

  if (operation === "get") {
    const index = toInt(args[0] || "");
    if (index === null) {
      runtime.addLog("get expects one numeric index", "err");
      return "";
    }

    return await execGet(runtime, index);
  }

  if (operation === "set") {
    const index = toInt(args[0] || "");
    const value = toInt(args[1] || "");
    if (index === null || value === null) {
      runtime.addLog("set expects index and numeric value", "err");
      return "";
    }

    return await execSet(runtime, index, value);
  }

  if (operation === "delete" || operation === "removeat") {
    const index = toInt(args[0] || "");
    if (index === null) {
      runtime.addLog("delete/removeAt expects one numeric index", "err");
      return "";
    }

    return await execRemove(runtime, index);
  }

  if (operation === "remove") {
    const arg = toInt(args[0] || "");
    if (arg === null) {
      runtime.addLog("remove expects one numeric value/index", "err");
      return "";
    }

    const currentArr = runtime.getArr();
    if (arg >= 0 && arg < currentArr.length) {
      return await execRemove(runtime, arg);
    }

    const idx = currentArr.indexOf(arg);
    if (idx === -1) {
      runtime.addLog(`${arg} not found for remove`, "err");
      return "";
    }

    return await execRemove(runtime, idx);
  }

  if (operation === "reverse") {
    return await execReverse(runtime);
  }

  if (operation === "length" || operation === "size") {
    return execLength(runtime);
  }

  if (operation === "clear") {
    return execClear(runtime);
  }

  if (operation === "min") {
    return execMin(runtime);
  }

  if (operation === "max") {
    return execMax(runtime);
  }

  runtime.addLog(`Unknown operation: ${operation}`, "err");
  return "";
}
