import { PartialEffectRelation, SequenceLimit } from "../test_lib/partial-effect-relation/PartialEffectRelation";
import { Random } from "../test_lib/random/Random";

export interface UserInsertOperation<TSequenceElement> {
    type: 'insertion'
    content: TSequenceElement[],
    index: number
}

export interface UserDeletionOperation {
    type: 'deletion',
    startIndex: number,
    endIndex: number
}

export type UserOperation<TSequenceElement> = UserInsertOperation<TSequenceElement> | UserDeletionOperation;

export interface SequenceElementGenerator<TSequenceElement> {
    next(): TSequenceElement
}

export function createRandomUserOperation<TSequenceElement>(
    document: TSequenceElement[],
    elementGenerator: SequenceElementGenerator<TSequenceElement>,
    random: Random
): UserOperation<TSequenceElement> {
    if (document.length > 0 && random.double() < 0.3) {
        const i1 = random.integer(document.length + 1);
        let i2: number;
        do {
            i2 = random.integer(document.length + 1);
        } while (i1 === i2);

        return {
            type: 'deletion',
            startIndex: Math.min(i1, i2),
            endIndex: Math.max(i1, i2)
        }
    } else {
        const content = [];
        for (let i = 0; i < 4; ++i) {
            content.push(elementGenerator.next());
        }
        return {
            type: 'insertion',
            content,
            index: random.integer(document.length + 1)
        }
    }
}

export function applyUserOpToPartialEffectRelation<TSequenceElement, TSequenceElementIdentity>(
    userOp: UserOperation<TSequenceElement>,
    document: TSequenceElement[],
    partialEffectRelation: PartialEffectRelation<TSequenceElement, TSequenceElementIdentity>
): void {
    if (userOp.type === 'insertion') {
        const before = userOp.index === 0 ? SequenceLimit.Begin : document[userOp.index - 1];
        const after = userOp.index === document.length ? SequenceLimit.End : document[userOp.index];
        partialEffectRelation.insertSubsequence(userOp.content, before, after);
    } else {
        partialEffectRelation.deleteSequenceElements(document.slice(userOp.startIndex, userOp.endIndex));
    }
}