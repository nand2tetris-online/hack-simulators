import { Script } from ".";

describe('Scripts', () => {
    describe('build', () => {
        it('works', () => {
            const testScript = 'tick; tock;';

            const script = new Script(testScript);
            expect(script.commands).toHaveLength(3);
        });
    });
});
