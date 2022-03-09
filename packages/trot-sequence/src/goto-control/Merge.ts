export function merge<TOp extends Operation<TOp>>(log: OpRequest<TOp>[], newOp: OpRequest<TOp>): TOp {
    let firstConcurrentIndex = 0;

    // correctly initialize firstConcurrentIndex
    for (; firstConcurrentIndex < log.length; ++firstConcurrentIndex) {
        if (!log[firstConcurrentIndex].causallyPrecedes(newOp)) {
            break;
        }
    }

    // if no concurrent, return
    if (firstConcurrentIndex === log.length) {
        return newOp.operation;
    }

    let firstCausallySucceedingIndexAfterConcurrent = firstConcurrentIndex + 1;

    // correctly initialize firstCausallySucceedingIndexAfterConcurrent
    for (; firstCausallySucceedingIndexAfterConcurrent < log.length; ++firstCausallySucceedingIndexAfterConcurrent) {
        if (log[firstCausallySucceedingIndexAfterConcurrent].causallyPrecedes(newOp)) {
            break;
        }
    }

    while (firstCausallySucceedingIndexAfterConcurrent !== log.length) {
        // perform back transpositions such that firstCausallySucceedingIndexAfterConcurrent is transposed
        // back to the current index of firstConcurrentIndex
        for (let i = firstCausallySucceedingIndexAfterConcurrent - 1; i >= firstConcurrentIndex; --i) {
            // swap the requests, do back transpose on operations
            const request1 = log[i + 1];
            const request2 = log[i];
            const { op1, op2 } = request1.operation.backTransposeWith(request2.operation);
            log[i] = request1.withOperation(op1);
            log[i + 1] = request2.withOperation(op2);
        }

        ++firstConcurrentIndex;
        ++firstCausallySucceedingIndexAfterConcurrent;

        // update firstCausallySucceedingIndexAfterConcurrent
        for (; firstCausallySucceedingIndexAfterConcurrent < log.length; ++firstCausallySucceedingIndexAfterConcurrent) {
            if (log[firstCausallySucceedingIndexAfterConcurrent].causallyPrecedes(newOp)) {
                break;
            }
        }    
    }

    let op = newOp.operation;
    for (let i = firstConcurrentIndex; i < log.length; ++i) {
        op = op.inclusionTransformAgainst(log[i].operation);
    }

    return op;
}
