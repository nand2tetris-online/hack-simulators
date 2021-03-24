import { GateClass, PinType } from "./gateclass"
import { Node } from "./node"

export abstract class Gate {
    gateClass: GateClass
    inputPins: Node[]
    outputPins: Node[]

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        this.inputPins = inputPins
        this.outputPins = outputPins
        this.gateClass = gateClass
    }

    abstract reCompute(): void
    abstract clockUp(): void
    abstract clockDown(): void

    getNode(name: string): Node | null {
        const type = this.gateClass.getPinType(name)
        const index = this.gateClass.getPinNumber(name)
        switch (type) {
            case PinType.INPUT:
                return this.inputPins[index]
            case PinType.OUTPUT:
                return this.outputPins[index]
        }
        return null
    }

    tick() {
        this.doEval()
        this.clockUp()
    }

    tock() {
        this.clockDown()
        this.doEval()
    }

    eval() {
        this.doEval()
    }

    doEval() {
        this.reCompute()
    }
}

