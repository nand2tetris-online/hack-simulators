import { BuiltInGate } from "./../builtin-gate"

export class Not extends BuiltInGate {
    reCompute() {
        const _in = this.inputPins[0].get()
        this.outputPins[0].set(1 - _in)
    }
}

export class Not16 extends BuiltInGate {
    reCompute() {
        const _in = this.inputPins[0].get()
        this.outputPins[0].set(~_in)
    }
}

export class And extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        this.outputPins[0].set(a & b)
    }
}

export class Xor extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        this.outputPins[0].set(a ^ b)
    }
}

export class Or extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        this.outputPins[0].set(a | b)
    }
}

export class Mux extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        const sel = this.inputPins[2].get()
        this.outputPins[0].set(sel === 0 ? a : b)
    }
}

export class Mux4Way16 extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        const c = this.inputPins[2].get()
        const d = this.inputPins[3].get()
        const sel = this.inputPins[4].get()
        let out = 0
        switch (sel) {
            case 0: out = a; break
            case 1: out = b; break
            case 2: out = c; break
            case 3: out = d; break
        }
        this.outputPins[0].set(out)
    }
}

export class Mux8Way16 extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        const c = this.inputPins[2].get()
        const d = this.inputPins[3].get()
        const e = this.inputPins[4].get()
        const f = this.inputPins[5].get()
        const g = this.inputPins[6].get()
        const h = this.inputPins[7].get()
        const sel = this.inputPins[8].get()
        let out = 0
        switch (sel) {
            case 0: out = a; break
            case 1: out = b; break
            case 2: out = c; break
            case 3: out = d; break
            case 4: out = e; break
            case 5: out = f; break
            case 6: out = g; break
            case 7: out = h; break
        }
        this.outputPins[0].set(out)
    }
}

export class DMux extends BuiltInGate {
    reCompute() {
        const _in = this.inputPins[0].get()
        const sel = this.inputPins[1].get()
        this.outputPins[0].set(sel === 0 ? _in : 0)
        this.outputPins[1].set(sel === 0 ? 0 : _in)
    }
}

export class DMux4Way extends BuiltInGate {
    reCompute() {
        const _in = this.inputPins[0].get()
        const sel = this.inputPins[1].get()
        this.outputPins[0].set(sel === 0 ? _in : 0)
        this.outputPins[1].set(sel === 1 ? _in : 0)
        this.outputPins[2].set(sel === 2 ? _in : 0)
        this.outputPins[3].set(sel === 3 ? _in : 0)
    }
}

export class DMux8Way extends BuiltInGate {
    reCompute() {
        const _in = this.inputPins[0].get()
        const sel = this.inputPins[1].get()
        this.outputPins[0].set(sel === 0 ? _in : 0)
        this.outputPins[1].set(sel === 1 ? _in : 0)
        this.outputPins[2].set(sel === 2 ? _in : 0)
        this.outputPins[3].set(sel === 3 ? _in : 0)
        this.outputPins[4].set(sel === 4 ? _in : 0)
        this.outputPins[5].set(sel === 5 ? _in : 0)
        this.outputPins[6].set(sel === 6 ? _in : 0)
        this.outputPins[7].set(sel === 7 ? _in : 0)
    }
}

export class Or8Way extends BuiltInGate {
    reCompute() {
        const _in = this.inputPins[0].get()
        this.outputPins[0].set(_in === 0 ? 0 : 1)
    }
}

const gates = {
    Not,
    Not16,
    And,
    Or,
    Xor,
    Mux,
    Mux4Way16,
    Mux8Way16,
    DMux,
    DMux4Way,
    DMux8Way,
    Or8Way
}

export default gates
