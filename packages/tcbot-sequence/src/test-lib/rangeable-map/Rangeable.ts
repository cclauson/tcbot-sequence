
export interface RangeableType<TRangeable> {
    lessThan(val1: TRangeable, val2: TRangeable): boolean;
    equal(val1: TRangeable, val2: TRangeable): boolean;
    immediatelyPrecedes(val1: TRangeable, val2: TRangeable): boolean;
    // In some cases, a finite sequence might x[1], x[2], x[3], ... x[n]
    // such that each term immediately succeeds the next.  In this case,
    // some integer describes how many steps are required to get from one
    // value to the next, which how subtraction is defined here.
    // If no such finite sequence of steps exist, this is expected to throw
    minus(val1: TRangeable, val2: TRangeable): number;
    successorOf(val: TRangeable): TRangeable;
    predecessorOf(val: TRangeable): TRangeable;
}
