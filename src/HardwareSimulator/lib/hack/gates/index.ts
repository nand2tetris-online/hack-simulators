import { HDLTokenizer, TokenType } from "../../HDLTokenizer"
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

  constructor(name: string, input: HDLTokenizer, inputPinsInfo: PinInfo[], outputPinsInfo: PinInfo[]) {
    super(name, inputPinsInfo, outputPinsInfo)

    // read typescript class name
    input.advance()
    if (input.tokenType !== TokenType.IDENTIFIER) {
      input.fail("Missing typescript class name")
    }

    // TODO: support more than NAND
    this.tsClassName = builtins.NAND.gate

    // read ';' symbol
    input.advance()
    // @ts-ignore
    if (input.tokenType !== TokenType.SEMICOLON) {
      input.fail("Missing ';'")
    }

    // read ';' symbol
    input.advance()
    if (input.tokenType !== TokenType.RBRACE) {
      input.fail("Missing '}'")
    }
  }

  newInstance(): Gate {
    const inputNodes: Node[] = this.inputPinsInfo.map((_) => new Node())
    const outputNodes: Node[] = this.outputPinsInfo.map((_) => new Node())

    const result = new this.tsClassName(inputNodes, outputNodes, this)

    return result
  }
}

export class CompositeGate extends Gate {
  parts: Gate[]
  internalPins: Node[]

  constructor(inputPins: Node[], outputPins: Node[], internalPins: Node[], gateClass: GateClass, parts: Gate[]) {
    super(inputPins, outputPins, gateClass)
    this.parts = parts
    this.internalPins = internalPins
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

  constructor(name: string, input: HDLTokenizer, inputPinsInfo: PinInfo[], outputPinsInfo: PinInfo[]) {
    super(name, inputPinsInfo, outputPinsInfo)
    this.partsList = []
    this.internalPinsInfo = []
    this.connections = new Set()

    this.readParts(input)
  }

  newInstance(): Gate {
    // create gates from parts
    const parts: Gate[] = []

    this.partsList.forEach((partClass, i) => {
      parts.push(partClass.newInstance())
    })

    const inputNodes: Node[] = this.inputPinsInfo.map((_) => new Node())
    const outputNodes: Node[] = this.outputPinsInfo.map((_) => new Node())
    const internalNodes: Node[] = this.internalPinsInfo.map((_) => new Node())

    const internalConnections: Set<Connection> = new Set()

    // First scan
    let partNode: Node | null = null
    for (let connection of this.connections) {
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
          partNode.addListener(target)
          internalNodes[connection.gatePinNumber] = target
          break
        case ConnectionType.FROM_INTERNAL:
          internalConnections.add(connection)
          break
      }
    }

    // Second scan
    for (let connection of internalConnections) {
      partNode = parts[connection.partNumber].getNode(connection.partPinName)
      if (!partNode) { continue }
      switch (connection.type) {
        case ConnectionType.FROM_INTERNAL:
          const source = internalNodes[connection.gatePinNumber]
          source.addListener(partNode)
          break
      }
    }

    const result = new CompositeGate(inputNodes, outputNodes, internalNodes, this, parts)

    return result
  }

  connectGateToPart(source: Node, target: Node) {
    source.addListener(target)
  }

  readParts(input: HDLTokenizer) {
    let endOfParts = false

    while (input.hasMoreTokens() && !endOfParts) {
      input.advance()

      // check if end of hdl
      if (input.tokenType === TokenType.RBRACE) {
        endOfParts = true
      } else {
        // read partName
        if (input.tokenType !== TokenType.IDENTIFIER) {
          input.fail("A GateClass name is expected")
        }

        const partName = input.token ?? ''
        const gateClass = getGateClassBuiltIn(partName)
        const partNumber = this.partsList.length
        this.partsList.push(gateClass)

        // read (
        input.advance()
        // @ts-ignore
        if (input.tokenType !== TokenType.LPAREN) {
          input.fail("Missing '('")
        }

        this.readPinNames(input, partName, partNumber)

        // read ;
        input.advance()
        if (input.tokenType !== TokenType.SEMICOLON) {
          input.fail("Missing ';'")
        }
      }
    }

    if (!endOfParts) {
      input.fail("Missing '}'")
    }

    // expect EOF
    input.advance()
    if (input.hasMoreTokens()) {
      input.fail("Expected EOF after '}'")
    }
  }

  readPinNames(input: HDLTokenizer, partName: string, partNumber: number): void | never {
    let endOfPins = false
    // read pin names
    while (!endOfPins) {
      // read left pin name
      input.advance()
      if (input.tokenType !== TokenType.IDENTIFIER) {
        input.fail("A pin name is expected")
      }
      const leftName = input.token ?? ""

      // read =
      input.advance()
      // @ts-ignore
      if (input.tokenType !== TokenType.EQUAL) {
        input.fail("Missing '='")
      }

      // read right pin name
      input.advance()
      if (input.tokenType !== TokenType.IDENTIFIER) {
        input.fail("A pin name is expected")
      }
      const rightName = input.token ?? ""
      this.addConnection(input, partName, partNumber, leftName, rightName)

      // read , or )
      input.advance()
      if (input.tokenType === TokenType.RPAREN) {
        endOfPins = true
      } else if (input.tokenType !== TokenType.COMMA) {
        input.fail("Missing ',' or ')'")
      }
    }
  }

  addConnection(input: HDLTokenizer, partName: string, partNumber: number, leftName: string, rightName: string) {
    const partGateClass = this.partsList[partNumber]

    const leftType = partGateClass.getPinType(leftName)
    if (leftType === PinType.UNKNOWN) {
      input.fail(`${leftName} is not a pin in ${partName}`)
    }
    // const leftNumber = partGateClass.getPinNumber(leftName)
    // const leftPinInfo = partGateClass.getPinInfo(leftType, leftNumber)

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
      // rightPinInfo = this.getPinInfo(rightType, rightNumber)
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
            input.fail("Can't connect gate's output pin to part")
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
            input.fail("Can't connect part's output pin to gate's input pin")
        }
        break
    }

    this.connections.add({ type: connectionType, gatePinNumber: rightNumber, partPinName: leftName, partNumber })
  }
}

export function getGateClassHDL(hdl: string): GateClass | never {
  return readHDL(new HDLTokenizer(hdl))
}

export function getGateClassBuiltIn(name: string): GateClass | never {
  // TODO: support more than Nand
  if (name !== "Nand") {
    HDLTokenizer.fail(`Unknown part type ${name}`)
  }
  return readHDL(new HDLTokenizer(builtins.NAND.hdl))
}

export function readHDL(input: HDLTokenizer): GateClass | never {
  // read CHIP keyword
  input.advance()
  if (input.tokenType !== TokenType.CHIP) { input.fail("Missing 'CHIP' keyword") }

  // read gate name
  input.advance()
  // @ts-ignore T2367
  if (input.tokenType !== TokenType.IDENTIFIER) { input.fail("Missing chip name") }
  const gateName = input.token ?? ""

  // read {
  input.advance()
  if (input.tokenType !== TokenType.LBRACE) { input.fail("Missing '{'") }

  // read IN keyword
  input.advance()
  let inputPinsInfo: PinInfo[] = []
  if (input.tokenType === TokenType.IN) {
    inputPinsInfo = getPinsInfo(input)
    input.advance()
  }

  // read OUT keyword
  let outputPinsInfo: PinInfo[] = []
  if (input.tokenType === TokenType.OUT) {
    outputPinsInfo = getPinsInfo(input)
    input.advance()
  }

  // read BUILTIN or PARTS
  if (input.tokenType === TokenType.BUILTIN) {
    return new BuiltInGateClass(gateName, input, inputPinsInfo, outputPinsInfo)
  } else if (input.tokenType === TokenType.PARTS) {
    // read :
    input.advance()
    if (input.tokenType !== TokenType.COLON) {
      input.fail("Missing ':'")
    }
    return new CompositeGateClass(gateName, input, inputPinsInfo, outputPinsInfo)
  } else {
    input.fail("'PARTS' or 'BUILTIN' keyword expected")
  }
}

export function getPinsInfo(input: HDLTokenizer): PinInfo[] {
  let pinInfos: PinInfo[] = []
  let exit = false
  input.advance()

  while (!exit) {
    // check ';' symbol
    if (input.tokenType === TokenType.SEMICOLON) {
      exit = true
    } else {
      // read pin name
      if (input.tokenType !== TokenType.IDENTIFIER) {
        input.fail("Missing pin name")
      }
      const pinName = input.token ?? ""
      // TODO: allow for [6] bus syntax
      const pinWidth = 1
      pinInfos.push({ name: pinName, width: pinWidth })

      // check separator
      input.advance()
      // @ts-ignore
      if (!(input.tokenType === TokenType.COMMA || input.tokenType === TokenType.SEMICOLON)) {
        input.fail("Missing ',' or ';'")
      }
      if (input.tokenType === TokenType.COMMA) {
        input.advance()
      }
    }
  }

  return pinInfos
}
