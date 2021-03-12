import { TokenType } from "../../HDLTokenizer"
import { HDLParser } from "../../parser"
import { Gate, GateClass, PinInfo } from "."
import { Node } from "./nodes"
import { readPinsInfo } from "./hdl"

export class BuiltInGate extends Gate {
    reCompute() {}
    clockUp() {}
    clockDown() {}
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

// CH2

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

// CH3

export class DFF extends BuiltInGate {
    state: number

    constructor(inputPins: Node[], outputPins: Node[], gateClass: GateClass) {
        super(inputPins, outputPins, gateClass)
        this.state = 0
    }

    clockUp() {
        this.state = this.inputPins[0].get()
    }

    clockDown() {
        this.outputPins[0].set(this.state)
    }
}

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

export type BuiltInDef = { hdl: string, gate: typeof BuiltInGate }
export type BuiltIns = { [_: string]: BuiltInDef }

export const builtins: BuiltIns = {
    Nand: {
        hdl: `CHIP Nand { IN  a, b; OUT out; BUILTIN Nand; }`,
        gate: Nand
    },
    Not: {
        hdl: `CHIP Not { IN  in; OUT out; BUILTIN Not; } `,
        gate: Not
    },
    Not16: {
      hdl: `CHIP Not16 { IN  in[16]; OUT out[16]; BUILTIN Not16; }`,
      gate: Not16
    },
    And: {
      hdl: `CHIP And { IN  a, b; OUT out; BUILTIN And; } `,
      gate: And
    },
    And16: {
      hdl: `CHIP And16 { IN  a[16], b[16]; OUT out[16]; BUILTIN And; }`,
      gate: And
    },
    Or: {
      hdl: `CHIP Or { IN  a, b; OUT out; BUILTIN Or; }`,
      gate: Or
    },
    Or16: {
      hdl: `CHIP Or16 { IN  a[16], b[16]; OUT out[16]; BUILTIN Or; }`,
      gate: Or
    },
    Xor: {
      hdl: `CHIP Xor { IN  a, b; OUT out; BUILTIN Xor; }`,
      gate: Xor
    },
    Mux: {
      hdl: `CHIP Mux { IN  a, b, sel; OUT out; BUILTIN Mux;}`,
      gate: Mux
    },
    Mux16: {
      hdl: `CHIP Mux16 { IN  a[16], b[16], sel; OUT out[16]; BUILTIN Mux; }`,
      gate: Mux
    },
    Mux4Way16: {
      hdl: ` CHIP Mux4Way16 { IN a[16], b[16], c[16], d[16], sel[2]; OUT out[16]; BUILTIN Mux4Way16; }`,
      gate: Mux4Way16
    },
    Mux8Way16: {
      hdl: `CHIP Mux8Way16 { IN  a[16], b[16], c[16], d[16], e[16], f[16], g[16], h[16], sel[3]; OUT out[16]; BUILTIN Mux8Way16; }`,
      gate: Mux8Way16
    },
    DMux: {
      hdl: `CHIP DMux { IN  in, sel; OUT a, b; BUILTIN DMux; }`,
      gate: DMux
    },
    DMux4Way: {
      hdl: `CHIP DMux4Way { IN  in, sel[2]; OUT a, b, c, d; BUILTIN DMux4Way; }`,
      gate: DMux4Way
    },
    DMux8Way: {
      hdl: `CHIP DMux8Way { IN  in, sel[3]; OUT a, b, c, d, e, f, g, h; BUILTIN DMux8Way; }`,
      gate: DMux8Way
    },
    Or8Way: {
      hdl: `CHIP Or8Way { IN  in[8]; OUT out; BUILTIN Or8Way; }`,
      gate: Or8Way
    },
    // CH2
    HalfAdder: {
      hdl: `CHIP HalfAdder { IN  a, b; OUT sum, carry; BUILTIN HalfAdder; }`,
      gate: HalfAdder
    },
    FullAdder: {
      hdl: `CHIP FullAdder { IN  a, b, c; OUT sum, carry; BUILTIN FullAdder; }`,
      gate: FullAdder
    },
    Add16: {
      hdl: `CHIP Add16 { IN  a[16], b[16]; OUT out[16]; BUILTIN Add16; }`,
      gate: Add16
    },
    Inc16: {
      hdl: `CHIP Inc16 { IN  in[16]; OUT out[16]; BUILTIN Inc16; }`,
      gate: Inc16
    },
    ALU: {
      hdl: `CHIP ALU { IN x[16], y[16], zx, nx, zy, ny, f, no; OUT out[16], zr, ng; BUILTIN ALU; }`,
      gate: ALU
    },
    // CH3
    DFF: {
        hdl: `CHIP DFF { IN  in; OUT out; BUILTIN DFF; CLOCKED in; }`,
        gate: DFF
    },
    Bit: {
        hdl: `CHIP Bit { IN  in, load; OUT out; BUILTIN Bit; CLOCKED in, load; }`,
        gate: Bit
    },
    Register: {
        hdl: `CHIP Register { IN  in[16], load; OUT out[16]; BUILTIN Register; CLOCKED in, load; }`,
        gate: Register
    },
    PC: {
        hdl: `CHIP PC { IN  in[16], load, inc, reset; OUT out[16]; BUILTIN PC; CLOCKED in, load, inc, reset; }`,
        gate: PC
    },
    RAM8: {
        hdl: `CHIP RAM8 { IN  in[16], load, address[3]; OUT out[16]; BUILTIN RAM8; CLOCKED in, load; }`,
        gate: RAM8
    },
    RAM64: {
        hdl: `CHIP RAM64 { IN in[16], load, address[6]; OUT out[16]; BUILTIN RAM64; CLOCKED in, load; }`,
        gate: RAM64
    },
    RAM512: {
        hdl: `CHIP RAM512 { IN  in[16], load, address[9]; OUT out[16]; BUILTIN RAM512; CLOCKED in, load; }`,
        gate: RAM512
    },
    RAM4K: {
        hdl: `CHIP RAM4K { IN  in[16], load, address[12]; OUT out[16]; BUILTIN RAM4K; CLOCKED in, load; }`,
        gate: RAM4K
    },
    RAM16K: {
        hdl: `CHIP RAM16K { IN  in[16], load, address[14]; OUT out[16]; BUILTIN RAM16K; CLOCKED in, load; }`,
        gate: RAM16K
    },
    // CH5
    Screen: {
        hdl: `CHIP Screen { IN in[16], load, address[13]; OUT out[16]; BUILTIN Screen; CLOCKED in, load; }`,
        gate: Screen
    },
    Keyboard: {
        hdl: `CHIP Keyboard { OUT out[16]; BUILTIN Keyboard; }`,
        gate: Keyboard
    },
    ROM32K: {
        hdl: `CHIP ROM32K { IN  address[15]; OUT out[16]; BUILTIN ROM32K; }`,
        gate: ROM32K
    },
}

export class BuiltInGateClass extends GateClass {
  tsClassName: typeof BuiltInGate

  constructor(name: string, parser: HDLParser, inputPinsInfo: PinInfo[], outputPinsInfo: PinInfo[]) {
    super(name, inputPinsInfo, outputPinsInfo)
    // read typescript class name
    parser.expectPeek(TokenType.IDENTIFIER, "Missing typescript class name")
    // TODO: support more than NAND
    switch (name) {
      // CH1
      case "Nand": this.tsClassName = builtins.Nand.gate; break
      case "Not": this.tsClassName = builtins.Not.gate; break
      case "Not16": this.tsClassName = builtins.Not16.gate; break
      case "And": this.tsClassName = builtins.And.gate; break
      case "And16": this.tsClassName = builtins.And16.gate; break
      case "Or": this.tsClassName = builtins.Or.gate; break
      case "Or16": this.tsClassName = builtins.Or16.gate; break
      case "Xor": this.tsClassName = builtins.Xor.gate; break
      case "Mux": this.tsClassName = builtins.Mux.gate; break
      case "Mux16": this.tsClassName = builtins.Mux16.gate; break
      case "Mux4Way16": this.tsClassName = builtins.Mux4Way16.gate; break
      case "Mux8Way16": this.tsClassName = builtins.Mux8Way16.gate; break
      case "DMux": this.tsClassName = builtins.DMux.gate; break
      case "DMux4Way": this.tsClassName = builtins.DMux4Way.gate; break
      case "DMux8Way": this.tsClassName = builtins.DMux8Way.gate; break
      case "Or8Way": this.tsClassName = builtins.Or8Way.gate; break
      // CH2
      case "HalfAdder": this.tsClassName = builtins.HalfAdder.gate; break
      case "FullAdder": this.tsClassName = builtins.FullAdder.gate; break
      case "Add16": this.tsClassName = builtins.Add16.gate; break
      case "Inc16": this.tsClassName = builtins.Inc16.gate; break
      case "ALU": this.tsClassName = builtins.ALU.gate; break
      // CH3
      case "DFF": this.tsClassName = builtins.DFF.gate; break // REQUIRED BUILTIN
      case "Bit": this.tsClassName = builtins.Bit.gate; break
      case "Register": this.tsClassName = builtins.Register.gate; break
      case "PC": this.tsClassName = builtins.PC.gate; break
      case "RAM8": this.tsClassName = builtins.RAM8.gate; break
      case "RAM64": this.tsClassName = builtins.RAM64.gate; break
      case "RAM512": this.tsClassName = builtins.RAM512.gate; break
      case "RAM4K": this.tsClassName = builtins.RAM4K.gate; break
      case "RAM16K": this.tsClassName = builtins.RAM16K.gate; break
      // CH5
      case "Screen": this.tsClassName = builtins.Screen.gate; break
      case "Keyboard": this.tsClassName = builtins.Keyboard.gate; break
      case "ROM32K": this.tsClassName = builtins.ROM32K.gate; break
      default: parser.fail(`Unexpected gate class name ${name}`)
    }
    // read ';' symbol
    parser.expectPeek(TokenType.SEMICOLON, "Missing ';'")

    this.isInputClocked = new Array(inputPinsInfo.length)
    this.isOutputClocked = new Array(outputPinsInfo.length)

    if (parser.peekTokenIs(TokenType.CLOCKED)) {
        this.isClocked = true
        const clockedPins = readPinsInfo(parser)
        for (let i=0; i<clockedPins.length; i++) {
            let inputFound = false
            let outputFound = false
            for (let j=0; j<this.isInputClocked.length && !inputFound; j++) {
                if (!this.isInputClocked[j]) {
                    inputFound = inputPinsInfo[j].name === clockedPins[i].name
                    this.isInputClocked[j] = inputFound
                }
            }
            if (!inputFound) {
                for (let j=0; j<this.isOutputClocked.length && !outputFound; j++) {
                    if (!this.isOutputClocked[j]) {
                        outputFound = outputPinsInfo[j].name === clockedPins[j].name
                        this.isOutputClocked[j] = outputFound
                    }
                }
            }
        }
    }

    // read '}' symbol
    parser.expectPeek(TokenType.RBRACE, "Missing '}'")
  }

  newInstance(): Gate {
    const inputNodes: Node[] = this.inputPinsInfo.map((_) => new Node())
    const outputNodes: Node[] = this.outputPinsInfo.map((_) => new Node())
    return new this.tsClassName(inputNodes, outputNodes, this)
  }
}

