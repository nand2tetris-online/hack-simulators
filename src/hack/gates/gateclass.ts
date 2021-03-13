import { Gate } from "./gate"

export enum PinType {
    INPUT = "INPUT",
    OUTPUT = "OUTPUT",
    INTERNAL = "INTERNAL",
    UNKNOWN = "UNKNOWN"
}

export type PinInfo = {
    name: string
    width: number
}

export abstract class GateClass {
    namesToTypes: { [_: string]: PinType }
    namesToNumbers: { [_: string]: number }

    name: string

    inputPinsInfo: PinInfo[]
    outputPinsInfo: PinInfo[]

    isClocked: boolean
    isInputClocked: boolean[]
    isOutputClocked: boolean[]

    constructor(name: string, inputPinsInfo: PinInfo[], outputPinsInfo: PinInfo[]) {
        this.name = name
        this.namesToTypes = {}
        this.namesToNumbers = {}

        this.inputPinsInfo = inputPinsInfo
        this.registerPins(inputPinsInfo, PinType.INPUT)
        this.outputPinsInfo = outputPinsInfo
        this.registerPins(outputPinsInfo, PinType.OUTPUT)

        this.isClocked = false
        this.isInputClocked = []
        this.isOutputClocked = []
    }

    abstract newInstance(): Gate

    getPinInfo(pinType: PinType, pinNumber: number): PinInfo | null {
        switch (pinType) {
            case PinType.INPUT:
                if (pinNumber < this.inputPinsInfo.length) {
                return this.inputPinsInfo[pinNumber]
            }
            break
            case PinType.OUTPUT:
                if (pinNumber < this.outputPinsInfo.length) {
                return this.outputPinsInfo[pinNumber]
            }
            break
        }
        return null
    }

    getPinType(pinName: string): PinType {
        return this.namesToTypes[pinName] ?? PinType.UNKNOWN
    }

    getPinNumber(pinName: string): number {
        return this.namesToNumbers[pinName] ?? -1
    }

    registerPins(pinInfos: PinInfo[], type: PinType) {
        pinInfos.forEach((pinInfo, i) => {
            this.registerPin(pinInfo, type, i)
        })
    }

    registerPin(pinInfo: PinInfo, type: PinType, pinNumber: number) {
        this.namesToTypes[pinInfo.name] = type
        this.namesToNumbers[pinInfo.name] = pinNumber
    }
}
