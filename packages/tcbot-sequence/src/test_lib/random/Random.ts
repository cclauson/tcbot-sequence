import seedrandom, { PRNG } from "seedrandom";

export class Random {
    private readonly prng: PRNG;

    public constructor(seed?: string) {
        const state = seed ? JSON.parse(seed) : true;
        this.prng = seedrandom(seed, { state });
    }

    public getSeed(): string {
        return JSON.stringify(this.prng.state());
    }

    public int32(): number {
        return this.prng.int32();
    }

    public double(): number {
        return this.prng.double();
    }

    public integer(limit: number): number {
        return Math.floor(this.prng.double() * limit);
    }
}
