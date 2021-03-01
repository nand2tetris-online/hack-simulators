import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getGateClassHDL, PinType } from './lib/hack/gates'
import { Gate } from './lib/hack/gates/builtins'

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
  type: PinType 
  pinData: PinData[]
  updatePin: (data: PinUpdate) => void
}
export function Pins ({ title, type, pinData, updatePin }: PinsProps) {
  const onChange = useCallback((value: string, number: number, type: PinType) => {
    const v = parseInt(value) || 0
    if (v > 1) {
      return
    }
    updatePin({ value: v, number, type })
  }, [updatePin])

  return (
    <div>
      <h3>{title}</h3>
      <table>
        <tbody>
          {pinData.map((data, i) => {
            const { name, value } = data
            return (<tr key={i}><td>{name}</td><td><input value={value} onChange={(e) => onChange(e.target.value, i, type)} /></td></tr>)
          })}
        </tbody>
      </table>
    </div>
  )
}

export type PinUpdate = {
  value: number
  number: number
  type: PinType
}

export type PinData = {
  name: string
  value: number
}

export default function HardwareSimulator() {
  const [hdlFile, setHDLFile] = useState<File | null>(null)
  const [hdl, setHDL] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const [pinData, setPinData] = useState<{ input: PinData[], output: PinData[] }>({ input: [], output: [] })

  const gate = useRef<Gate | null>(null)

  // load and set hdl file contents
  useEffect(() => {
    (async () => {
      if (!hdlFile) { return }
      setHDL(await hdlFile.text())
    })()
  }, [hdlFile])

  const updatePinData = useCallback(() => {
    const input = gate.current?.inputPins.map((node, i) => ({
      name: gate.current?.gateClass.inputPinsInfo[i].name ?? '',
      value: node.value
    })) ?? []

    const output = gate.current?.outputPins.map((node, i) => ({
      name: gate.current?.gateClass.outputPinsInfo[i].name ?? '',
      value: node.value
    })) ?? []

    setPinData({ input, output })
  }, [])

  // parse hdl file contents into gate
  useEffect(() => {
    if (!hdl) { return }

    try {
      const aGateClass = getGateClassHDL(hdl)
      gate.current = aGateClass.newInstance()
      updatePinData()
      setStatus('Loaded successfully!')
    } catch (error) {
      setStatus(`${error}`)
    }
  }, [hdl, updatePinData])

  const singleStep = useCallback(() => {
    gate.current?.eval()
    updatePinData()
  }, [updatePinData])

  const updatePin = useCallback(({ value, number, type }: PinUpdate) => {
    // can only update input pins
    if (type !== PinType.INPUT) {
      return
    }
    gate.current?.inputPins[number].set(value)
    updatePinData()
  }, [updatePinData])

  const hdlFileName = hdlFile?.name ?? null

  return (
    <div>
      <h1>HardwareSimulator</h1>
      <Actions setHDLFile={setHDLFile} singleStep={singleStep} />
      <Pins title="Input Pins" type={PinType.INPUT} pinData={pinData.input} updatePin={updatePin} />
      <Pins title="Output Pins" type={PinType.OUTPUT} pinData={pinData.output} updatePin={updatePin} />
      <ChipName name={hdlFileName} />
      <HDLViewer hdl={hdl} />
      <StatusMessage status={status} />
    </div>
  )
}
