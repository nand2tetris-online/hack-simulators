import { HDLTokenizer, TokenType } from "../../HDLTokenizer"
import { HDLParser } from "../../parser"
import { builtins, BuiltInGateClass } from "./builtins"
import { CompositeGateClass } from "./composite"
import { GateClass, PinInfo } from "."

export function getGateClassHDL(hdl: string): GateClass | never {
    const tokenizer = new HDLTokenizer(hdl)
    const parser = new HDLParser(tokenizer)
    return readHDL(parser)
}

export function getGateClassBuiltIn(name: string): GateClass | never {
    let hdl: string
    switch (name) {
        case "Nand": hdl = builtins.Nand.hdl; break
        case "Not": hdl = builtins.Not.hdl; break
        default: HDLParser.fail(`Invalid builtin gate class name: ${name}`)
    }
    return getGateClassHDL(hdl)
}

export function readHDL(parser: HDLParser): GateClass | never {
  // read CHIP keyword
  parser.expectCurrent(TokenType.CHIP, "Missing 'CHIP' keyword")
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
    return new CompositeGateClass(gateName, parser, inputPinsInfo, outputPinsInfo)
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
      parser.expectPeek(TokenType.IDENTIFIER, "Missing pin name")
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

