import { UserWorkspace } from "../gates/composite-gateclass";
import { Gate } from "../gates/gate";
import { HardwareSimulator } from "../simulators/hardware-simulator";
import { Command, CommandCode, Script, TerminatorType, VariableFormat } from "./script";

export class HackController {
    simulator: HardwareSimulator;

    script: Script | null;
    currentCommandIndex: number;
    loopCommandIndex: number;

    varList: VariableFormat[];

    output: string;

    constructor(simulator: HardwareSimulator) {
        this.simulator = simulator;
        this.script = null;

        this.currentCommandIndex = 0;
        this.loopCommandIndex = 0;

        this.varList = [];

        this.output = '';
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
        let terminatorType: TerminatorType | undefined
        do {
            terminatorType = this.miniStep();
        } while (terminatorType === TerminatorType.MINI_STEP);
    }

    miniStep(): TerminatorType | undefined {
        let redo = false;
        let command: Command | undefined

        do {
            command = this.script?.getCommandAt(this.currentCommandIndex);
            if (!command) { throw new Error("No command found."); } // TODO: rm
            redo = false;

            switch (command.code) {
                case CommandCode.SIMULATOR:
                    this.simulator.doCommand(command.getArg());
                    break;
                case CommandCode.OUTPUT_FILE:
                    // set current output file name
                    // clear output file
                    console.log('output file');
                    this.output = '';
                    break;
                case CommandCode.COMPARE_TO:
                    // set compare to file name
                    console.log('compare to');
                    break;
                case CommandCode.OUTPUT_LIST:
                    this.doOutputListCommand(command);
                    break;
                case CommandCode.OUTPUT:
                    this.doOutputCommand(command);
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

        if (!command) { throw new Error("No command found."); } // TODO: rm

        return command.terminator
    }

    doOutputCommand(command: Command) {
        let line = '|';
        for (let i=0; i<this.varList.length; i++) {
            const vars = this.varList[i];
            let value: string = this.simulator.getValue(vars.varName);
            if (vars.format !== 'S') {
                let numValue: number = parseInt(value);
                if (vars.format === 'B') {
                    value = numValue.toString(2).padStart(16, '0');
                }
            }
            if (value.length > vars.len) {
                value = value.substring(value.length - vars.len);
            }
            line += ' '.repeat(vars.padL) + value + ' '.repeat(vars.padR) + '|';
        }
        this.outputAndCompare(line + '\n');
    }

    doOutputListCommand(command: Command) {
        this.varList = command.getArg();
        let line = '|';
        for (let i=0; i<this.varList.length; i++) {
            const vars = this.varList[i];
            const space = vars.padL + vars.padR + vars.len;
            const varName = vars.varName.length > space ? vars.varName.substring(0, space) : vars.varName;
            const leftSpace = Math.floor((space - varName.length)/2);
            const rightSpace = space - leftSpace - varName.length;
            line += ' '.repeat(leftSpace) + varName + ' '.repeat(rightSpace) + '|';
        }
        this.outputAndCompare(line + '\n');
    }

    outputAndCompare(line: string) {
        this.output += line;
        // TODO: do comparison and report failure if so
        console.log(this.output);
    }
}
