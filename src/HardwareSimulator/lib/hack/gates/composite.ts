import { Gate, Connection, ConnectionType, GateClass, PinInfo, PinType } from "."
import { TokenType } from "../../HDLTokenizer"
import { HDLParser } from "../../parser"
import { getGateClassBuiltIn } from "./hdl"
import { Node, SubBus, SubBusListeningAdapter, SubNode } from "./nodes"

export class CompositeGate extends Gate {
  parts: Gate[]
  internalPins: Node[]

  constructor(inputPins: Node[], outputPins: Node[], internalPins: Node[], gateClass: GateClass, parts: Gate[]) {
    super(inputPins, outputPins, gateClass)
    this.internalPins = internalPins
    this.parts = parts
  }

  reCompute() {
    for (let part of this.parts) part.eval()
  }

  getNode(name: string): Node | null {
    const result = super.getNode(name)
    if (!result) {
      const type = this.gateClass.getPinType(name)
      const index = this.gateClass.getPinNumber(name)
      if (type === PinType.INTERNAL) return this.internalPins[index]
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
    let gateSubBus: SubBus | null = null
    let partSubBus: SubBus | null = null
    for (const connection of this.connections) {
      partNode = parts[connection.partNumber].getNode(connection.partPinName)
      if (!partNode) continue
      gateSubBus = connection.gateSubBus
      partSubBus = connection.partSubBus

      switch (connection.type) {
        case ConnectionType.FROM_INPUT:
          this.connectGateToPart(inputNodes[connection.gatePinNumber], gateSubBus, partNode, partSubBus)
          break
        case ConnectionType.TO_OUTPUT:
          this.connectGateToPart(partNode, partSubBus, outputNodes[connection.gatePinNumber], gateSubBus)
          break
        case ConnectionType.TO_INTERNAL:
          const target = !partSubBus ? new Node() : new SubNode(partSubBus)
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
      if (!partNode) continue
      partSubBus = connection.partSubBus

      switch (connection.type) {
        case ConnectionType.FROM_INTERNAL:
          const source = internalNodes[connection.gatePinNumber]
          if (!partSubBus) {
            source.connect(partNode)
          } else {
            const node = new SubBusListeningAdapter(partNode, partSubBus)
            source.connect(node)
          }
          break
      }
    }

    return new CompositeGate(inputNodes, outputNodes, internalNodes, this, parts)
  }

  connectGateToPart(sourceNode: Node, sourceSubBus: SubBus | null, targetNode: Node, targetSubBus: SubBus | null) {
    let target = targetNode
    if (targetSubBus) {
      target = new SubBusListeningAdapter(target, targetSubBus)
    }
    if (!sourceSubBus) {
      sourceNode.connect(target)
    } else {
      const subNode = new SubNode(sourceSubBus)
      sourceNode.connect(subNode)
      subNode.connect(target)
    }
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

      let rightSubBus: SubBus | null = null
      if (parser.peekTokenIs(TokenType.LBRACKET)) {
        // read [
        parser.advance()
        parser.expectPeek(TokenType.INT, "Missing bus")
        const subBus = parseInt(parser.token.literal ?? "")
        rightSubBus = [subBus, subBus]
        // read ]
        parser.expectPeek(TokenType.RBRACKET, "Missing ']'")
      }

      // make connection
      this.addConnection(parser, partName, partNumber, leftName, rightName, rightSubBus)

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

  addConnection(parser: HDLParser, partName: string, partNumber: number, leftName: string, rightName: string, rightSubBus: SubBus | null): void | never {
    const partGateClass = this.partsList[partNumber]

    const leftType = partGateClass.getPinType(leftName)
    if (leftType === PinType.UNKNOWN) parser.fail(`${leftName} is not a pin in ${partName}`)

    let rightType = this.getPinType(rightName)
    let rightNumber: number
    let rightPinInfo: PinInfo | null

    if (rightType === PinType.UNKNOWN) {
      rightType = PinType.INTERNAL
      rightPinInfo = { name: rightName, width: 1 }
      rightNumber = this.internalPinsInfo.length
      this.internalPinsInfo.push(rightPinInfo)
      this.registerPin(rightPinInfo, PinType.INTERNAL, rightNumber)
    } else {
      rightNumber = this.getPinNumber(rightName)
      rightPinInfo = this.getPinInfo(rightType, rightNumber)
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

    this.connections.add({
      type: connectionType,
      gatePinNumber: rightNumber,
      partNumber,
      partPinName: leftName,
      gateSubBus: rightSubBus,
      partSubBus: null
    })
  }
}
