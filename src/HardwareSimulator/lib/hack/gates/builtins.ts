import { GateClass, PinType } from "."

export class Node {
    value: number = 0

    protected connections: Set<Node> | null = null

    get() { return this.value }

    set(value: number) {
        if (value === this.value) return
        this.value = value
        for (let listener of this.connections ?? []) listener.set(this.get())
    }

    connect(node: Node) {
        if (!this.connections) this.connections = new Set()
        this.connections.add(node)
    }

    disconnect(node: Node) {
        if (this.connections) this.connections.delete(node)
    }
}

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
        this.doEval()
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

export class Not extends BuiltInGate {
    reCompute() {
        const _in = this.inputPins[0].get()
        this.outputPins[0].set(~_in)
    }
}

export type BuiltInDef = { hdl: string, gate: typeof BuiltInGate }
export type BuiltIns = { [_: string]: BuiltInDef }

const builtins: BuiltIns = {
    Nand: {
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
    },
    Not: {
        hdl: `
        // This file is part of the materials accompanying the book 
        // "The Elements of Computing Systems" by Nisan and Schocken, 
        // MIT Press. Book site: www.idc.ac.il/tecs
        // File name: tools/builtIn/Not.hdl

        /**
            * Not gate. out = not in. 
            */

        CHIP Not {

            IN  in;
            OUT out;

            BUILTIN Not;
        }
        `,
        gate: Not
    }
}

export default builtins
