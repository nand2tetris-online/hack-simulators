export type TestScriptProps = {
  script: string | null
}

export function TestScript({ script }: TestScriptProps) {
  return (<div className="testScript"><pre>{script}</pre></div>)
}
