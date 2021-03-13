import { AriaAttributes, ChangeEvent, DOMAttributes, useCallback } from "react"
import { UserDefinedParts } from "../../gates/composite-gateclass"

export type ActionsProps = {
  hdlFileName: string | null
  setHDLFileName: (_: string | null) => void
  userDefinedParts: UserDefinedParts | null
  setUserDefinedParts: (_: UserDefinedParts | null) => void
  singleStep: () => void
}

export function Actions({ hdlFileName, setHDLFileName, userDefinedParts, setUserDefinedParts, singleStep }: ActionsProps) {
  // TODO: make a better approach
  const setWorkingDirectory = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) {
      throw new Error("no files found")
    }
    let userDefinedParts = new Map<string, string>()
    let firstHDLFile
    for (let i=0; i<files.length; i++) {
      const file = files[i]
      if (file.name.endsWith(".hdl")) {
        if (!firstHDLFile) {
          firstHDLFile = file
        }
        userDefinedParts.set(file.name, await file.text())
      }
    }
    setUserDefinedParts(userDefinedParts)
    if (firstHDLFile) {
      setHDLFileName(firstHDLFile.name)
    }
  }, [setHDLFileName, setUserDefinedParts])

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
