import { SubBus } from "./node"

export enum ConnectionType {
    FROM_INPUT = "FROM_INPUT",
    TO_OUTPUT = "TO_OUTPUT",
    FROM_INTERNAL = "FROM_INTERNAL",
    TO_INTERNAL = "TO_INTERNAL",
    FROM_TRUE = "FROM_TRUE",
    FROM_FALSE = "FROM_FALSE",
    INVALID = "INVALID"
}

export type Connection = {
    type: ConnectionType
    gatePinNumber: number
    partNumber: number
    partPinName: string
    gateSubBus: SubBus | null
    partSubBus: SubBus | null
}
