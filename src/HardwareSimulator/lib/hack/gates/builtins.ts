import { TokenType } from "../../HDLTokenizer"
import { HDLParser } from "../../parser"
import { Gate, GateClass, PinInfo } from "."
import { Node } from "./nodes"

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
    DMux: {
      hdl: `CHIP DMux { IN  in, sel; OUT a, b; BUILTIN DMux; }`,
      gate: DMux
    },
    DMux4Way: {
      hdl: `CHIP DMux4Way { IN  in, sel[2]; OUT a, b, c, d; BUILTIN DMux4Way; }`,
      gate: DMux4Way
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
      case "DMux": this.tsClassName = builtins.DMux.gate; break
      case "DMux4Way": this.tsClassName = builtins.DMux4Way.gate; break
      case "Or8Way": this.tsClassName = builtins.Or8Way.gate; break
      // CH2
      case "HalfAdder": this.tsClassName = builtins.HalfAdder.gate; break
      case "FullAdder": this.tsClassName = builtins.FullAdder.gate; break
      case "Add16": this.tsClassName = builtins.Add16.gate; break
      case "Inc16": this.tsClassName = builtins.Inc16.gate; break
      default: parser.fail(`Unexpected gate class name ${name}`)
    }
    // read ';' symbol
    parser.expectPeek(TokenType.SEMICOLON, "Missing ';'")
    // read ';' symbol
    parser.expectPeek(TokenType.RBRACE, "Missing '}'")
  }

  newInstance(): Gate {
    const inputNodes: Node[] = this.inputPinsInfo.map((_) => new Node())
    const outputNodes: Node[] = this.outputPinsInfo.map((_) => new Node())
    return new this.tsClassName(inputNodes, outputNodes, this)
  }
}

