import { BuiltInGate } from "./../builtin-gate"

export class HalfAdder extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        this.outputPins[0].set(a ^ b)
        this.outputPins[1].set(a & b)
    }
}

export class FullAdder extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        const c = this.inputPins[2].get()
        const sum = a + b + c
        this.outputPins[0].set(sum % 2)
        this.outputPins[1].set(sum / 2)
    }
}

export class Add16 extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        this.outputPins[0].set(a + b)
    }
}

export class Inc16 extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        this.outputPins[0].set(a + 1)
    }
}

export class ALU extends BuiltInGate {
    reCompute() {
        let x = this.inputPins[0].get()
        let y = this.inputPins[1].get()
        const zx = this.inputPins[2].get()
        const nx = this.inputPins[3].get()
        const zy = this.inputPins[4].get()
        const ny = this.inputPins[5].get()
        const f = this.inputPins[6].get()
        const no = this.inputPins[7].get()

        if (zx) { x = 0 }
        if (nx) { x = ~x }
        if (zy) { y = 0 }
        if (ny) { y = ~y }
        let result = f === 1 ? (x+y) : (x&y)
        if (no) { result = ~result }

        this.outputPins[0].set(result) // out
        this.outputPins[1].set(result === 0 ? 1 : 0) // zr
        this.outputPins[2].set(result < 0 ? 1 : 0) // ng
    }
}

const gates = { HalfAdder, FullAdder, Add16, Inc16, ALU }

export default gates
