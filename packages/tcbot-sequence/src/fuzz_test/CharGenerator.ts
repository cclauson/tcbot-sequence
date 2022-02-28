import { SequenceElementGenerator } from "./GenerateOpsAndTest";

const sequence: string[] = [];

for (let i = 'a'.charCodeAt(0); i <= 'z'.charCodeAt(0); ++i) {
    sequence.push(String.fromCharCode(i));
}

sequence.push(...sequence.map((c) => c.toUpperCase()));

for (let i = 0; i < 10; ++i) {
    sequence.push(i.toString());
}

export class CharGenerator implements SequenceElementGenerator<string> {
    private count: number = 0;

    public next(): string {
        if (this.count >= sequence.length) {
            throw new Error('CharGenerator instance cannot create more unique characters');
        }
        const retVal = sequence[this.count];
        ++this.count;
        return retVal;
    }
}