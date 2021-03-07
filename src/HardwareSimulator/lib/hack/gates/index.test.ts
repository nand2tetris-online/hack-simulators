import { HDLTokenizer } from "../../HDLTokenizer"
import { HDLParser } from "../../parser"
import { readHDL } from "./hdl"
import { Node, SubBusListeningAdapter, SubNode, toBinaryString } from "./nodes"

describe("Node", () => {
    it("does it", () => {
        const node = new Node()
        expect(toBinaryString(node))
            .toEqual("0000000000000000")

        node.set(5)
        expect(toBinaryString(node))
            .toEqual("0000000000000101")

        node.set(-1)
        expect(toBinaryString(node))
            .toEqual("1111111111111111")
    })
})

describe("SubNode", () => {
    it("does it", () => {
        const node = new SubNode([7, 11])
        const subBus = new SubBusListeningAdapter(node, [7, 11])

        subBus.set(5)

        expect(toBinaryString(node))
            .toEqual("0000000000000101")

        subBus.set(0)

        expect(toBinaryString(node))
            .toEqual("0000000000000000")
    })
})

describe("SubBusListeningAdapter", () => {
    it("does one", () => {
        const node = new Node()
        const subBus = new SubBusListeningAdapter(node, [0, 0])

        subBus.set(1)

        expect(toBinaryString(node))
            .toEqual("0000000000000001")
    })

    it("does multiple", () => {
        const node = new Node()
        const subBus = new SubBusListeningAdapter(node, [7, 11])

        subBus.set(5)

        expect(toBinaryString(node))
            .toEqual("0000001010000000")
    })

    it("does multiple of each well for 16 bits", () => {
        const node = new Node()

        const sub1 = new SubBusListeningAdapter(node, [0, 0])
        const sub2 = new SubBusListeningAdapter(node, [1, 5])
        const sub3 = new SubBusListeningAdapter(node, [6, 12])
        const sub4 = new SubBusListeningAdapter(node, [13, 15])

        sub1.set(1)
        expect(toBinaryString(node))
            .toEqual("0000000000000001")

        sub2.set(31)
        expect(toBinaryString(node))
            .toEqual("0000000000111111")

        sub3.set(127)
        expect(toBinaryString(node))
            .toEqual("0001111111111111")

        sub4.set(7)
        expect(toBinaryString(node))
            .toEqual("1111111111111111")
    })
})

describe("Not16", () => {
    it("works", () => {
        const not16 = `
// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/01/Not16.hdl

/**
 * 16-bit Not:
 * for i=0..15: out[i] = not in[i]
 */

CHIP Not1 {
    IN in[3];
    OUT out[3];

    PARTS:
    Not(in=in[0], out=out[0]);
    Not(in=in[1], out=out[1]);
    Not(in=in[2], out=out[2]);
}`
        const parser = new HDLParser(new HDLTokenizer(not16))
        const gateClass = readHDL(parser)
        const gate = gateClass.newInstance()

        expect(gate).not.toBeNull()

        expect(gate.inputPins).toHaveLength(1)
        expect(gate.outputPins).toHaveLength(1)

        gate.inputPins[0].set(0)
        expect(gate.inputPins[0].get()).toEqual(0)
        gate.eval()
        expect(gate.outputPins[0].get()).toEqual(7)

        gate.inputPins[0].set(7)
        expect(gate.inputPins[0].get()).toEqual(7)
        gate.eval()
        expect(gate.outputPins[0].get()).toEqual(0)
    })
})

describe("Multi Bit Wide Internal Pins", () => {
    it("works", () => {
        const not16 = `CHIP ALU { IN  in[16]; OUT out[16]; PARTS: Not16(in=in, out=fout); Not16(in=fout, out=out); }`
        const parser = new HDLParser(new HDLTokenizer(not16))
        const gateClass = readHDL(parser)
        const gate = gateClass.newInstance()

        expect(gate).not.toBeNull()

        gate.inputPins[0].set(5)

        gate.eval()

        expect(gate.outputPins[0].get()).toEqual(0b0000000000000101)
    })
})
