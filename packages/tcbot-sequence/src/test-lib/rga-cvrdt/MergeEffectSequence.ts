export function mergeEffectSequence<TSequenceElement>(
    sequence1: TSequenceElement[],
    sequence2: TSequenceElement[],
    equal: (sequenceElement1: TSequenceElement, sequenceElement2: TSequenceElement) => boolean,
    comp: (sequenceElement1: TSequenceElement, sequenceElement2: TSequenceElement) => number
): TSequenceElement[] {
    if (sequence1.length === 0) {
        return [...sequence2];
    }
    if (sequence2.length === 0) {
        return [...sequence1];
    }
    let i1 = 0;
    let i2 = 0;
    let resultBuffer: TSequenceElement[] = [];
    while (i1 < sequence1.length && i2 < sequence2.length) {
        const el1 = sequence1[i1];
        const el2 = sequence2[i2];
        if (equal(el1, el2)) {
            ++i1;
            ++i2;
            resultBuffer.push(el1);
        } else if (sequence2.slice(i2 + 1).some(el => equal(el, el1))) {
            resultBuffer.push(el2);
            ++i2;
        } else if (sequence1.slice(i1 + 1).some(el => equal(el, el2))) {
            resultBuffer.push(el1);
            ++i1;
        } else if (comp(el1, el2) < 0) {
            resultBuffer.push(el1);
            ++i1;
        } else {
            resultBuffer.push(el2);
            ++i2;
        }
    }
    let sequenceRemaining: TSequenceElement[];
    let indexRemaining: number;
    if (i1 < sequence1.length) {
        sequenceRemaining = sequence1;
        indexRemaining = i1;
    } else {
        sequenceRemaining = sequence2;
        indexRemaining = i2;
    }
    return resultBuffer.concat(sequenceRemaining.slice(indexRemaining));
}
