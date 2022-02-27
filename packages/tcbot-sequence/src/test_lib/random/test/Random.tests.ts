import { expect } from "chai";
import { Random } from "../Random";

describe('Random number generator', () => {
    it('Two RNGs with same seed produce identical sequences', () => {
        const random1 = new Random();
        const random2 = new Random(random1.getSeed());
        expect(random1.int32()).equals(random2.int32());
        expect(random1.int32()).equals(random2.int32());
        expect(random1.int32()).equals(random2.int32());
    });

    it('Initializing RNG with seed from used RNG produces similar values after that point', () => {
        const random1 = new Random();
        random1.int32();
        random1.int32();
        random1.int32();
        const random2 = new Random(random1.getSeed());
        expect(random1.int32()).equals(random2.int32());
        expect(random1.int32()).equals(random2.int32());
        expect(random1.int32()).equals(random2.int32());
    });
});