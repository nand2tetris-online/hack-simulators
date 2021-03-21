import { UserWorkspace } from "../gates/composite-gateclass";
import { Gate } from "../gates/gate";
import { HardwareSimulator } from "../simulators/hardware-simulator";
import { CommandCode, Script } from "./script";

export class HackController {
    simulator: HardwareSimulator;

    script: Script | null;
    currentCommandIndex: number;
    loopCommandIndex: number;

    constructor(simulator: HardwareSimulator) {
        this.simulator = simulator;
        this.script = null;

        this.currentCommandIndex = 0;
        this.loopCommandIndex = 0;
    }

    getGate(): Gate | null {
        return this.simulator.gate;
    }

    loadGate(gateName: string, userWorkspace: UserWorkspace) {
        this.simulator.loadGate(gateName, userWorkspace);
    }

    loadScript(scriptName: string, userWorkspace: UserWorkspace) {
        const testScript = userWorkspace.get(scriptName) ?? "tick; tock;";
        this.script = new Script(testScript);
    }

    setInputPin(pinNumber: number, value: number) {
        this.simulator.setInputPin(pinNumber, value);
    }

    singleStep() {
        this.miniStep();
    }

    miniStep() {
        let redo = false;

        do {
            const command = this.script?.getCommandAt(this.currentCommandIndex);
            if (!command) {
                console.log("No command found.");
                return;
            }
            redo = false;

            switch (command.code) {
                case CommandCode.SIMULATOR:
                    this.simulator.doCommand(command.getArg());
                break;
                case CommandCode.REPEAT:
                    this.loopCommandIndex = this.currentCommandIndex + 1;
                redo = true;
                break;
            }

            if (command.code !== CommandCode.END) {
                this.currentCommandIndex++;
                const nextCommand = this.script?.getCommandAt(this.currentCommandIndex);
                if (nextCommand?.code === CommandCode.REPEAT_END) {
                    this.currentCommandIndex = this.loopCommandIndex;
                }
            }
        } while (redo);
    }
}
