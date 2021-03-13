import { BuiltInGate } from "../builtin-gate"
import { GateClass } from "../gateclass"
import { Node } from "../node"

import logic from "./logic"
import arithmetic from "./arithmetic"
import memory from "./memory"
import computer from "./computer"

export class Nand extends BuiltInGate {
    reCompute() {
        const a = this.inputPins[0].get()
        const b = this.inputPins[1].get()
        this.outputPins[0].set(0x1 - (a & b))
    }
}

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

export type BuiltInDef = { hdl: string, gate: typeof BuiltInGate }
export type BuiltIns = { [_: string]: BuiltInDef }

export const builtins: BuiltIns = {
    // GIVEN
    Nand: {
        hdl: `CHIP Nand { IN  a, b; OUT out; BUILTIN Nand; }`,
        gate: Nand
    },
    DFF: {
        hdl: `CHIP DFF { IN  in; OUT out; BUILTIN DFF; CLOCKED in; }`,
        gate: DFF
    },
    // LOGIC
    Not: {
        hdl: `CHIP Not { IN  in; OUT out; BUILTIN Not; } `,
        gate: logic.Not   
    },
    Not16: {
      hdl: `CHIP Not16 { IN  in[16]; OUT out[16]; BUILTIN Not16; }`,
      gate: logic.Not16
    },
    And: {
      hdl: `CHIP And { IN  a, b; OUT out; BUILTIN And; } `,
      gate: logic.And
    },
    And16: {
      hdl: `CHIP And16 { IN  a[16], b[16]; OUT out[16]; BUILTIN And; }`,
      gate: logic.And
    },
    Or: {
      hdl: `CHIP Or { IN  a, b; OUT out; BUILTIN Or; }`,
      gate: logic.Or
    },
    Or16: {
      hdl: `CHIP Or16 { IN  a[16], b[16]; OUT out[16]; BUILTIN Or; }`,
      gate: logic.Or
    },
    Xor: {
      hdl: `CHIP Xor { IN  a, b; OUT out; BUILTIN Xor; }`,
      gate: logic.Xor
    },
    Mux: {
      hdl: `CHIP Mux { IN  a, b, sel; OUT out; BUILTIN Mux;}`,
      gate: logic.Mux
    },
    Mux16: {
      hdl: `CHIP Mux16 { IN  a[16], b[16], sel; OUT out[16]; BUILTIN Mux; }`,
      gate: logic.Mux
    },
    Mux4Way16: {
      hdl: ` CHIP Mux4Way16 { IN a[16], b[16], c[16], d[16], sel[2]; OUT out[16]; BUILTIN Mux4Way16; }`,
      gate: logic.Mux4Way16
    },
    Mux8Way16: {
      hdl: `CHIP Mux8Way16 { IN  a[16], b[16], c[16], d[16], e[16], f[16], g[16], h[16], sel[3]; OUT out[16]; BUILTIN Mux8Way16; }`,
      gate: logic.Mux8Way16
    },
    DMux: {
      hdl: `CHIP DMux { IN  in, sel; OUT a, b; BUILTIN DMux; }`,
      gate: logic.DMux
    },
    DMux4Way: {
      hdl: `CHIP DMux4Way { IN  in, sel[2]; OUT a, b, c, d; BUILTIN DMux4Way; }`,
      gate: logic.DMux4Way
    },
    DMux8Way: {
      hdl: `CHIP DMux8Way { IN  in, sel[3]; OUT a, b, c, d, e, f, g, h; BUILTIN DMux8Way; }`,
      gate: logic.DMux8Way
    },
    Or8Way: {
      hdl: `CHIP Or8Way { IN  in[8]; OUT out; BUILTIN Or8Way; }`,
      gate: logic.Or8Way
    },
    //
    // ARITHMETIC
    //
    HalfAdder: {
      hdl: `CHIP HalfAdder { IN  a, b; OUT sum, carry; BUILTIN HalfAdder; }`,
      gate: arithmetic.HalfAdder
    },
    FullAdder: {
      hdl: `CHIP FullAdder { IN  a, b, c; OUT sum, carry; BUILTIN FullAdder; }`,
      gate: arithmetic.FullAdder
    },
    Add16: {
      hdl: `CHIP Add16 { IN  a[16], b[16]; OUT out[16]; BUILTIN Add16; }`,
      gate: arithmetic.Add16
    },
    Inc16: {
      hdl: `CHIP Inc16 { IN  in[16]; OUT out[16]; BUILTIN Inc16; }`,
      gate: arithmetic.Inc16
    },
    ALU: {
      hdl: `CHIP ALU { IN x[16], y[16], zx, nx, zy, ny, f, no; OUT out[16], zr, ng; BUILTIN ALU; }`,
      gate: arithmetic.ALU
    },
    //
    // MEMORY
    //
    Bit: {
        hdl: `CHIP Bit { IN  in, load; OUT out; BUILTIN Bit; CLOCKED in, load; }`,
        gate: memory.Bit
    },
    Register: {
        hdl: `CHIP Register { IN  in[16], load; OUT out[16]; BUILTIN Register; CLOCKED in, load; }`,
        gate: memory.Register
    },
    PC: {
        hdl: `CHIP PC { IN  in[16], load, inc, reset; OUT out[16]; BUILTIN PC; CLOCKED in, load, inc, reset; }`,
        gate: memory.PC
    },
    RAM8: {
        hdl: `CHIP RAM8 { IN  in[16], load, address[3]; OUT out[16]; BUILTIN RAM8; CLOCKED in, load; }`,
        gate: memory.RAM8
    },
    RAM64: {
        hdl: `CHIP RAM64 { IN in[16], load, address[6]; OUT out[16]; BUILTIN RAM64; CLOCKED in, load; }`,
        gate: memory.RAM64
    },
    RAM512: {
        hdl: `CHIP RAM512 { IN  in[16], load, address[9]; OUT out[16]; BUILTIN RAM512; CLOCKED in, load; }`,
        gate: memory.RAM512
    },
    RAM4K: {
        hdl: `CHIP RAM4K { IN  in[16], load, address[12]; OUT out[16]; BUILTIN RAM4K; CLOCKED in, load; }`,
        gate: memory.RAM4K
    },
    RAM16K: {
        hdl: `CHIP RAM16K { IN  in[16], load, address[14]; OUT out[16]; BUILTIN RAM16K; CLOCKED in, load; }`,
        gate: memory.RAM16K
    },
    //
    // COMPUTER
    //
    Screen: {
        hdl: `CHIP Screen { IN in[16], load, address[13]; OUT out[16]; BUILTIN Screen; CLOCKED in, load; }`,
        gate: computer.Screen
    },
    Keyboard: {
        hdl: `CHIP Keyboard { OUT out[16]; BUILTIN Keyboard; }`,
        gate: computer.Keyboard
    },
    ROM32K: {
        hdl: `CHIP ROM32K { IN  address[15]; OUT out[16]; BUILTIN ROM32K; }`,
        gate: computer.ROM32K
    },
}

