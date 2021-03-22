import { getGateClass } from "../gates"
import { UserWorkspace } from "../gates/composite-gateclass"
import { Gate } from "../gates/gate"
import { Node } from "../gates/node"

export class HardwareSimulator {
    gate: Gate | null
    clockUp: boolean

    time: number;

    // TODO: too many instances of this floating around, need to clean it up
    userWorkspace: UserWorkspace | null;

    // TODO: this needs to go away
    setGateFilename: (_:string) => void;

    constructor(setGateFilename: (_:string) => void) {
        this.setGateFilename = setGateFilename;
        this.gate = null
        this.clockUp = false
        this.time = 0;
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

    restart() {
        // reset input pins to 0
        this.gate?.eval();
        this.time = 0;
        this.clockUp = false;
    }

    performTock() {
        if (this.gate === null) return;

        this.gate.tock()
        this.clockUp = false
        this.time++;
    }

    performTick() {
        if (this.gate === null) return;

        this.gate.tick()
        this.clockUp = true
    }

    performEval() {
        if (this.gate === null) return;

        this.gate.eval();
    }

    setInputPin(pinNumber: number, value: number) {
        this.gate?.inputPins[pinNumber].set(value)
    }

    getValue(varName: string): string | never {
        if (varName === 'time') {
            return this.time.toString() + (this.clockUp ? '+' : ' ');
        } else {
            const node = this.gate?.getNode(varName);
            if (node) {
                return node.get().toString();
            }
        }
        throw new Error(`incomplete getValue ${varName}`);
    }

    setValue(varName: string, value: string) {
        if (this.gate === null) { throw new Error(""); }
        let decimalForm = toDecimalForm(value);

        const numValue = parseInt(decimalForm);
        const node: Node | null = this.gate.getNode(varName);
        if (node) {
            // TODO: all but INPUT pins are readonly, add check
            node.set(numValue);
        }
    }

    doCommand(command: string[]) {
        // console.log("doCommand", command);
        if (command.length === 0) {
            // TODO: throw error
            // console.log("No command");
            return;
        }

        const commandName = command[0];

        if (commandName === 'tick') {
            this.performTick();
        } else if (commandName === 'tock') {
            this.performTock();
        } else if (commandName === 'load') {
            if (!this.userWorkspace) { return; }
            // TODO: BUG: reload gate hdl in UI
            this.loadGate(command[1].slice(0, -4), this.userWorkspace);
            this.setGateFilename(command[1]);
        } else if (commandName === 'set') {
            this.setValue(command[1], command[2]);
        } else if (commandName === 'eval') {
            this.performEval();
        }
    }
}

function toDecimalForm(value: string): string {
    let toParse = value;
    let radix = 10;
    if (toParse.startsWith('%B')) {
        toParse = toParse.substring(2);
        radix = 2;
    }
    return parseInt(toParse, radix).toString();
}
