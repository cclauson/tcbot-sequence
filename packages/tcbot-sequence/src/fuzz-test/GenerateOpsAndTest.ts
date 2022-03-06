import { Digraph, randomMinimumDigraphFromSequence } from "../test-lib/digraph/Digraph";
import { PartialEffectRelation, SequenceLimit, SequenceVerificationResult } from "../test-lib/partial-effect-relation/PartialEffectRelation";
import { Random } from "../test-lib/random/Random";
import { InternalDocument, MergableOpRequest, SequenceElementType, SequenceTypeImplementation, UserOperation } from "../test-lib/sequence-types/CoreTypes";
import { TestDocumentState, TestDocumentStateFactory } from "../test-lib/sequence-types/TestDocumentState";

interface OpNode<TOperation, TSequenceElement, TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument, TOperation, number>> {
    sequenceNumber: number,
    opInfo: OpInfo<TOperation, TSequenceElement, TInternalDocument> | undefined
};

interface OpInfo<TOperation, TSequenceElement, TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument, TOperation, number>> {
    op: TOperation,
    userOp: UserOperation<TSequenceElement>,
    sequenceAppliedTo: TSequenceElement[],
    testDocumentState: TestDocumentState<TSequenceElement, TOperation, TInternalDocument>
}

class MergableOpRequestForOpNode<TOperation, TSequenceElement, TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument, TOperation, number>> implements MergableOpRequest<TOperation> {
    public readonly opNode: OpNode<TOperation, TSequenceElement, TInternalDocument>;
    private readonly causalityGraph: Digraph<OpNode<TOperation, TSequenceElement, TInternalDocument>>;

    public constructor(opNode: OpNode<TOperation, TSequenceElement, TInternalDocument>, causalityGraph: Digraph<OpNode<TOperation, TSequenceElement, TInternalDocument>>) {
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
        const other = otherOpReq as MergableOpRequestForOpNode<TOperation, TSequenceElement, TInternalDocument>;
        return [...this.causalityGraph.iterateSuccessors(this.opNode)].some((opNode) => opNode === other.opNode);
    }
}

export interface SequenceElementGenerator<TSequenceElement> {
    next(): TSequenceElement
}

export function generateOpsAndTest<TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument, TOperation, number>, TOperation, TSequenceElement, TSequenceElementIdentity>(
    sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>,
    sequenceElementGenerator: SequenceElementGenerator<TSequenceElement>,
    sequenceTypeImplementation: SequenceTypeImplementation<TSequenceElement, TOperation, number, TInternalDocument>,
    random: Random
): string | undefined {
    const opNodeList: OpNode<TOperation, TSequenceElement, TInternalDocument>[] = [];
    for (let i = 0; i < 20; ++i) {
        opNodeList.push({
            opInfo: undefined,
            sequenceNumber: i
        });
    }
    const causalityGraph = randomMinimumDigraphFromSequence(opNodeList, random);
    const mergableOps = opNodeList.map(opNode => new MergableOpRequestForOpNode(opNode, causalityGraph));

    const testDocumentStateFactory = new TestDocumentStateFactory(sequenceTypeImplementation);

    function populatePartialEffectRelation(mergableOpSequence: MergableOpRequest<TOperation>[]): PartialEffectRelation<TSequenceElement, TSequenceElementIdentity> {
        const partialEffectRelation = new PartialEffectRelation<TSequenceElement, TSequenceElementIdentity>(
            sequenceElementType.identityForSequenceElementFunc, sequenceElementType.sequenceElementStringificationFunc);

        mergableOpSequence.forEach((mergableOp) => {
            const opNode = (mergableOp as MergableOpRequestForOpNode<TOperation, TSequenceElement, TInternalDocument>).opNode;
            if (!opNode.opInfo) {
                throw new Error("unexpectedly couldn't find operation info on mergable op");
            }
            const userOp = opNode.opInfo.userOp;
            const sequenceAppliedTo = opNode.opInfo.sequenceAppliedTo;
            applyUserOpToPartialEffectRelation<TSequenceElement, TSequenceElementIdentity>(
                userOp, sequenceAppliedTo, partialEffectRelation);
        });

        return partialEffectRelation;
    }

    function verifyMergableOpSequence(
        mergableOpSequence: MergableOpRequestForOpNode<TOperation, TSequenceElement, TInternalDocument>[],
        headMergableOps: Set<OpNode<TOperation, TSequenceElement, TInternalDocument>>
    ): {
        sequence: TSequenceElement[],
        result: SequenceVerificationResult,
        testDocState: TestDocumentState<TSequenceElement, TOperation, TInternalDocument>
    } {
        const immediateCausalPredecessors = headMergableOps;
        let testDocState = testDocumentStateFactory.emptyState();
        for (let immediateCausalPredecessor of immediateCausalPredecessors) {
            if (!immediateCausalPredecessor.opInfo) {
                throw new Error('Unexpected found no op info on node');
            }
            testDocState = testDocState.mergeWith(immediateCausalPredecessor.opInfo.testDocumentState);
        }
        
        const partialEffectRelation = populatePartialEffectRelation(mergableOpSequence);

        const sequence = testDocState.read();
        const result = partialEffectRelation.verifySequence(sequence);

        return {
            sequence,
            result,
            testDocState
        }
    }

    for (let i = 0; i < 20; ++i) {
        const mergableOpFinal = mergableOps[i];

        // populate mergableOpSequence with all causally preceding
        // mergable ops up to (but not including) the ith
        const mergableOpSequence: MergableOpRequestForOpNode<TOperation, TSequenceElement, TInternalDocument>[] = [];
        for (let j = 0; j < i; ++j) {
            const mergableOpCur = mergableOps[j];
            if (mergableOpCur.causallyPrecedes(mergableOpFinal)) {
                mergableOpSequence.push(mergableOpCur);
            }
        }

        const immediateCausalPredecessors = causalityGraph.getImmedatePredecessorNodes(mergableOpFinal.opNode)
        const { sequence, result, testDocState } = verifyMergableOpSequence(mergableOpSequence, immediateCausalPredecessors);

        if (result.type === 'failure') {
            return result.reason;
        }

        const userOp = createRandomUserOperation(sequence, sequenceElementGenerator, random);
        mergableOpFinal.opNode.opInfo = {
            userOp,
            op: sequenceTypeImplementation.operationFromUserOpAppliedToDoc(userOp, testDocState.documentState, i),
            sequenceAppliedTo: sequence,
            testDocumentState: testDocState.withUserOperation(userOp, i)
        };
    }

    const { result } = verifyMergableOpSequence(mergableOps, causalityGraph.nodesWithOutdegreeZero());
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
