import React, { useCallback, useEffect, useRef, useState } from "react"
import { CompositeGate } from "./../../gates/composite-gate"
import { CompositeGateClass } from "./../../gates/composite-gateclass"
import { PinInfo, PinType } from "./../../gates/gateclass"
import { Actions } from "./actions"
import { HDLViewer } from "./hdl-viewer"
import { Pins } from "./pins"
import { StatusMessage } from "./status-message"
import { ChipName } from "./chip-name"
import { HardwareSimulator } from "../../simulators/hardware-simulator"
import { Gate } from "../../gates/gate"

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

export function getPinData(gate: Gate, pinType: PinType): PinData[] {
  let pinInfo: PinInfo[] = []
  switch (pinType) {
    case PinType.INPUT:
      pinInfo = gate.gateClass.inputPinsInfo ?? []
      return gate.inputPins.map((node, i) => ({name: pinInfo[i].name, value: node.value[0].toString()}))
    case PinType.OUTPUT:
      pinInfo = gate.gateClass.outputPinsInfo ?? []
      return gate.outputPins.map((node, i) => ({name: pinInfo[i].name, value: node.value[0].toString()}))
    case PinType.INTERNAL:
      const compositeGate = gate as CompositeGate
      const compositeClass = compositeGate.gateClass as CompositeGateClass
      pinInfo = compositeClass.internalPinsInfo ?? []
      return compositeGate.internalPins.map((node, i) => ({name: pinInfo[i].name, value: node.value[0].toString()}))
  }
  throw new Error(`pinType is ${pinType}`)
}

export default function HardwareSimulatorUI() {
  const [hdlFile, setHDLFile] = useState<File | null>(null)
  const [_, setUserDefinedParts] = useState<Map<string, File> | null>(null)
  const [hdl, setHDL] = useState<string | null>(null)
  const [pinData, setPinData] = useState<AllPinData>({ input: [], output: [], internal: [] })
  const [status, setStatus] = useState<string | null>(null)

  const simulator = useRef(new HardwareSimulator())

  // load and set hdl file contents
  useEffect(() => {
    (async () => {
      if (!hdlFile) return
      setHDL(await hdlFile.text())
    })()
  }, [hdlFile])

  // update UI
  const updatePinData = useCallback(() => {
    if (!simulator.current.gate) {
      throw new Error("updatePinData: gate can not be null")
    }
    const input = getPinData(simulator.current.gate, PinType.INPUT)
    const output = getPinData(simulator.current.gate, PinType.OUTPUT)
    const internal = getPinData(simulator.current.gate, PinType.INTERNAL)
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
      <Actions setHDLFile={setHDLFile} setUserDefinedParts={setUserDefinedParts} singleStep={singleStep} />
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
