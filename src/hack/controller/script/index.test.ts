import { CommandCode, Script } from ".";

describe('Scripts', () => {
    describe('build', () => {
        it('basic', () => {
            const testScript = 'tick; tock; tick;';

            const script = new Script(testScript);
            expect(script.commands).toHaveLength(4);
        });

        it('repeat', () => {
            const testScript = 'repeat { tick; tock; }';

            const script = new Script(testScript);

            const expectedCodes = [
                CommandCode.REPEAT,
                CommandCode.SIMULATOR,
                CommandCode.SIMULATOR,
                CommandCode.REPEAT_END,
                CommandCode.END,
            ];
            expect(script.commands.map((c) => c.code)).toEqual(expectedCodes);
        });

        it('ministeps', () => {
            const testScript = 'repeat { tick, tock; }';

            const script = new Script(testScript);

            const expectedCodes = [
                CommandCode.REPEAT,
                CommandCode.SIMULATOR,
                CommandCode.SIMULATOR,
                CommandCode.REPEAT_END,
                CommandCode.END,
            ];
            expect(script.commands.map((c) => c.code)).toEqual(expectedCodes);
        });

        it('nots', () => {
            const testScript =`load Not.hdl,
                output-file Not.out,
                compare-to Not.cmp,
                output-list in%B3.1.3 out%B3.1.3;

                set in 0,
                eval,
                output;

                set in 1,
                eval,
                output;`

            const script = new Script(testScript);

            const expectedCodes = [
                CommandCode.REPEAT,
                CommandCode.SIMULATOR,
                CommandCode.SIMULATOR,
                CommandCode.REPEAT_END,
                CommandCode.END,
            ];
            expect(script.commands.map((c) => c.code)).toEqual(expectedCodes);
        });
    });
});
