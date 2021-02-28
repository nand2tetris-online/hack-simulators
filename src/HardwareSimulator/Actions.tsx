import React from 'react'

type ActionsProps = {
  setHDLFile: (_: File | null) => void
}

export default function Actions({ setHDLFile }: ActionsProps) {
  return (
    <div>
      <label>Load Chip
        <input type="file" accept=".hdl" onChange={(e) => setHDLFile(e.target.files?.item(0) ?? null)} />
      </label>
    </div>
  )
}
