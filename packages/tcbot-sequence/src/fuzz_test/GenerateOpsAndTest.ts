import { Digraph, randomMinimumDigraphFromSequence } from "../test_lib/digraph/Digraph";
import { PartialEffectRelation, SequenceLimit, SequenceVerificationResult } from "../test_lib/partial-effect-relation/PartialEffectRelation";
import { Random } from "../test_lib/random/Random";
import { MergableOpRequest, SequenceElementType, SequenceTypeImplementation, UserOperation } from "../test_lib/sequence-types/CoreTypes";

interface OpNode<TOperation, TSequenceElement> {
    sequenceNumber: number,
    opInfo: OpInfo<TOperation, TSequenceElement> | undefined
};

interface OpInfo<TOperation, TSequenceElement> {
    op: TOperation,
    userOp: UserOperation<TSequenceElement>,
    sequenceAppliedTo: TSequenceElement[],
}

class MergableOpRequestForOpNode<TOperation, TSequenceElement> implements MergableOpRequest<TOperation> {
    public readonly opNode: OpNode<TOperation, TSequenceElement>;
    private readonly causalityGraph: Digraph<OpNode<TOperation, TSequenceElement>>;

    public constructor(opNode: OpNode<TOperation, TSequenceElement>, causalityGraph: Digraph<OpNode<TOperation, TSequenceElement>>) {
        this.opNode = opNode;
        this.causalityGraph = causalityGraph;
    }

    get op(): TOperation {
        if (!this.opNode.opInfo) {
            throw new Error('op on opNode unexpectedly undefined');
        }
        return this.opNode.opInfo.op;
    }

    public causallyPrecedes(otherOpReq: MergableOpRequest<TOperation>): boolean {
        const other = otherOpReq as MergableOpRequestForOpNode<TOperation, TSequenceElement>;
        return [...this.causalityGraph.iterateSuccessors(this.opNode)].some((opNode) => opNode === other.opNode);
    }
}

export interface SequenceElementGenerator<TSequenceElement> {
    next(): TSequenceElement
}

export function generateOpsAndTest<TDocument, TOperation, TSequenceElement, TSequenceElementIdentity>(
    sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>,
    sequenceElementGenerator: SequenceElementGenerator<TSequenceElement>,
    sequenceTypeImplementation: SequenceTypeImplementation<TSequenceElement, TOperation, TDocument>,
    random: Random
): string | undefined {
    const opNodeList: OpNode<TOperation, TSequenceElement>[] = [];
    for (let i = 0; i < 20; ++i) {
        opNodeList.push({
            opInfo: undefined,
            sequenceNumber: i
        });
    }
    const causalityGraph = randomMinimumDigraphFromSequence(opNodeList, random);
    const mergableOps = opNodeList.map(opNode => new MergableOpRequestForOpNode(opNode, causalityGraph));

    function verifyMergableOpSequence(mergableOpSequence: MergableOpRequest<TOperation>[]): {
        sequence: TSequenceElement[],
        doc: TDocument,
        result: SequenceVerificationResult
    } {
        const partialEffectRelation = new PartialEffectRelation<TSequenceElement, TSequenceElementIdentity>(
            sequenceElementType.identityForSequenceElementFunc, sequenceElementType.sequenceElementStringificationFunc);

        mergableOpSequence.forEach((mergableOp) => {
            const opNode = (mergableOp as MergableOpRequestForOpNode<TOperation, TSequenceElement>).opNode;
            if (!opNode.opInfo) {
                throw new Error("unexpectedly couldn't find operation info on mergable op");
            }
            const userOp = opNode.opInfo.userOp;
            const sequenceAppliedTo = opNode.opInfo.sequenceAppliedTo;
            applyUserOpToPartialEffectRelation<TSequenceElement, TSequenceElementIdentity>(
                userOp, sequenceAppliedTo, partialEffectRelation);
        });
        const doc = sequenceTypeImplementation.mergeFunc(mergableOpSequence);
        const sequence = sequenceTypeImplementation.documentReadFunc(doc);
        const result = partialEffectRelation.verifySequence(sequence);
        return {
            sequence,
            doc,
            result
        }
    }

    for (let i = 0; i < 20; ++i) {
        // populate mergableOpSequence with all causally preceding
        // mergable ops up to (but not including) the ith
        const mergableOpSequence: MergableOpRequest<TOperation>[] = [];
        const mergableOpFinal = mergableOps[i];
        for (let j = 0; j < i; ++j) {
            const mergableOpCur = mergableOps[j];
            if (mergableOpCur.causallyPrecedes(mergableOpFinal)) {
                mergableOpSequence.push(mergableOpCur);
            }
        }

        const { sequence, doc, result } = verifyMergableOpSequence(mergableOpSequence);
        if (result.type === 'failure') {
            return result.reason;
        }

        const userOp = createRandomUserOperation(sequence, sequenceElementGenerator, random);

        mergableOpFinal.opNode.opInfo = {
            userOp,
            op: sequenceTypeImplementation.operationFromUserOpAppliedToDoc(userOp, doc),
            sequenceAppliedTo: sequence
        };
    }

    const { result } = verifyMergableOpSequence(mergableOps);
    return result.type === 'failure' ? result.reason : undefined;
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
        for (let i = 0; i < 3; ++i) {
            content.push(elementGenerator.next());
        }
        return {
            type: 'insertion',
            content,
            index: random.integer(document.length + 1)
        }
    }
}
