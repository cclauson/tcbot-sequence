interface OpRequest<TOp extends Operation<TOp>> {
    operation: TOp;
    causallyPrecedes(other: OpRequest<TOp>): boolean;
    withOperation(op: TOp): OpRequest<TOp>;
}