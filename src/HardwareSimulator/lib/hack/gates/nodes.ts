export function toBinaryString(node: Node): string {
    return node.get().toString(2).padStart(16, "0")
}

export class Node {
    name: string
    value: Uint16Array

    connections: Set<Node> | null = null

    constructor(name: string = "unknown") {
        this.name = name
        this.value = new Uint16Array(1)
    }

    get() {
      return this.value[0]
    }

    set(value: number) {
        if (value === this.value[0]) return
        this.value[0] = value
        for (let connection of this.connections ?? [])
            connection.set(this.get())
    }

    connect(node: Node) {
        if (!this.connections) this.connections = new Set()
        this.connections.add(node)
    }

    disconnect(node: Node) {
        if (this.connections) this.connections.delete(node)
    }
}

export class SubNode extends Node {
  mask: number
  shiftRight: number

  constructor([low, high]: SubBus) {
    super()
    this.mask = getMask(low, high)
    this.shiftRight = low
  }

  set(value: number) {
    super.set(value)
  }

  get(): number {
    return (this.value[0] & this.mask) >>> this.shiftRight
  }
}

export type SubBus = [low: number, high: number]

export class SubBusListeningAdapter extends Node {
  target: Node
  mask: number
  shiftLeft: number

  constructor(node: Node, [low, high]: SubBus) {
    super()
    this.target = node
    this.shiftLeft = low
    this.mask = getMask(low, high)
  }

  get(): number {
    return this.target.get()
  }

  set(value: number) {
    const masked1 = this.target.get() & ~this.mask
    const masked2 = (value << this.shiftLeft) & this.mask
    this.target.set(masked1 | masked2)
  }
}

// A helper array of powers of two
export const POWERS_OF_2 = [1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192,16384,32768]

export function getMask(low: number, high: number): number {
  let mask = 0
  let bitHolder = POWERS_OF_2[low]
  for (let i=low; i<=high; i++) {
    mask |= bitHolder
    bitHolder = (bitHolder << 1)
  }
  return mask
}
