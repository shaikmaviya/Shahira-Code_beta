import React, { useState } from "react";
import "./PlayGroundPage.css";

function OpenPLayGroundPage() {
  const [arr, setArr] = useState([]);
  const [value, setValue] = useState("");

  // PUSH
  const opPush = () => {
    if (value === "") return;
    setArr([...arr, Number(value)]);
    setValue("");
  };

  // POP
  const opPop = () => {
    if (arr.length === 0) return;
    setArr(arr.slice(0, -1));
  };c

  // RANDOM ARRAY
  const opRandom = () => {
    const randomArr = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 90) + 10
    );
    setArr(randomArr);
  };

  // CLEAR
  const opClear = () => {
    setArr([]);
  };

  return (
    <div className="root">

      {/* Header */}
      <header className="header">
        <h1>DSA Array Visualizer</h1>
      </header>

      {/* Stats */}
      <div className="stats">
        <div>Length: {arr.length}</div>
        <div>Array: [{arr.join(", ")}]</div>
      </div>

      {/* Main */}
      <div className="main">

        {/* LEFT SIDE */}
        <div className="left">

          {/* Array Display */}
          <div className="stage">
            {arr.length === 0 ? (
              <p className="empty">Array is empty</p>
            ) : (
              <div className="array">
                {arr.map((num, i) => (
                  <div key={i} className="cell">
                    {num}
                    <span className="index">[{i}]</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="controls">

            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value"
            />

            <button onClick={opPush}>Push</button>
            <button onClick={opPop}>Pop</button>
            <button onClick={opRandom}>Random</button>
            <button onClick={opClear}>Clear</button>

          </div>

        </div>

        {/* RIGHT SIDE (Code Panel placeholder) */}
        <div className="right">
          <h3>Live Code</h3>
          <pre>
{`// Example Push
arr.push(value);

// Example Pop
arr.pop();`}
          </pre>
        </div>

      </div>
    </div>
  );
}

export default OpenPLayGroundPage;