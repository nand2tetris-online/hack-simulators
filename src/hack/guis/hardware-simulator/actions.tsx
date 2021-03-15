import { AriaAttributes, ChangeEvent, DOMAttributes, useCallback } from "react"
import { UserWorkspace } from "../../gates/composite-gateclass"

export type ActionsProps = {
  hdlFilename: string | null
  setHDLFileName: (_: string | null) => void
  userWorkspace: UserWorkspace | null
  setUserWorkspace: (_: UserWorkspace | null) => void
  testScript: string | null
  setTestScript: (_: string | null) => void
  singleStep: () => void
  setFormat: (_: string) => void
}

export function Actions({ hdlFilename, setHDLFileName, userWorkspace, setUserWorkspace, testScript, setTestScript, singleStep, setFormat }: ActionsProps) {
  // TODO: make a better approach
  const setWorkingDirectory = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) {
      throw new Error("no files found")
    }
    let newUserWorkspace = new Map<string, string>()
    let firstHDLFile
    for (let i=0; i<files.length; i++) {
      const file = files[i]
      if (file.name.endsWith(".hdl") && !firstHDLFile) {
        firstHDLFile = file
      }
      newUserWorkspace.set(file.name, await file.text())
    }
    setUserWorkspace(newUserWorkspace)
    if (firstHDLFile) {
      setHDLFileName(firstHDLFile.name)
    }
  }, [setHDLFileName, setUserWorkspace])

  const scripts = Array.from(userWorkspace?.keys() ?? [])
    .filter((file) => file.endsWith(".tst"))
  const hdls = Array.from(userWorkspace?.keys() ?? [])
    .filter((file) => file.endsWith(".hdl"))

  return (
    <div className="actions">
      <input type="file" webkitdirectory="" directory="" mozdirectory="" onChange={setWorkingDirectory} />
      <select value={hdlFilename ?? undefined} onChange={(e) => setHDLFileName(e.target.value)}>
        {hdls.map((filename) => (<option key={filename} value={filename}>{filename}</option>))}
      </select>
      <select value={testScript ?? undefined} onChange={(e) => setTestScript(e.target.value)}>
        {scripts.map((filename) => (<option key={filename} value={filename}>{filename}</option>))}
      </select>
      <select onChange={(e) => setFormat(e.target.value)}>
        <option key="decimal" value="decimal">Decimal</option>
        <option key="binary" value="binary">Binary</option>
        <option key="hexadecimal" value="hexadecimal">Hexadecimal</option>
      </select>
      <button onClick={singleStep}>Single Step</button>
    </div>
  )
}

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    directory?: string
    webkitdirectory?: string
    mozdirectory?: string
  }
}
