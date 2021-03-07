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

    const inputNodes = this.inputPinsInfo.map((i) => new Node(i.name))
    const outputNodes = this.outputPinsInfo.map((i) => new Node(i.name))
    const internalNodes = this.internalPinsInfo.map((i) => new Node(i.name))

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
          const name = this.internalPinsInfo[connection.gatePinNumber].name
          const target = partSubBus === null ? new Node(name) : new SubNode(partSubBus)
          partNode.connect(target)
          internalNodes[connection.gatePinNumber] = target
          break
        case ConnectionType.FROM_INTERNAL:
        case ConnectionType.FROM_TRUE:
        case ConnectionType.FROM_FALSE:
          internalConnections.add(connection)
          break
      }
    }

    // Second scan
    let subNode: SubNode
    for (const connection of internalConnections) {
      partNode = parts[connection.partNumber].getNode(connection.partPinName)
      if (!partNode) continue
      gateSubBus = connection.gateSubBus
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
        case ConnectionType.FROM_TRUE:
          if (!gateSubBus) throw new Error("gateSubBus is null")
          subNode = new SubNode(gateSubBus)
          subNode.set(1)
          if (!partSubBus) {
            partNode.set(subNode.get())
          } else {
            const node = new SubBusListeningAdapter(partNode, partSubBus)
            node.set(subNode.get())
          }
          break
        case ConnectionType.FROM_FALSE:
          if (!gateSubBus) throw new Error("gateSubBus is null")
          subNode = new SubNode(gateSubBus)
          subNode.set(0)
          if (!partSubBus) {
            partNode.set(subNode.get())
          } else {
            const node = new SubBusListeningAdapter(partNode, partSubBus)
            node.set(subNode.get())
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

  readSubBus(parser: HDLParser): SubBus {
    // read low
    parser.expectPeek(TokenType.INT, "Missing bus")
    const low = parseInt(parser.token.literal ?? "")
    let high = low
    if (parser.peekTokenIs(TokenType.DOT)) {
      // read .
      parser.advance()
      // read .
      parser.expectPeek(TokenType.DOT, "Expected '..'")
      // read high
      parser.expectPeek(TokenType.INT, "Expected high sub bus")
      high = parseInt(parser.token.literal ?? "")
    }
    return [low, high]
  }

  readPinNames(parser: HDLParser, partName: string, partNumber: number): void | never {
    let endOfPins = false
    // read pin names
    while (parser.hasMoreTokens() && !endOfPins) {
      // read left pin name
      parser.expectPeek(TokenType.IDENTIFIER, "A pin name is expected")
      const leftName = parser.token.literal ?? ""
      // read left sub bus
      let leftSubBus: SubBus | null = null
      if (parser.peekTokenIs(TokenType.LBRACKET)) {
        // read [
        parser.advance()
        leftSubBus = this.readSubBus(parser)
        // read ]
        parser.expectPeek(TokenType.RBRACKET, "Missing ']'")
      }

      // read =
      parser.expectPeek(TokenType.EQUAL, "Missing '='")
      // read right pin name
      const rightPinPossibilities = [TokenType.IDENTIFIER, TokenType.TRUE, TokenType.FALSE]
      parser.expectPeekOneOf(rightPinPossibilities, "A pin name, true, or false is expected")
      const rightName = parser.token.literal ?? ""
      // read right sub bus
      let rightSubBus: SubBus | null = null
      if (parser.peekTokenIs(TokenType.LBRACKET)) {
        // read [
        parser.advance()
        rightSubBus = this.readSubBus(parser)
        // read ]
        parser.expectPeek(TokenType.RBRACKET, "Missing ']'")
      }

      // make connection
      this.addConnection(parser, partName, partNumber, leftName, rightName, rightSubBus, leftSubBus)

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

  getPinInfo(type: PinType, number: number): PinInfo | null {
    if (type === PinType.INTERNAL && number < this.internalPinsInfo.length) {
      return this.internalPinsInfo[number]
    } else {
      return super.getPinInfo(type, number)
    }
  }

  addConnection(parser: HDLParser, partName: string, partNumber: number, leftName: string, rightName: string, rightSubBus: SubBus | null, leftSubBus: SubBus | null): void | never {
    const partGateClass = this.partsList[partNumber]

    const leftType = partGateClass.getPinType(leftName)
    if (leftType === PinType.UNKNOWN) parser.fail(`${leftName} is not a pin in ${partName}`)
    const leftNumber = partGateClass.getPinNumber(leftName)
    const leftPinInfo = partGateClass.getPinInfo(leftType, leftNumber)
    const leftWidth = (leftSubBus ? leftSubBus[1] - leftSubBus[0] + 1 : leftPinInfo?.width) ?? 0

    let rightType = PinType.UNKNOWN
    let rightNumber: number = 0
    let rightPinInfo: PinInfo | null

    let selfFittingWidth = false

    let connectionType: ConnectionType = ConnectionType.INVALID

    if (rightName === TokenType.TRUE) {
      rightPinInfo = { name: rightName, width: 16 }
      connectionType = ConnectionType.FROM_TRUE
      selfFittingWidth = true
    } else if (rightName === TokenType.FALSE) {
      rightPinInfo = { name: rightName, width: 16 }
      connectionType = ConnectionType.FROM_TRUE
      selfFittingWidth = true
    } else {
      rightType = this.getPinType(rightName)
      if (rightType === PinType.UNKNOWN) {
        rightType = PinType.INTERNAL
        rightPinInfo = { name: rightName, width: leftWidth }
        rightNumber = this.internalPinsInfo.length
        this.internalPinsInfo.push(rightPinInfo)
        this.registerPin(rightPinInfo, PinType.INTERNAL, rightNumber)
      } else {
        rightNumber = this.getPinNumber(rightName)
        rightPinInfo = this.getPinInfo(rightType, rightNumber)
      }
    }

    let rightWidth = (rightSubBus ? rightSubBus[1] - rightSubBus[0] + 1 : rightPinInfo?.width) ?? 1
    if (selfFittingWidth) {
      rightWidth = leftWidth
      rightSubBus = [0, rightWidth-1]
    }

    // check that leftWidth and rightWidth are the same
    if (leftWidth !== rightWidth)
      parser.fail(`${leftName}(${leftWidth}) and ${rightName}(${rightWidth}) have different bus widths`)


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
      partSubBus: leftSubBus,
    })
  }
}
