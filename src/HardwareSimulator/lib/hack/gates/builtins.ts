import { GateClass } from "."

export class Node {
    value: number = 0

    get() {
        return this.value
    }

    set(value: number) {
        this.value = value
    }
}

export class BuiltInGate {
    inputPins: Node[]
    outputPins: Node[]
    gateClass: GateClass
    
    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        this.inputPins = inputPins
        this.outputPins = outputPins
        this.gateClass = gateClass
    }
}

export class Nand extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        this.outputPins[0].set(0x1 - (a & b))
    }
}

export type BuiltInDef = { hdl: string, gate: typeof BuiltInGate }
export type BuiltIns = { [_: string]: BuiltInDef }

const builtins: BuiltIns = {
    NAND: {
        hdl: `
        // This file is part of www.nand2tetris.org
        // and the book "The Elements of Computing Systems"
        // by Nisan and Schocken, MIT Press.
        // File name: tools/builtIn/Nand.hdl

        /**
            * Nand gate: out = a Nand b.
            */

        CHIP Nand {

            IN  a, b;
            OUT out;

            BUILTIN Nand;
        }`,
        gate: Nand
    }
}

export default builtins
