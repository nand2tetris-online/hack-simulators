export type TestScriptProps = {
  script: string | null
  currentLine: number | null
}

export function TestScript({ script, currentLine }: TestScriptProps) {
  const lines = (script ?? '').split('\n');
  return (<div className="testScript">
          {lines.map((line, index) => {
            const classes = `testLine ${(index-1) === currentLine ? 'highlight' : ''}`;
            return (<pre key={index} className={classes}>{line}</pre>);
          })}
        </div>)
}
