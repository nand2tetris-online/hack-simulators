import { BuiltInGate } from "./../builtin-gate"
import { GateClass } from "../gateclass"
import { Node } from "../node"

export class Screen extends BuiltInGate {
    values: Uint16Array

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass)
        this.values = new Uint16Array(32 * 256)
    }

    clockUp() {
        const _in = this.inputPins[0].get()
        const load = this.inputPins[1].get()
        const address = this.inputPins[2].get()
        if (load === 1) {
            this.values[address] = _in
        }
    }

    reCompute() {
        const address = this.inputPins[2].get()
        this.outputPins[0].set(this.values[address])
    }

    clockDown() {
        this.reCompute()
    }
}

export class Keyboard extends BuiltInGate {
    key: number

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass)
        this.key = -1
    }
}

export class ROM32K extends BuiltInGate {
    static SIZE = 32768

    values: Uint16Array

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass)
        this.values = new Uint16Array(ROM32K.SIZE)
    }

    reCompute() {
        const address = this.inputPins[0].get()
        this.outputPins[0].set(this.values[address])
    }
}

const gates = { Screen, Keyboard, ROM32K }
export default gates
