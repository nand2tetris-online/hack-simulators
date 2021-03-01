import React, { useEffect, useState } from 'react'
import { getGateClassHDL, PinInfo } from './lib/hack/gates'
import { Gate, Node } from './lib/hack/gates/builtins'

export type ActionsProps = {
  setHDLFile: (_: File | null) => void
  singleStep: () => void
}
export function Actions({ setHDLFile, singleStep }: ActionsProps) {
  return (
    <div>
      <label>Load Chip
        <input type="file" accept=".hdl" onChange={(e) => setHDLFile(e.target.files?.item(0) ?? null)} />
      </label>
      <button onClick={singleStep}>Single Step</button>
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

export type PinsProps = {
  title: string
  pinNodes: Node[]
  pinInfos: PinInfo[]
  editable: boolean
}
export function Pins ({ title, pinNodes, pinInfos, editable }: PinsProps) {
  return (
    <div>
      <h3>{title}</h3>
      <table>
        <tbody>
          {pinNodes.map((node, i) => {
            const info = pinInfos[i]
            const name = info.name
            const value = node.value
            const valueUI = editable ? <input value={value} onChange={(e) => node.set(parseInt(e.target.value))} /> : <input value={value} readOnly />
            return (<tr key={i}><td>{name}</td><td>{valueUI}</td></tr>)
          })}
        </tbody>
      </table>
    </div>
  )
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
    console.log(gate)
  }, [gate])

  const inputPinNodes = gate?.inputPins ?? []
  const inputPinsInfo = gate?.gateClass.inputPinsInfo ?? []
  const outputPinNodes = gate?.outputPins ?? []
  const outputPinsInfo = gate?.gateClass.outputPinsInfo ?? []
  const hdlFileName = hdlFile?.name ?? null

  return (
    <div>
      <h1>HardwareSimulator</h1>
      <Actions setHDLFile={setHDLFile} singleStep={() => gate?.eval()} />
      <Pins title="Input Pins" editable={true} pinNodes={inputPinNodes} pinInfos={inputPinsInfo} />
      <Pins title="Output Pins" editable={false} pinNodes={outputPinNodes} pinInfos={outputPinsInfo} />
      <ChipName name={hdlFileName} />
      <HDLViewer hdl={hdl} />
      <StatusMessage status={status} />
    </div>
  )
}
