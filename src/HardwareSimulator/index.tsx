import React, { useEffect, useState } from 'react'

import Actions from './Actions'

export type ChipNameProps = { name: string | null }
export function ChipName ({ name }: ChipNameProps) {
  return <div>Chip Name: {name}</div>
}

export type HDLViewerProps = { hdl: string | null }
export function HDLViewer ({ hdl }: HDLViewerProps) {
  return <pre>{hdl}</pre>
}

export type StatusMessageProps = { status: string | null }
export function StatusMessage ({ status }: StatusMessageProps) {
  return <div>{status}</div>
}

export default function HardwareSimulator() {
  const [hdlFile, setHDLFile] = useState<File | null>(null)
  const [hdl, setHDL] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      if (!hdlFile) { return }
      setHDL(await hdlFile.text())
      setStatus('Loaded successfully!')
    })()
  }, [hdlFile])

  useEffect(() => {
    if (!hdl) { return }
    console.log(hdl)
    // setGate(getGateClassFromHDL(hdl))
  }, [hdl])

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
