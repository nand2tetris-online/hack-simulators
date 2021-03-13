import { readPinsInfo } from "."
import { HDLParser } from "../hdl/parser"
import { TokenType } from "../hdl/tokenizer"
import { BuiltInGate } from "./builtin-gate"
import { builtins } from "./builtins"
import { Gate } from "./gate"
import { GateClass, PinInfo } from "./gateclass"
import { Node } from "./node"

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
