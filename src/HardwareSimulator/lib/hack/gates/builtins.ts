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
    And: {
      hdl: `CHIP And { IN  a, b; OUT out; BUILTIN And; } `,
      gate: And
    },
    Or: {
      hdl: `CHIP Or { IN  a, b; OUT out; BUILTIN Or; }`,
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
    DMux: {
      hdl: `CHIP DMux { IN  in, sel; OUT a, b; BUILTIN DMux; }`,
      gate: DMux
    },
    DMux4Way: {
      hdl: `CHIP DMux4Way { IN  in, sel[2]; OUT a, b, c, d; BUILTIN DMux4Way; }`,
      gate: DMux4Way
    }
}

export class BuiltInGateClass extends GateClass {
  tsClassName: typeof BuiltInGate

  constructor(name: string, parser: HDLParser, inputPinsInfo: PinInfo[], outputPinsInfo: PinInfo[]) {
    super(name, inputPinsInfo, outputPinsInfo)
    // read typescript class name
    parser.expectPeek(TokenType.IDENTIFIER, "Missing typescript class name")
    // TODO: support more than NAND
    switch (name) {
      case "Nand": this.tsClassName = builtins.Nand.gate; break
      case "Not": this.tsClassName = builtins.Not.gate; break
      case "And": this.tsClassName = builtins.And.gate; break
      case "Or": this.tsClassName = builtins.Or.gate; break
      case "Xor": this.tsClassName = builtins.Xor.gate; break
      case "Mux": this.tsClassName = builtins.Mux.gate; break
      case "Mux16": this.tsClassName = builtins.Mux16.gate; break
      case "DMux": this.tsClassName = builtins.DMux.gate; break
      case "DMux4Way": this.tsClassName = builtins.DMux4Way.gate; break
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

