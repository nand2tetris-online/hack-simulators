import { GateClass, PinType } from "."

export class Node {
    value: number = 0

    protected listeners: Set<Node> | null = null

    get() {
        return this.value
    }

    set(value: number) {
        if (value !== this.value) {
            this.value = value

            if (this.listeners) {
                for (let listener of this.listeners) {
                    listener.set(this.get())
                }
            }
        }
    }

    addListener(node: Node) {
        if (!this.listeners) { 
            this.listeners = new Set()
        }
        this.listeners.add(node)
    }

    removeListener(node: Node) {
        if (this.listeners) {
            this.listeners.delete(node)
        }
    }
}

export abstract class Gate {
    gateClass: GateClass
    inputPins: Node[]
    outputPins: Node[]
    isDirty: boolean

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        this.inputPins = inputPins
        this.outputPins = outputPins
        this.gateClass = gateClass

        this.isDirty = false
    }

    abstract reCompute(): void

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

    eval() {
        if (this.isDirty) {
            this.doEval()
        }
    }
    
    doEval() {
        this.reCompute()
    }
}

export class BuiltInGate extends Gate {
    reCompute() {}
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
