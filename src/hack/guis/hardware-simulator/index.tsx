import React, { useCallback, useEffect, useRef, useState } from "react"
import { CompositeGate } from "./../../gates/composite-gate"
import { CompositeGateClass, UserWorkspace } from "./../../gates/composite-gateclass"
import { PinInfo, PinType } from "./../../gates/gateclass"
import { Actions } from "./actions"
import { HDLViewer } from "./hdl-viewer"
import { Pins } from "./pins"
import { StatusMessage } from "./status-message"
import { HardwareSimulator } from "../../simulators/hardware-simulator"
import { Gate } from "../../gates/gate"
import { TestScript } from "./test-script"
import { HackController } from "../../controller/controller"

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
  const [userWorkspace, setUserWorkspace] = useState<UserWorkspace | null>(null)
  const [gateFilename, setGateFilename] = useState<string | null>(null)
  const [testScript, setTestScript] = useState<string | null>("default.tst")

  const [pinData, setPinData] = useState<AllPinData>({ input: [], output: [], internal: [] })
  const [status, setStatus] = useState<string | null>(null)

  const [format, setFormat] = useState<string>("decimal")

  const controller = useRef(new HackController(new HardwareSimulator()))

  // update UI
  const updatePinData = useCallback(() => {
    const gate = controller.current.getGate()
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
    if (!gateFilename || !userWorkspace) { return }
    if (!gateFilename.endsWith(".hdl")) { return }
    const gateName = gateFilename.slice(0, -4)
    try {
      controller.current.loadGate(gateName, userWorkspace)
      updatePinData()
      setStatus("Loaded successfully!")
      console.log(controller.current.getGate())
    } catch (error) {
      setStatus(`${error}`)
    }
  }, [gateFilename, userWorkspace, updatePinData])

  // set up test script
  useEffect(() => {
    if (!testScript || !userWorkspace) { return; }
    controller.current.loadScript(testScript, userWorkspace)
  }, [testScript, userWorkspace]);

  // step forward one time unit
  const singleStep = useCallback(() => {
    controller.current.singleStep()
    updatePinData()
  }, [updatePinData])

  // set input pin
  const updateInputPin = useCallback(({ value, number, type }: PinUpdate) => {
    // can only update input pins
    if (type !== PinType.INPUT) { return }
    controller.current.setInputPin(number, parseInt(value) || 0)
    updatePinData()
  }, [updatePinData])

  let hdl = "No hdl file"
  if (userWorkspace && gateFilename) {
    hdl = userWorkspace.get(gateFilename) ?? ""
  }

  // userWorkspace?.set("default.tst", "repeat {\n    tick,\n    tock;\n}")
  userWorkspace?.set("default.tst", "tick;\ntock;\n")
  const displayScript = (testScript ? userWorkspace?.get(testScript) : null) ?? "No test found"

  return (
    <div id="hardwareSimulator">
      <div className="header">
        <h1>HardwareSimulator</h1>
      </div>
      <Actions
        hdlFilename={gateFilename}
        setHDLFileName={setGateFilename}
        userWorkspace={userWorkspace}
        setUserWorkspace={setUserWorkspace}
        testScript={testScript}
        setTestScript={setTestScript}
        setFormat={setFormat}
        singleStep={singleStep} />
      <div className="container">
        <Pins title="Input Pins" type={PinType.INPUT} pinData={pinData.input} updatePin={updateInputPin} format={format} />
        <Pins title="Output Pins" type={PinType.OUTPUT} pinData={pinData.output} updatePin={updateInputPin} format={format} />
        <TestScript script={displayScript} />
        <HDLViewer hdl={hdl} />
        <Pins title="Internal Pins" type={PinType.INTERNAL} pinData={pinData.internal} updatePin={updateInputPin} format={format} />
      </div>
      <StatusMessage status={status} />
    </div>
  )
}

export function getPinData(gate: Gate, pinType: PinType): PinData[] | never {
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
    default:
      throw new Error(`pinType is ${pinType}`)
  }
}
