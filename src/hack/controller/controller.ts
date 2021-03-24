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
    outputLinesCounter: number;

    compare: string[];
    compareLinesCounter: number;
    comparisonFailed: boolean;
    comparisonFailureLine: number;

    userWorkspace: UserWorkspace;

    displayMessage: (message: string, error: boolean) => void;
    setTestScriptLine: (line: number) => void;

    fastForwardRunning: boolean;
    fastForwardInterval: NodeJS.Timeout | null ;

    constructor(simulator: HardwareSimulator, displayMessage: (_:string) => void, setTestScriptLine: (_:number) => void) {
        this.simulator = simulator;
        this.displayMessage = (m, e) => displayMessage(m);
        this.setTestScriptLine = setTestScriptLine;

        this.script = null;

        this.currentCommandIndex = 0;
        this.loopCommandIndex = 0;

        this.varList = [];

        this.output = '';
        this.outputLinesCounter = 0;

        this.compare = [];
        this.compareLinesCounter = 0;
        this.comparisonFailed = false;
        this.comparisonFailureLine = 0;

        this.fastForwardRunning = false;
        this.fastForwardInterval = null;

        this.userWorkspace = new Map();
    }

    getGate(): Gate | null {
        return this.simulator.gate;
    }

    loadGate(gateName: string, userWorkspace: UserWorkspace) {
        // TODO: this is me being lazy
        this.userWorkspace = userWorkspace;
        this.simulator.loadGate(gateName, userWorkspace);
    }

    loadScript(scriptName: string, userWorkspace: UserWorkspace) {
        // TODO: this is me being lazy
        this.userWorkspace = userWorkspace;
        const testScript = userWorkspace.get(scriptName) ?? "tick; tock;";
        this.script = new Script(testScript);
        this.currentCommandIndex = 0;
        this.setTestScriptLine(this.script.lineNumbers[0]);
        this.output = '';
        this.compare = []
        this.displayMessage("New script loaded " + scriptName, false);
    }

    setInputPin(pinNumber: number, value: number) {
        this.simulator.setInputPin(pinNumber, value);
    }

    singleStep() {
        this.displayMessage('', false);
        let terminatorType: TerminatorType | undefined
        do {
            terminatorType = this.miniStep();
        } while (terminatorType === TerminatorType.MINI_STEP);
        this.setTestScriptLine(this.script?.lineNumbers[this.currentCommandIndex] ?? -1);
    }

    fastForward() {
        this.displayMessage('', false);
        this.fastForwardRunning = true;
        /* TODO: use this for noAnimation mode
        while (this.fastForwardRunning) {
            this.singleStep();
        }
        */
       this.fastForwardInterval = setInterval(() => { this.singleStep(); }, 500);
    }

    stop() {
        if (this.fastForwardRunning && this.fastForwardInterval) {
            this.fastForwardRunning = false;
            clearInterval(this.fastForwardInterval);
        }
    }

    resetOutput() {
        this.output = '';
        this.outputLinesCounter = 0
    }

    resetCompare() {
        this.compareLinesCounter = 0;
        this.comparisonFailed = false;
    }

    restart() {
        this.simulator.restart();
        this.resetOutput();
        this.resetCompare();
        this.currentCommandIndex = 0;
        this.setTestScriptLine(this.script?.lineNumbers[0] ?? -1);
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
                    this.resetOutput();
                    break;
                case CommandCode.COMPARE_TO:
                    // set compare to file name
                    this.compare = this.userWorkspace.get(command.getArg()[0])?.split('\n') ?? [];
                    this.resetCompare();
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
                case CommandCode.END:
                    this.stop();
                    if (this.compare) {
                        if (this.comparisonFailed) {
                            this.displayMessage(`End of script - Comparison failure at line ${this.comparisonFailureLine}`, true);
                        } else {
                            this.displayMessage(`End of script - Comparison ended successfully`, false);
                        }
                    } else {
                        this.displayMessage('End of script', false);
                    }
                    break;
            }

            if (command.code !== CommandCode.END) {
                this.currentCommandIndex++;
                this.setTestScriptLine(this.currentCommandIndex);
                const nextCommand = this.script?.getCommandAt(this.currentCommandIndex);
                if (nextCommand?.code === CommandCode.REPEAT_END) {
                    this.currentCommandIndex = this.loopCommandIndex;
                    this.setTestScriptLine(this.currentCommandIndex);
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
        this.outputAndCompare(line);
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
        this.outputAndCompare(line);
    }

    outputAndCompare(line: string) {
        this.output += line + '\n';
        this.outputLinesCounter++;

        if (this.compare.length > 0) {
            const compareLine = this.compare[this.compareLinesCounter];
            this.compareLinesCounter++;

            if (!this.compareLine(line, compareLine)) {
                this.comparisonFailed = true;
                this.comparisonFailureLine = this.compareLinesCounter;
                this.displayMessage(`Comparison failure at line ${this.comparisonFailureLine}`, true);
            }
        }
    }

    compareLine(line: string, compareLine: string): boolean {
        return compareLine.trim() === line;
    }
}
