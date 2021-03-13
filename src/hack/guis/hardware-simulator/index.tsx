import React, { useCallback, useEffect, useRef, useState } from "react"
import { CompositeGate } from "./../../gates/composite-gate"
import { CompositeGateClass, UserDefinedParts } from "./../../gates/composite-gateclass"
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

export default function HardwareSimulatorUI() {
  const [gateFilename, setGateFilename] = useState<string | null>(null)
  const [userDefinedParts, setUserDefinedParts] = useState<UserDefinedParts | null>(null)
  const [pinData, setPinData] = useState<AllPinData>({ input: [], output: [], internal: [] })
  const [status, setStatus] = useState<string | null>(null)

  const simulator = useRef(new HardwareSimulator())

  // update UI
  const updatePinData = useCallback(() => {
    const gate = simulator.current.gate
    if (!gate) {
      throw new Error("updatePinData: gate can not be null")
    }
    const input = getPinData(gate, PinType.INPUT)
    const output = getPinData(gate, PinType.OUTPUT)
    const internal = getPinData(gate, PinType.INTERNAL)
    setPinData({ input, output, internal })
  }, [])

  // parse hdl file contents into gate
  useEffect(() => {
    if (!gateFilename || !userDefinedParts) { return }
    if (!gateFilename.endsWith(".hdl")) { return }
    const gateName = gateFilename.slice(0, -4)
    try {
      simulator.current.loadGate(gateName, userDefinedParts)
      updatePinData()
      setStatus("Loaded successfully!")
      console.log(simulator.current.gate)
    } catch (error) {
      setStatus(`${error}`)
    }
  }, [gateFilename, userDefinedParts, updatePinData])

  // step forward one time unit
  const singleStep = useCallback(() => {
    simulator.current.step()
    updatePinData()
  }, [updatePinData])

  // set input pin
  const updateInputPin = useCallback(({ value, number, type }: PinUpdate) => {
    // can only update input pins
    if (type !== PinType.INPUT) { return }
    simulator.current.setInputPin(number, parseInt(value) || 0)
    updatePinData()
  }, [updatePinData])

  let hdl = "No hdl file"
  if (userDefinedParts && gateFilename) {
    hdl = userDefinedParts.get(gateFilename) ?? ""
  }

  return (
    <div>
      <h1>HardwareSimulator</h1>
      <Actions
        hdlFileName={gateFilename}
        setHDLFileName={setGateFilename}
        userDefinedParts={userDefinedParts}
        setUserDefinedParts={setUserDefinedParts}
        singleStep={singleStep} />
      <ChipName name={gateFilename} />
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

export function getPinData(gate: Gate, pinType: PinType): PinData[] {
  let pinInfo: PinInfo[] = []
  switch (pinType) {
    case PinType.INPUT:
      pinInfo = gate.gateClass.inputPinsInfo
      return gate.inputPins.map((node, i) => ({name: pinInfo[i].name, value: node.value[0].toString()}))
    case PinType.OUTPUT:
      pinInfo = gate.gateClass.outputPinsInfo
      return gate.outputPins.map((node, i) => ({name: pinInfo[i].name, value: node.value[0].toString()}))
    case PinType.INTERNAL:
      const compositeGate = gate as CompositeGate
      if (!compositeGate) return []
      const compositeClass = compositeGate.gateClass as CompositeGateClass
      if (!compositeClass) return []
      pinInfo = compositeClass.internalPinsInfo
      return compositeGate.internalPins.map((node, i) => ({name: pinInfo[i].name, value: node.value[0].toString()}))
  }
  throw new Error(`pinType is ${pinType}`)
}
