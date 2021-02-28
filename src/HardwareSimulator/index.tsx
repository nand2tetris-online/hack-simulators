import React, { useEffect, useState } from 'react'
import { getGateClassHDL } from './lib/hack/gates'
import { Gate } from './lib/hack/gates/builtins'

export type ActionsProps = { setHDLFile: (_: File | null) => void }
export function Actions({ setHDLFile }: ActionsProps) {
  return (
    <div>
      <label>Load Chip
        <input type="file" accept=".hdl" onChange={(e) => setHDLFile(e.target.files?.item(0) ?? null)} />
      </label>
    </div>
  )
}

export type ChipNameProps = { name: string | null }
export function ChipName ({ name }: ChipNameProps) {
  return (<div>Chip Name: {name}</div>)
}

export type HDLViewerProps = { hdl: string | null }
export function HDLViewer ({ hdl }: HDLViewerProps) {
  return (<pre>{hdl}</pre>)
}

export type StatusMessageProps = { status: string | null }
export function StatusMessage ({ status }: StatusMessageProps) {
  return (<div>{status}</div>)
}

export default function HardwareSimulator() {
  const [hdlFile, setHDLFile] = useState<File | null>(null)
  const [hdl, setHDL] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [gate, setGate] = useState<Gate | null>(null)

  // load and set hdl file contents
  useEffect(() => {
    (async () => {
      if (!hdlFile) { return }
      setHDL(await hdlFile.text())
    })()
  }, [hdlFile])

  // parse hdl file contents into gate
  useEffect(() => {
    if (!hdl) { return }

    try {
      const aGateClass = getGateClassHDL(hdl)
      setGate(aGateClass.newInstance())
      setStatus('Loaded successfully!')
    } catch (error) {
      setStatus(`${error}`)
    }
  }, [hdl])

  // bind gate to UI
  useEffect(() => {
    console.log(gate?.gateClass)
  }, [gate])

  return (
    <div>
      <h1>HardwareSimulator</h1>
      <Actions setHDLFile={setHDLFile} />
      <ChipName name={hdlFile?.name ?? null} />
      <HDLViewer hdl={hdl} />
      <StatusMessage status={status} />
    </div>
  )
}
