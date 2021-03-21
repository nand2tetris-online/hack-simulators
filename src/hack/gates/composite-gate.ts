import { Gate } from "./gate"
import { GateClass, PinType } from "./gateclass"
import { Node } from "./node"

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

  clockUp() {
    if (this.gateClass.isClocked) {
      for (const part of this.parts) part.tick();
    }
  }

  clockDown() {
    if (this.gateClass.isClocked)
      for (const part of this.parts) part.tock();
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
