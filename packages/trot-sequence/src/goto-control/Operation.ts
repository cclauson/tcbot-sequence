interface Operation<TOp> {
    // assumes that in current log form, this operation
    // is immedately after op2
    // returns new op1/op2 pair, where op1 is this operation
    // transformed and op2 is a transform of the parameter,
    // where op1 can precede op2 in the log
    backTransposeWith(op2: TOp): { op1: TOp, op2: TOp };
    inclusionTransformAgainst(operation: TOp): TOp
}