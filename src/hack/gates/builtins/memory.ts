import { BuiltInGate } from "./../builtin-gate"
import { GateClass } from "../gateclass"
import { Node } from "../node"

export class Bit extends BuiltInGate {
    state: number

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass)
        this.state = 0
    }

    clockUp() {
        const load = this.inputPins[1].get()
        if (load === 1)
            this.state = this.inputPins[0].get()
    }

    clockDown() {
        this.outputPins[0].set(this.state)
    }
}

export class Register extends BuiltInGate {
    state: number

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass)
        this.state = 0
    }

    clockUp() {
        const load = this.inputPins[1].get()
        if (load === 1)
            this.state = this.inputPins[0].get()
    }

    clockDown() {
        this.outputPins[0].set(this.state)
    }
}

export class PC extends BuiltInGate {
    value: number

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass)
        this.value = 0
    }

    clockUp() {
        const _in = this.inputPins[0].get()
        const load = this.inputPins[1].get()
        const inc = this.inputPins[2].get()
        const reset = this.inputPins[3].get()
        if (reset === 1)
            this.value = 0
        else if (load === 1)
            this.value = _in
        else if (inc === 1)
            this.value++
    }

    clockDown() {
        this.outputPins[0].set(this.value)
    }
}

export class RAM extends BuiltInGate {
    size: number

    values: Uint16Array

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass, size: number) {
        super(inputPins, outputPins, gateClass)
        this.size = size
        this.values = new Uint16Array(size)
    }

    clockUp() {
        const _in = this.inputPins[0].get()
        const load = this.inputPins[1].get()
        const address = this.inputPins[2].get()
        if (load === 1) {
            this.values[address] = _in
        }
    }

    clockDown() {
        this.reCompute()
    }

    reCompute() {
        const address = this.inputPins[2].get()
        this.outputPins[0].set(this.values[address])
    }
}

export class RAM8 extends RAM {
    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass, 8)
    }
}

export class RAM64 extends RAM {
    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass, 64)
    }
}

export class RAM512 extends RAM {
    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass, 512)
    }
}

export class RAM4K extends RAM {
    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass, 4096)
    }
}

export class RAM16K extends RAM {
    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass, 16384)
    }
}

const gates = { Bit, Register, PC, RAM, RAM8, RAM64, RAM512, RAM4K, RAM16K }
export default gates
