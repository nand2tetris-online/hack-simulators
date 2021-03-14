import { AriaAttributes, ChangeEvent, DOMAttributes, useCallback } from "react"
import { UserDefinedParts } from "../../gates/composite-gateclass"

export type ActionsProps = {
  hdlFileName: string | null
  setHDLFileName: (_: string | null) => void
  userDefinedParts: UserDefinedParts | null
  setUserDefinedParts: (_: UserDefinedParts | null) => void
  testScript: string | null
  setTestScript: (_: string | null) => void
  testScripts: Map<string, string> | null
  setTestScripts: (_: Map<string, string> | null) => void
  singleStep: () => void
  setFormat: (_: string) => void
}

export function Actions({ hdlFileName, setHDLFileName, userDefinedParts, setUserDefinedParts, testScript, setTestScript, testScripts, setTestScripts, singleStep, setFormat }: ActionsProps) {
  // TODO: make a better approach
  const setWorkingDirectory = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) {
      throw new Error("no files found")
    }
    let userDefinedParts = new Map<string, string>()
    let testScripts = new Map<string, string>()
    let firstHDLFile
    for (let i=0; i<files.length; i++) {
      const file = files[i]
      if (file.name.endsWith(".hdl")) {
        if (!firstHDLFile) {
          firstHDLFile = file
        }
        userDefinedParts.set(file.name, await file.text())
      } else if (file.name.endsWith(".tst")) {
        testScripts.set(file.name, await file.text())
      }
    }
    setTestScripts(testScripts)
    setUserDefinedParts(userDefinedParts)
    if (firstHDLFile) {
      setHDLFileName(firstHDLFile.name)
    }
  }, [setHDLFileName, setUserDefinedParts, setTestScripts])

  const scripts = Array.from(testScripts?.keys() ?? [])

  return (
    <div className="actions">
      <input type="file" webkitdirectory="" directory="" mozdirectory="" onChange={setWorkingDirectory} />
      <select onChange={(e) => setHDLFileName(e.target.value)}>
      {Array.from(userDefinedParts?.keys() ?? []).map((filename) => {
        if (filename === hdlFileName) {
          return (<option selected key={filename} value={filename}>{filename}</option>)
        } else {
          return (<option key={filename} value={filename}>{filename}</option>)
        }
      })}
      </select>
      <select onChange={(e) => setTestScript(e.target.value)}>
      {
        scripts.map((filename) => {
          if (filename === testScript) {
            return (<option selected key={filename} value={filename}>{filename}</option>)
          } else {
            return (<option key={filename} value={filename}>{filename}</option>)
          }
        })
      }
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
