import { Node, SubBusListeningAdapter } from "."

describe("Node", () => {
    it("does it", () => {
        const node = new Node()
        expect(node.toString())
            .toEqual("0000000000000000")

        node.set(5)
        expect(node.toString())
            .toEqual("0000000000000101")

        node.set(-1)
        expect(node.toString())
            .toEqual("1111111111111111")
    })
})

describe("SubBusListeningAdapter", () => {
    it("does one", () => {
        const node = new Node()
        const subBus = new SubBusListeningAdapter(node, [0, 0])

        subBus.set(1)

        expect(subBus.toString())
            .toEqual("0000000000000001")
    })

    it("does multiple", () => {
        const node = new Node()
        const subBus = new SubBusListeningAdapter(node, [7, 11])

        subBus.set(5)

        expect(subBus.toString())
            .toEqual("0000001010000000")
    })
})
