import { getGateClass } from "../gates"
import { UserWorkspace } from "../gates/composite-gateclass"
import { Gate } from "../gates/gate"

export class HardwareSimulator {
    gate: Gate | null
    clockUp: boolean

    // TODO: too many instances of this floating around, need to clean it up
    userWorkspace: UserWorkspace | null;

    constructor() {
        this.gate = null
        this.clockUp = false
        this.userWorkspace = null;
    }

    loadGate(name: string, userWorkspace: UserWorkspace) {
        this.gate = getGateClass(name, userWorkspace).newInstance();
        this.userWorkspace = userWorkspace;
    }

    step() {
        if (this.clockUp) {
            this.performTock()
        } else {
            this.performTick()
        }
    }

    performTock() {
        if (this.gate === null) return;

        this.gate.tock()
        this.clockUp = false
    }

    performTick() {
        if (this.gate === null) return;

        this.gate.tick()
        this.clockUp = true
    }

    setInputPin(pinNumber: number, value: number) {
        this.gate?.inputPins[pinNumber].set(value)
    }

    doCommand(command: string[]) {
        console.log("doCommand", command);
        if (command.length === 0) {
            // TODO: throw error
            console.log("No command");
            return;
        }

        if (command[0] === 'tick') {
            this.performTick();
        } else if (command[0] === 'tock') {
            this.performTock();
        } else if (command[0] === 'load') {
            if (!this.userWorkspace) { return; }
            // TODO: BUG: reload gate hdl in UI
            this.loadGate(command[1].slice(0, -4), this.userWorkspace);
        }
    }
}
