import { expect } from "chai";
import { Random } from "../Random";

const testSeed = '{"i":0,"j":79,"S":[26,100,180,205,208,37,207,128,120,154,227,230,38,116,118,79,105,90,247,67,12,143,150,191,28,138,241,220,172,178,114,121,171,34,64,76,168,21,3,221,183,209,198,106,57,35,253,187,226,18,223,56,204,156,122,137,117,140,84,151,186,185,210,192,88,148,182,86,234,147,51,200,159,0,104,96,174,244,211,27,7,197,72,24,45,248,25,163,153,246,54,173,47,62,11,6,135,59,133,32,202,250,14,193,255,157,20,78,112,61,124,162,77,175,195,2,206,145,99,201,46,251,63,219,41,36,190,125,29,98,215,80,33,179,252,243,127,240,60,93,19,5,217,155,31,123,92,134,242,165,13,158,136,75,94,233,224,30,83,9,141,164,113,235,212,161,91,50,52,119,81,245,66,82,169,218,254,167,144,43,199,73,238,17,95,139,181,177,15,44,107,110,222,16,108,89,170,115,101,126,203,237,130,109,196,142,132,160,71,68,10,189,225,213,49,69,53,214,8,184,40,74,188,42,111,48,131,236,85,65,22,97,152,232,194,176,87,70,1,102,55,4,23,103,39,58,129,231,216,166,146,228,249,239,229,149]}';

describe('Random number generator', () => {
    it('Two RNGs with same seed produce identical sequences', () => {
        const random1 = new Random(testSeed);
        const random2 = new Random(random1.getSeed());
        expect(random1.int32()).equals(random2.int32());
        expect(random1.int32()).equals(random2.int32());
        expect(random1.int32()).equals(random2.int32());
    });

    it('Initializing RNG with seed from used RNG produces similar values after that point', () => {
        const random1 = new Random(testSeed);
        random1.int32();
        random1.int32();
        random1.int32();
        const random2 = new Random(random1.getSeed());
        expect(random1.int32()).equals(random2.int32());
        expect(random1.int32()).equals(random2.int32());
        expect(random1.int32()).equals(random2.int32());
    });

    it('double is between 0 and 1', () => {
        const random = new Random(testSeed);
        const d1 = random.double();
        expect(d1).to.be.greaterThanOrEqual(0);
        expect(d1).to.be.lessThan(1);
        const d2 = random.double();
        expect(d2).to.be.greaterThanOrEqual(0);
        expect(d2).to.be.lessThan(1);
        const d3 = random.double();
        expect(d3).to.be.greaterThanOrEqual(0);
        expect(d3).to.be.lessThan(1);
    });
});