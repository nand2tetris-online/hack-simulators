export type ActionsProps = {
  setHDLFile: (_: File | null) => void
  singleStep: () => void
}

export function Actions({ setHDLFile, singleStep }: ActionsProps) {
  return (
    <div>
      <input id="gateFile" type="file" accept=".hdl" onChange={(e) => setHDLFile(e.target.files?.item(0) ?? null)} />
      <label htmlFor="gateFile">Load Chip</label>
      <button onClick={singleStep}>Single Step</button>
    </div>
  )
}

