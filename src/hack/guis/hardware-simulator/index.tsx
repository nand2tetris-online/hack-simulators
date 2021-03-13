import React, { useCallback, useEffect, useRef, useState } from "react"
import { getGateClassHDL } from "./../../gates"
import { CompositeGate } from "./../../gates/composite-gate"
import { CompositeGateClass } from "./../../gates/composite-gateclass"
import { Gate } from "./../../gates/gate"
import { PinType } from "./../../gates/gateclass"
import { Actions } from "./actions"
import { HDLViewer } from "./hdl-viewer"
import { Pins } from "./pins"
import { StatusMessage } from "./status-message"
import { ChipName } from "./chip-name"
import { HardwareSimulator } from "../../simulators/hardware-simulator"

export type PinUpdate = {
  value: string
  number: number
  type: PinType
}

export type PinData = {
  name: string
  value: string
}

export type AllPinData = {
  input: PinData[],
  output: PinData[],
  internal: PinData[]
}

export default function HardwareSimulatorUI() {
  const [hdlFile, setHDLFile] = useState<File | null>(null)
  const [hdl, setHDL] = useState<string | null>(null)
  const [pinData, setPinData] = useState<AllPinData>({ input: [], output: [], internal: [] })
  const [status, setStatus] = useState<string | null>(null)

  const simulator = useRef<HardwareSimulator>(new HardwareSimulator())

  // load and set hdl file contents
  useEffect(() => {
    (async () => {
      if (!hdlFile) return
      setHDL(await hdlFile.text())
    })()
  }, [hdlFile])

  const updatePinData = useCallback(() => {
    const inputInfo = simulator.current.gate?.gateClass.inputPinsInfo ?? []
    const input = simulator.current.gate?.inputPins.map((node, i) => {
      return ({
        name: inputInfo[i].name,
        value: node.value[0].toString(),
      })
    }) ?? []

    const outputInfo = simulator.current.gate?.gateClass.outputPinsInfo ?? []
    const output = simulator.current.gate?.outputPins.map((node, i) => {
      return ({
        name: outputInfo[i].name,
        value: node.value[0].toString(2).padStart(outputInfo[i].width, "0"),
      })
    }) ?? []

    const compositeGate = simulator.current.gate as CompositeGate
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
      simulator.current.loadGate(hdl)
      updatePinData()
      setStatus("Loaded successfully!")
      console.log(simulator.current.gate)
    } catch (error) {
      setStatus(`${error}`)
    }
  }, [hdl, updatePinData])

  // step forward one time unit
  const singleStep = useCallback(() => {
    simulator.current.step()
    updatePinData()
  }, [updatePinData])

  // set input pin
  const updateInputPin = useCallback(({ value, number, type }: PinUpdate) => {
    // can only update input pins
    if (type !== PinType.INPUT) { return }
    simulator.current.setInput(number, parseInt(value) || 0)
    updatePinData()
  }, [updatePinData])

  const hdlFileName = hdlFile?.name ?? null

  return (
    <div>
      <h1>HardwareSimulator</h1>
      <Actions setHDLFile={setHDLFile} singleStep={singleStep} />
      <ChipName name={hdlFileName} />
      <div className="container">
        <Pins title="Input Pins" type={PinType.INPUT} pinData={pinData.input} updatePin={updateInputPin} />
        <Pins title="Output Pins" type={PinType.OUTPUT} pinData={pinData.output} updatePin={updateInputPin} />
        <HDLViewer hdl={hdl} />
        <Pins title="Internal Pins" type={PinType.INTERNAL} pinData={pinData.internal} updatePin={updateInputPin} />
      </div>
      <StatusMessage status={status} />
    </div>
  )
}
