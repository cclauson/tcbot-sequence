import { RangeableType } from "./Rangeable";

class IntegerRangeableI implements RangeableType<number> {
    public lessThan(val1: number, val2: number): boolean {
        return val1 < val2;
    }
    public equal(val1: number, val2: number): boolean {
        return val1 === val2;
    }
    public immediatelyPrecedes(val1: number, val2: number): boolean {
        return val1 + 1=== val2;
    }
    public minus(val1: number, val2: number): number {
        return val1 - val2;
    }
    public successorOf(val: number): number {
        return val + 1;
    }
    public predecessorOf(val: number): number {
        return val - 1;
    }
}

export const integerRangeable: RangeableType<number> = new IntegerRangeableI();