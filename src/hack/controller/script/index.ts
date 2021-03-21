import { ScriptTokenizer, TokenType } from "./tokenizer";

export enum CommandCode {
    END,
    SIMULATOR,
    REPEAT,
    REPEAT_END,
}

export enum TerminatorType {
    SINGLE_STEP,
}

export class Command {
    code: CommandCode
    args: string[];
    terminator: TerminatorType | null

    constructor(code: CommandCode, arg: string[]) {
        this.code = code;
        this.args = arg;
        this.terminator = null;
    }

    getArg(): string[] {
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

    readArg(): string[] {
        let args = [];
        while (this.input.hasMoreTokens() && (this.input.token.type !== TokenType.SEMICOLON)) {
            args.push(this.input.token.literal ?? "");
            this.input.advance();
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
                case TokenType.IDENTIFIER:
                    // read arg
                    const args = this.readArg();
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
                        command.setTerminator(TerminatorType.SINGLE_STEP);
                        break;
                }
            }

            // may not need this in the end, but I seem to need it now
            // I senese trouble ahead
            command = null;
        }

        command = new Command(CommandCode.END, []);
        this.commands.push(command);
        console.log(this.commands);
    }

    createRepeatCommand(): Command {
        this.input.advance();
        if (this.input.token.type !== TokenType.LBRACE) {
            this.input.fail("Missing '{' in repeat command");
        }
        return new Command(CommandCode.REPEAT, []);
    }
}
