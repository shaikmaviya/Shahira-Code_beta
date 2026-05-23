export default function HomePlaygroundCodePane({
  inputRef,
  introEditorLines,
  history,
  nextLandingLineNumber,
  syntaxColor,
  inputValue,
  onInputChange,
  onInputKeyDown
}) {
  return (
    <div className="cpane">
      {introEditorLines.map((line, index) => (
        <div key={`intro-line-${index}`} className="cline">
          <span className="ln">{index + 1}</span>
          <span className="ct">
            {line.type === "comment" ? <span className="cm">// {line.content}</span> : line.content}
          </span>
        </div>
      ))}

      {history.map((item, index) => (
        <div key={`${index}-${item.code}`} className="cline">
          <span className="ln">{introEditorLines.length + index + 1}</span>
          <span className="ct" dangerouslySetInnerHTML={{ __html: syntaxColor(item.code) }} />
        </div>
      ))}

      <div id="inputLine">
        <span className="ln">{nextLandingLineNumber}</span>
        <input
          ref={inputRef}
          id="userInput"
          placeholder="nums = [3,1,2] or myArray.append(9)"
          spellCheck="false"
          autoComplete="off"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onInputKeyDown}
        />
      </div>
    </div>
  );
}
