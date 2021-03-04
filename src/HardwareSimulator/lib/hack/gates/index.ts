import { HDLTokenizer, TokenType } from "../../HDLTokenizer"
import { HDLParser } from "../../parser"
import builtins, { BuiltInGate, Gate, Node } from "./builtins"

export enum PinType {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT",
  INTERNAL = "INTERNAL",
  UNKNOWN = "UNKNOWN"
}

export enum ConnectionType {
  FROM_INPUT = "FROM_INPUT",
  TO_OUTPUT = "TO_OUTPUT",
  FROM_INTERNAL = "FROM_INTERNAL",
  TO_INTERNAL = "TO_INTERNAL",
  INVALID = "INVALID"
}

export abstract class GateClass {
  namesToTypes: { [_: string]: PinType }
  namesToNumbers: { [_: string]: number }

  name: string

  inputPinsInfo: PinInfo[]
  outputPinsInfo: PinInfo[]

  constructor(name: string, inputPinsInfo: PinInfo[], outputPinsInfo: PinInfo[]) {
    this.name = name
    this.namesToTypes = {}
    this.namesToNumbers = {}

    this.inputPinsInfo = inputPinsInfo
    this.registerPins(inputPinsInfo, PinType.INPUT)

    this.outputPinsInfo = outputPinsInfo
    this.registerPins(outputPinsInfo, PinType.OUTPUT)
  }

  abstract newInstance(): Gate

  getPinInfo(pinType: PinType, pinNumber: number): PinInfo | null {
    switch (pinType) {
      case PinType.INPUT:
        if (pinNumber < this.inputPinsInfo.length) {
          return this.inputPinsInfo[pinNumber]
        }
        break
      case PinType.OUTPUT:
        if (pinNumber < this.outputPinsInfo.length) {
          return this.outputPinsInfo[pinNumber]
        }
        break
    }
    return null
  }

  getPinType(pinName: string): PinType {
    return this.namesToTypes[pinName] ?? PinType.UNKNOWN
  }

  getPinNumber(pinName: string): number {
    return this.namesToNumbers[pinName] ?? -1
  }

  registerPins(pinInfos: PinInfo[], type: PinType) {
    pinInfos.forEach((pinInfo, i) => {
      this.registerPin(pinInfo, type, i)
    })
  }

  registerPin(pinInfo: PinInfo, type: PinType, pinNumber: number) {
    this.namesToTypes[pinInfo.name] = type
    this.namesToNumbers[pinInfo.name] = pinNumber
  }
}

export type PinInfo = {
  name: string
  width: number
}

export type Connection = {
  type: ConnectionType
  gatePinNumber: number
  partNumber: number
  partPinName: string
}

export class BuiltInGateClass extends GateClass {
  tsClassName: typeof BuiltInGate

  constructor(name: string, parser: HDLParser, inputPinsInfo: PinInfo[], outputPinsInfo: PinInfo[]) {
    super(name, inputPinsInfo, outputPinsInfo)
    // read typescript class name
    parser.expectPeek(TokenType.IDENTIFIER, "Missing typescript class name")
    // TODO: support more than NAND
    this.tsClassName = builtins.NAND.gate
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

export class CompositeGate extends Gate {
  parts: Gate[]
  internalPins: Node[]

  constructor(inputPins: Node[], outputPins: Node[], internalPins: Node[], gateClass: GateClass, parts: Gate[]) {
    super(inputPins, outputPins, gateClass)
    this.internalPins = internalPins
    this.parts = parts
  }

  reCompute() {
    for (let part of this.parts) {
      part.eval()
    }
  }

  getNode(name: string): Node | null {
    const result = super.getNode(name)
    if (!result) {
      const type = this.gateClass.getPinType(name)
      const index = this.gateClass.getPinNumber(name)
      if (type === PinType.INTERNAL) {
        return this.internalPins[index]
      }
    }
    return result
  }
}

export class CompositeGateClass extends GateClass {
  partsList: GateClass[]
  internalPinsInfo: PinInfo[]
  connections: Set<Connection>

  constructor(name: string, parser: HDLParser, inputPinsInfo: PinInfo[], outputPinsInfo: PinInfo[]) {
    super(name, inputPinsInfo, outputPinsInfo)
    this.partsList = []
    this.internalPinsInfo = []
    this.connections = new Set()

    this.readParts(parser)
  }

  newInstance(): Gate {
    const parts: Gate[] = this.partsList.map((partClass) => partClass.newInstance())

    const inputNodes = this.inputPinsInfo.map((_) => new Node())
    const outputNodes = this.outputPinsInfo.map((_) => new Node())
    const internalNodes = this.internalPinsInfo.map((_) => new Node())

    const internalConnections = new Set<Connection>()

    // First scan
    let partNode: Node | null = null
    for (const connection of this.connections) {
      partNode = parts[connection.partNumber].getNode(connection.partPinName)
      if (!partNode) { continue }

      switch (connection.type) {
        case ConnectionType.FROM_INPUT:
          this.connectGateToPart(inputNodes[connection.gatePinNumber], partNode)
          break
        case ConnectionType.TO_OUTPUT:
          this.connectGateToPart(partNode, outputNodes[connection.gatePinNumber])
          break
        case ConnectionType.TO_INTERNAL:
          const target = new Node()
          partNode.connect(target)
          internalNodes[connection.gatePinNumber] = target
          break
        case ConnectionType.FROM_INTERNAL:
          internalConnections.add(connection)
          break
      }
    }

    // Second scan
    for (const connection of internalConnections) {
      partNode = parts[connection.partNumber].getNode(connection.partPinName)
      if (!partNode) { continue }
      switch (connection.type) {
        case ConnectionType.FROM_INTERNAL:
          const source = internalNodes[connection.gatePinNumber]
          source.connect(partNode)
          break
      }
    }

    return new CompositeGate(inputNodes, outputNodes, internalNodes, this, parts)
  }

  connectGateToPart(part: Node, gate: Node) {
    part.connect(gate)
  }

  readParts(parser: HDLParser) {
    let endOfParts = false
    while (parser.hasMoreTokens() && !endOfParts) {
      // check if end of hdl
      if (parser.peekTokenIs(TokenType.RBRACE)) {
        // read }
        parser.advance()
        endOfParts = true
      } else {
        // read partName
        parser.expectPeek(TokenType.IDENTIFIER, "A GateClass name is expected")
        const partName = parser.token.literal ?? ''
        // make part
        const gateClass = getGateClassBuiltIn(partName)
        const partNumber = this.partsList.length
        this.partsList.push(gateClass)
        // read (
        parser.expectPeek(TokenType.LPAREN, "Missing '('")
        // read pins
        this.readPinNames(parser, partName, partNumber)
        // read ;
        parser.expectPeek(TokenType.SEMICOLON, "Missing ';'")
      }
    }
    if (!endOfParts) parser.fail("Missing '}'")
    // read EOF
    parser.expectPeek(TokenType.EOF, "Expected EOF after '}'")
  }

  readPinNames(parser: HDLParser, partName: string, partNumber: number): void | never {
    let endOfPins = false
    // read pin names
    while (parser.hasMoreTokens() && !endOfPins) {
      // read left pin name
      parser.expectPeek(TokenType.IDENTIFIER, "A pin name is expected")
      const leftName = parser.token.literal ?? ""
      // read =
      parser.expectPeek(TokenType.EQUAL, "Missing '='")
      // read right pin name
      parser.expectPeek(TokenType.IDENTIFIER, "A pin name is expected")
      const rightName = parser.token.literal ?? ""
      // make connection
      this.addConnection(parser, partName, partNumber, leftName, rightName)
      // read , or )
      if (parser.peekTokenIs(TokenType.RPAREN)) {
        endOfPins = true
      } else if (!parser.peekTokenIs(TokenType.COMMA)) {
        parser.fail("Missing ',' or ')'")
      }
      parser.advance()
    }

    if (!endOfPins) parser.fail("Unexpected EOF")
  }

  addConnection(parser: HDLParser, partName: string, partNumber: number, leftName: string, rightName: string): void | never {
    const partGateClass = this.partsList[partNumber]

    const leftType = partGateClass.getPinType(leftName)
    if (leftType === PinType.UNKNOWN) {
      parser.fail(`${leftName} is not a pin in ${partName}`)
    }

    let rightType = this.getPinType(rightName)
    let rightNumber: number
    let rightPinInfo: PinInfo

    if (rightType === PinType.UNKNOWN) {
      rightType = PinType.INTERNAL
      rightPinInfo = { name: rightName, width: 1 }
      rightNumber = this.internalPinsInfo.length
      this.internalPinsInfo.push(rightPinInfo)
      this.registerPin(rightPinInfo, PinType.INTERNAL, rightNumber)
    } else {
      rightNumber = this.getPinNumber(rightName)
    }

    let connectionType: ConnectionType = ConnectionType.INVALID
    switch (leftType) {
      case PinType.INPUT:
        switch (rightType) {
          case PinType.INPUT:
            connectionType = ConnectionType.FROM_INPUT
            break
          case PinType.INTERNAL:
            connectionType = ConnectionType.FROM_INTERNAL
            break
          case PinType.OUTPUT:
            parser.fail("Can't connect gate's output pin to part")
        }
        break
      case PinType.OUTPUT:
        switch (rightType) {
          case PinType.OUTPUT:
            connectionType = ConnectionType.TO_OUTPUT
            break
          case PinType.INTERNAL:
            connectionType = ConnectionType.TO_INTERNAL
            break
          case PinType.INPUT:
            parser.fail("Can't connect part's output pin to gate's input pin")
        }
        break
    }

    this.connections.add({ type: connectionType, gatePinNumber: rightNumber, partPinName: leftName, partNumber })
  }
}

export function getGateClassHDL(hdl: string): GateClass | never {
  const tokenizer = new HDLTokenizer(hdl)
  const parser = new HDLParser(tokenizer)
  return readHDL(parser)
}

export function getGateClassBuiltIn(name: string): GateClass | never {
  // TODO: support more than Nand
  if (name !== "Nand") HDLTokenizer.fail(`Unknown part type ${name}`)

  return getGateClassHDL(builtins.NAND.hdl)
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
  const inputPinsInfo = parser.peekTokenIs(TokenType.IN) ? getPinsInfo(parser) : []
  // read OUT keyword
  const outputPinsInfo = parser.peekTokenIs(TokenType.OUT) ? getPinsInfo(parser) : []

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

export function getPinsInfo(parser: HDLParser): PinInfo[] {
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
      // TODO: allow for [16] bus syntax
      const pinWidth = 1
      pinInfos.push({ name: pinName, width: pinWidth })
      // check separator
      parser.expectPeekOneOf([TokenType.COMMA, TokenType.SEMICOLON], "Missing ',' or ';'")
    }
  }

  if (!exit) parser.fail("Unexpected EOF")

  return pinInfos
}
