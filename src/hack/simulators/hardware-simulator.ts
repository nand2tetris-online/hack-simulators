import { getGateClass } from "../gates"
import { UserDefinedParts } from "../gates/composite-gateclass"
import { Gate } from "../gates/gate"

export class HardwareSimulator {
    gate: Gate | null
    clockUp: boolean

    constructor() {
        this.gate = null
        this.clockUp = false
    }

    loadGate(name: string, userDefinedParts: UserDefinedParts) {
        this.gate = getGateClass(name, userDefinedParts).newInstance()
    }

    step() {
        if (this.clockUp) {
            this.performTock()
        } else {
            this.performTick()
        }
    }

    performTock() {
        if (this.gate === null) return

        this.gate.tock()
        this.clockUp = false
    }

    performTick() {
        if (this.gate === null) return

        this.gate.tick()
        this.clockUp = true
    }

    setInputPin(pinNumber: number, value: number) {
        this.gate?.inputPins[pinNumber].set(value)
    }
}
