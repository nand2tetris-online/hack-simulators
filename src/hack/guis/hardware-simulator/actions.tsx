import { AriaAttributes, ChangeEvent, DOMAttributes, useCallback } from "react"

export type ActionsProps = {
  setHDLFile: (_: File | null) => void
  setUserDefinedParts: (_: Map<string, File> | null) => void
  singleStep: () => void
}

export function Actions({ setHDLFile, setUserDefinedParts, singleStep }: ActionsProps) {
  // TODO: make a better approach
  const setHDLFileFromDirectory = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) {
      console.log("No files found")
      return
    }
    let hasSetHDLFile = false
    let userDefinedParts = new Map<string, File>()
    let firstHDLFile
    for (let i=0; i<files.length; i++) {
      const file = files[i]
      if (file.name.endsWith(".hdl")) {
        if (!hasSetHDLFile) {
          hasSetHDLFile = true
          firstHDLFile = file
        } else {
          userDefinedParts.set(file.name, file)
        }
      }
    }
    setUserDefinedParts(userDefinedParts)
    if (firstHDLFile) {
      setHDLFile(firstHDLFile)
    }
  }, [setHDLFile, setUserDefinedParts])

  return (
    <div>
      <input id="gateFile" type="file" webkitdirectory="" directory="" mozdirectory="" accept=".hdl" onChange={setHDLFileFromDirectory} />
      <label htmlFor="gateFile">Load Chip</label>
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
