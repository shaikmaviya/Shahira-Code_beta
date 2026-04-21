import { useMemo } from "react";
import "./Problems.css";

const problemFolders = {
  Arrays: [
 
  {
    "id": 1,
    "title": "Find Maximum",
    "level": "Easy",
    "statement": "Find the largest number in the array.",
    "input": "Test Case: nums = [3,5,1,9,2]",
    "output": "9",
    "starterCommand": "arr.max()"
  },
  {
    "id": 2,
    "title": "Find Minimum",
    "level": "Easy",
    "statement": "Find the smallest number in the array.",
    "input": "Test Case: nums = [3,5,1,9,2]",
    "output": "1",
    "starterCommand": "arr.min()"
  },
  {
    "id": 3,
    "title": "Sum of Array",
    "level": "Easy",
    "statement": "Add all elements in the array and return the sum.",
    "input": "Test Case: nums = [1,2,3,4]",
    "output": "10",
    "starterCommand": "arr.sumAll()"
  },
  {
    "id": 4,
    "title": "Count Even Numbers",
    "level": "Easy",
    "statement": "Count how many even numbers are present in the array.",
    "input": "Test Case: nums = [1,2,3,4,6]",
    "output": "3",
    "starterCommand": "arr.countEven()"
  },
  {
    "id": 5,
    "title": "Reverse Array",
    "level": "Easy",
    "statement": "Reverse the given array and print the result.",
    "input": "Test Case: nums = [1,2,3,4]",
    "output": "[4,3,2,1]",
    "starterCommand": "arr.reverse()"
  },
  {
    "id": 6,
    "title": "Find Index of Element",
    "level": "Easy",
    "statement": "Find the index of a given target value in the array.",
    "input": "Test Case: nums = [5,3,7,1], target = 7",
    "output": "2",
    "starterCommand": "arr.indexOf(7)"
  },
  {
    "id": 7,
    "title": "Check Element Exists",
    "level": "Easy",
    "statement": "Check if a target value exists in the array.",
    "input": "Test Case: nums = [2,4,6,8], target = 5",
    "output": "false",
    "starterCommand": "arr.contains(5)"
  }

  ]
};

export default function Problems({ onClose, onSelectProblem, completedProblemIds }) {
  const activeProblems = useMemo(() => problemFolders.Arrays, []);

  return (
    <div className="problems-overlay" role="dialog" aria-modal="true" aria-label="Problems folders and statements">
      <div className="problems-modal">
        <div className="problems-head">
          <div>
            <h2>Problems</h2>
            <p>Choose a folder to view problem statements by topic.</p>
          </div>
          <button className="bg" onClick={onClose}>Close</button>
        </div>

        <div className="problems-list">
          {activeProblems.map((problem) => (
            <article key={problem.id} className="problem-statement-card">
              <div className="problem-meta">
                <span className={`pill level-${problem.level.toLowerCase()}`}>{problem.level}</span>
                {completedProblemIds.includes(problem.id) && <span className="pill solved">Completed</span>}
              </div>
              <h3>{problem.title}</h3>
              <p>{problem.statement}</p>
              <button className="bp small problem-open-btn" onClick={() => onSelectProblem(problem)}>
                <span>Open</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M9 5h10v10M19 5l-9 9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
