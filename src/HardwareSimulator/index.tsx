import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Gate, PinType } from './lib/hack/gates'
import { CompositeGate, CompositeGateClass } from './lib/hack/gates/composite'
import { getGateClassHDL } from './lib/hack/gates/hdl'

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
    updatePin({ value, number, type })
  }, [updatePin])

  return (
    <div>
      <h3>{title}</h3>
      <table>
        <tbody>
          {pinData.map((data, i) => {
            const { name, value } = data
            return (<tr key={i}>
                    <td>{name}</td>
                    <td><input value={value} onChange={(e) => onChange(e.target.value, i, type)} /></td>
                    </tr>)
          })}
        </tbody>
      </table>
    </div>
  )
}

export type PinUpdate = {
  value: string
  number: number
  type: PinType
}

export type PinData = {
  name: string
  value: string
}

export default function HardwareSimulator() {
  const [hdlFile, setHDLFile] = useState<File | null>(null)
  const [hdl, setHDL] = useState<string | null>(null)
  const [pinData, setPinData] = useState<{ input: PinData[], output: PinData[], internal: PinData[] }>({ input: [], output: [], internal: [] })
  const [status, setStatus] = useState<string | null>(null)

  const [clockUp, setClockUp] = useState(false)

  const gate = useRef<Gate | null>(null)

  // load and set hdl file contents
  useEffect(() => {
    (async () => {
      if (!hdlFile) return
      setHDL(await hdlFile.text())
    })()
  }, [hdlFile])

  const updatePinData = useCallback(() => {
    const inputInfo = gate.current?.gateClass.inputPinsInfo ?? []
    const input = gate.current?.inputPins.map((node, i) => {
      if (!inputInfo[i]) {
        throw new Error("no input info found")
      }
      return ({
        name: inputInfo[i].name,
        value: node.value[0].toString(),
      })
    }) ?? []

    const outputInfo = gate.current?.gateClass.outputPinsInfo ?? []
    const output = gate.current?.outputPins.map((node, i) => {
      if (!outputInfo[i]) {
        throw new Error("no output info found")
      }
      return ({
        name: outputInfo[i].name,
        value: node.value[0].toString(2).padStart(outputInfo[i].width, "0"),
      })
    }) ?? []

    const compositeGate = gate.current as CompositeGate
    const compositeClass = compositeGate.gateClass as CompositeGateClass

    const internalInfo = compositeClass.internalPinsInfo ?? []
    const internal = compositeGate.internalPins.map((node, i) => ({
      name: internalInfo[i].name,
      value: node.value[0].toString(2).padStart(internalInfo[i].width, "0"),
    })) ?? []

    setPinData({ input, output, internal })
  }, [])

  // parse hdl file contents into gate
  useEffect(() => {
    if (!hdl) { return }
    try {
      const aGateClass = getGateClassHDL(hdl)
      gate.current = aGateClass.newInstance()
      updatePinData()
      setStatus('Loaded successfully!')
      console.log(gate.current)
    } catch (error) {
      setStatus(`${error}`)
    }
  }, [hdl, updatePinData])

  const singleStep = useCallback(() => {
    console.log('singleStep')
    if (clockUp) {
      // perform tock
      gate.current?.tock()
      setClockUp(false)
    } else {
      // perform tick
      gate.current?.tick()
      setClockUp(true)
    }
    updatePinData()
  }, [updatePinData, clockUp, setClockUp])

  const updatePin = useCallback(({ value, number, type }: PinUpdate) => {
    // can only update input pins
    if (type !== PinType.INPUT) { return }
    gate.current?.inputPins[number].set(parseInt(value) || 0)
    updatePinData()
  }, [updatePinData])

  const hdlFileName = hdlFile?.name ?? null

  return (
    <div>
      <h1>HardwareSimulator</h1>
      <Actions setHDLFile={setHDLFile} singleStep={singleStep} />
      <Pins title="Input Pins" type={PinType.INPUT} pinData={pinData.input} updatePin={updatePin} />
      <Pins title="Output Pins" type={PinType.OUTPUT} pinData={pinData.output} updatePin={updatePin} />
      <Pins title="Internal Pins" type={PinType.INTERNAL} pinData={pinData.internal} updatePin={updatePin} />
      <ChipName name={hdlFileName} />
      <HDLViewer hdl={hdl} />
      <StatusMessage status={status} />
    </div>
  )
}
