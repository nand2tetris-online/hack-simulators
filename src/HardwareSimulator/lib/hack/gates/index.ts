import { HDLTokenizer, TokenType } from "../../HDLTokenizer"

export enum PinType {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT",
  UNKNOWN = "UNKNOWN"
}

export enum ConnectionType {
  FROM_INPUT = "FROM_INPUT",
  TO_OUTPUT = "TO_OUTPUT",
  INVALID = "INVALID"
}

export class GateClass {
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
    this.outputPinsInfo = outputPinsInfo
  }

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

  private registerPins(pinInfos: PinInfo[], type: PinType) {
    pinInfos.forEach((pinInfo, i) => {
      this.registerPin(pinInfo, type, i)
    })
  }

  private registerPin(pinInfo: PinInfo, type: PinType, pinNumber: number) {
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

  readParts(input: HDLTokenizer) {
    let endOfParts = false

    while (input.hasMoreTokens() && !endOfParts) {
      input.advance()

      // check if end of hdl
      if (input.tokenType === TokenType.SEMICOLON) {
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
      if (!endOfParts) {
        input.fail("Missing ')'")
      }
      if (input.hasMoreTokens()) {
        input.fail("Expected EOF after '}'")
      }
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

    console.log(this.connections)
  }

  addConnection(input: HDLTokenizer, partName: string, partNumber: number, leftName: string, rightName: string) {
    const partGateClass = this.partsList[partNumber]

    const leftType = partGateClass.getPinType(leftName)
    if (leftType === PinType.UNKNOWN) {
      input.fail(`${leftName} is not a pin in ${partName}`)
    }
    const leftNumber = partGateClass.getPinNumber(leftName)
    // const leftPinInfo = partGateClass.getPinInfo(leftType, leftNumber)

    const rightType = this.getPinType(rightName)
    const rightNumber = this.getPinNumber(rightName)
    //const rightPinInfo = this.getPinInfo(rightType, rightNumber)

    let connectionType: ConnectionType = ConnectionType.INVALID
    switch (leftType) {
      case PinType.INPUT:
        switch (rightType) {
          case PinType.INPUT:
            connectionType = ConnectionType.FROM_INPUT
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
  return new BuiltInGateClass(name, [], [])
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
    return new BuiltInGateClass(gateName, inputPinsInfo, outputPinsInfo)
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
