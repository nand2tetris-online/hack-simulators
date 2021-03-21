import { ScriptTokenizer, TokenType } from "./tokenizer";

export class VariableFormat {
    varName: string;
    format: string;
    padL: number;
    padR: number;
    len: number;

    constructor(varName: string, format: string, padL: number, padR: number, len: number) {
        this.varName = varName;
        this.format = format;
        this.padL = padL;
        this.padR = padR;
        this.len = len;
    }
}

export enum CommandCode {
    END,
    SIMULATOR,
    REPEAT,
    REPEAT_END,
    OUTPUT_FILE,
    COMPARE_TO,
    OUTPUT_LIST,
}

export enum TerminatorType {
    SINGLE_STEP,
    MINI_STEP,
}

export class Command {
    code: CommandCode
    args: any;
    terminator: TerminatorType | undefined

    constructor(code: CommandCode, arg: any) {
        this.code = code;
        this.args = arg;
    }

    getArg(): any {
        return this.args;
    }

    setTerminator(type: TerminatorType) {
        this.terminator = type;
    }
}


export class Script {
    input: ScriptTokenizer;
    commands: Command[]

    constructor(script: string) {
        this.input = new ScriptTokenizer(script);
        this.commands = [];
        this.buildScript();
    }

    getCommandAt(index: number): Command {
        return this.commands[index];
    }

    readArgs(maxArgs: number): string[] {
        let args = new Array(maxArgs);
        let i = 0;
        while (this.input.hasMoreTokens() &&
                (this.input.token.type !== TokenType.SEMICOLON) &&
                    (this.input.token.type !== TokenType.COMMA) &&
                     i < maxArgs) {
            args[i] = this.input.token.literal ?? ""
            this.input.advance();
            i++;
        }
        return args;
    }

    buildScript() {
        let command: Command | null = null
        let repeatOpen = false;
        while (this.input.hasMoreTokens()) {
            this.input.advance();

            switch (this.input.token.type) {
                case TokenType.REPEAT:
                    command = this.createRepeatCommand();
                    repeatOpen = true;
                    break;
                case TokenType.OUTPUT_FILE:
                    command = this.createOutputFileCommand();
                    break;
                case TokenType.COMPARE_TO:
                    command = this.createCompareToCommand();
                    break;
                case TokenType.OUTPUT_LIST:
                    command = this.createOutputListCommand();
                    break;
                case TokenType.IDENTIFIER:
                    // read arg
                    const args = this.readArgs(4); // 4 = MAX_SIMULARTS_ARGS_COUNT
                    command = new Command(CommandCode.SIMULATOR, args);
                    break;
                case TokenType.RBRACE:
                    if (repeatOpen) {
                        command = new Command(CommandCode.REPEAT_END, []);
                        repeatOpen = false;
                    }
                    break;
            }

            if (command) {
                this.commands.push(command);
                switch (this.input.token.type) {
                    case TokenType.SEMICOLON:
                        command.terminator = TerminatorType.SINGLE_STEP;
                        break;
                    case TokenType.COMMA:
                        command.terminator = TerminatorType.MINI_STEP;
                        break;
                }
            }

            // TODO: may not need this in the end, but I seem to need it now
            // I senese trouble ahead
            command = null;
        }

        command = new Command(CommandCode.END, []);
        this.commands.push(command);
        // console.log(this.commands);
    }

    createOutputFileCommand(): Command | never {
        this.input.advance();
        const args: string[] = this.readArgs(1);
        return new Command(CommandCode.OUTPUT_FILE, args);
    }

    createCompareToCommand(): Command | never {
        this.input.advance();
        const args: string[] = this.readArgs(1);
        return new Command(CommandCode.COMPARE_TO, args);
    }

    createOutputListCommand(): Command | never {
        this.input.advance();
        const args: string[] = this.readArgs(20);
        console.log(args);

        let count;
        for (count=0; count<args.length && args[count] !== undefined; count++);

        const vars: VariableFormat[] = new Array(count);

        for (let i=0; i<count; i++) {
            let percentPos = args[i].indexOf('%');
            if (percentPos === -1) {
                percentPos = args[i].length;
                args[i] += "%B1.1.1";
            }

            const varName = args[i].substring(0, percentPos);
            const format = args[i].charAt(percentPos+1);

            let dotPos1 = args[i].indexOf('.', percentPos);
            if (dotPos1 === -1) {
                throw new Error("Missnig '.'");
            }
            let padL = parseInt(args[i].substring(percentPos + 2, dotPos1));

            let dotPos2 = args[i].indexOf('.', dotPos1+1);
            if (dotPos2 === -1) {
                throw new Error("Missing '.'");
            }
            const len = parseInt(args[i].substring(dotPos1+1, dotPos2));
            const padR = parseInt(args[i].substring(dotPos2+1));

            vars[i] = new VariableFormat(varName, format, padL, padR, len);
        }

        return new Command(CommandCode.OUTPUT_LIST, vars);
    }

    createRepeatCommand(): Command | never {
        this.input.advance();
        if (this.input.token.type !== TokenType.LBRACE) {
            this.input.fail("Missing '{' in repeat command");
        }
        return new Command(CommandCode.REPEAT, []);
    }
}
