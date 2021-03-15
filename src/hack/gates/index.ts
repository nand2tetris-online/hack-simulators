import { HDLParser } from "../hdl/parser";
import { HDLTokenizer, TokenType } from "../hdl/tokenizer";
import { BuiltInGateClass } from "./builtin-gateclass";
import { builtins } from "./builtins";
import { CompositeGateClass, UserWorkspace } from "./composite-gateclass";
import { GateClass, PinInfo } from "./gateclass";

export function getGateClass(name: string, userDefinedParts: UserWorkspace): GateClass | never {
  const hdlFileName = `${name}.hdl`
  if (userDefinedParts.has(hdlFileName)) {
    const hdl = userDefinedParts.get(hdlFileName) ?? ""
    return getGateClassHDL(hdl, userDefinedParts)
  } else {
    return getGateClassBuiltIn(name, userDefinedParts)
  }
}

export function getGateClassHDL(hdl: string, userDefinedParts: UserWorkspace): GateClass | never {
    const tokenizer = new HDLTokenizer(hdl)
    const parser = new HDLParser(tokenizer)
    return readHDL(parser, userDefinedParts)
}

export function getGateClassBuiltIn(name: string, userDefinedParts: UserWorkspace): GateClass | never {
    let hdl: string
    switch (name) {
        // CH1
        case "Nand": hdl = builtins.Nand.hdl; break
        case "Not": hdl = builtins.Not.hdl; break
        case "Not16": hdl = builtins.Not16.hdl; break
        case "And": hdl = builtins.And.hdl; break
        case "And16": hdl = builtins.And16.hdl; break
        case "Or": hdl = builtins.Or.hdl; break
        case "Or16": hdl = builtins.Or16.hdl; break
        case "Xor": hdl = builtins.Xor.hdl; break
        case "Mux": hdl = builtins.Mux.hdl; break
        case "Mux16": hdl = builtins.Mux16.hdl; break
        case "Mux4Way16": hdl = builtins.Mux4Way16.hdl; break
        case "Mux8Way16": hdl = builtins.Mux8Way16.hdl; break
        case "DMux": hdl = builtins.DMux.hdl; break
        case "DMux4Way": hdl = builtins.DMux4Way.hdl; break
        case "DMux8Way": hdl = builtins.DMux8Way.hdl; break
        case "Or8Way": hdl = builtins.Or8Way.hdl; break
        // CH2
        case "HalfAdder": hdl = builtins.HalfAdder.hdl; break
        case "FullAdder": hdl = builtins.FullAdder.hdl; break
        case "Add16": hdl = builtins.Add16.hdl; break
        case "Inc16": hdl = builtins.Inc16.hdl; break
        case "ALU": hdl = builtins.ALU.hdl; break
        // CH3
        case "DFF": hdl = builtins.DFF.hdl; break
        case "Bit": hdl = builtins.Bit.hdl; break
        case "Register": hdl = builtins.Register.hdl; break
        case "PC": hdl = builtins.PC.hdl; break
        case "RAM8": hdl = builtins.RAM8.hdl; break
        case "RAM64": hdl = builtins.RAM64.hdl; break
        case "RAM512": hdl = builtins.RAM512.hdl; break
        case "RAM4K": hdl = builtins.RAM4K.hdl; break
        case "RAM16K": hdl = builtins.RAM16K.hdl; break
        // CH5
        case "Screen": hdl = builtins.Screen.hdl; break
        case "Keyboard": hdl = builtins.Keyboard.hdl; break
        case "ROM32K": hdl = builtins.ROM32K.hdl; break
        default: HDLParser.fail(`Invalid builtin gate class name: ${name}`)
    }
    return getGateClassHDL(hdl, userDefinedParts)
}

export function readHDL(parser: HDLParser, userDefinedParts: UserWorkspace): GateClass | never {
  // read CHIP keyword
  parser.expectCurrent(TokenType.CHIP, `Missing 'CHIP' keyword`)
  // read gate name
  parser.expectPeek(TokenType.IDENTIFIER, "Missing chip name")
  const gateName = parser.token.literal ?? ""
  // read {
  parser.expectPeek(TokenType.LBRACE, "Missing '{'")
  // read IN keyword
  const inputPinsInfo = parser.peekTokenIs(TokenType.IN) ? readPinsInfo(parser) : []
  // read OUT keyword
  const outputPinsInfo = parser.peekTokenIs(TokenType.OUT) ? readPinsInfo(parser) : []

  // read BUILTIN or PARTS
  parser.advance()
  if (parser.tokenIs(TokenType.BUILTIN)) {
    return new BuiltInGateClass(gateName, parser, inputPinsInfo, outputPinsInfo)
  } else if (parser.tokenIs(TokenType.PARTS)) {
    // read :
    parser.expectPeek(TokenType.COLON, "Missing ':'")
    return new CompositeGateClass(gateName, parser, inputPinsInfo, outputPinsInfo, userDefinedParts)
  } else {
    return parser.fail("'PARTS' or 'BUILTIN' keyword expected")
  }
}

export function readPinsInfo(parser: HDLParser): PinInfo[] {
  let pinInfos: PinInfo[] = []
  let exit = false

  parser.advance()
  while (parser.hasMoreTokens() && !exit) {
    // check ';' symbol
    if (parser.tokenIs(TokenType.SEMICOLON)) {
      exit = true
    } else {
      // read pin name
      parser.expectPeek(TokenType.IDENTIFIER, `Missing pin name, found ${parser.peek.literal}`)
      const pinName = parser.token.literal ?? ""
      // read width or separator
      let pinWidth = 1
      if (parser.peekTokenIs(TokenType.LBRACKET)) {
        // read [
        parser.advance()
        // read width
        parser.expectPeek(TokenType.INT, "Missing width")
        pinWidth = parseInt(parser.token.literal ?? "")
        // read ]
        parser.expectPeek(TokenType.RBRACKET, "Missing ']'")
      }

      pinInfos.push({ name: pinName, width: pinWidth })
      // check separator
      parser.expectPeekOneOf([TokenType.COMMA, TokenType.SEMICOLON], "Missing ',' or ';'")
    }
  }

  if (!exit) parser.fail("Unexpected EOF")

  return pinInfos
}


