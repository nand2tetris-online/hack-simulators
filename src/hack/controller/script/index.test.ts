import { CommandCode, Script } from ".";

describe('Scripts', () => {
    describe('build', () => {
        it('works', () => {
            const testScript = 'tick; tock; tick;';

            const script = new Script(testScript);
            expect(script.commands).toHaveLength(4);
        });

        it('works more', () => {
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
    });
});
