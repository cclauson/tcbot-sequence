import { Digraph, randomMinimumDigraphFromSequence } from "../test_lib/digraph/Digraph";
import { PartialEffectRelation, SequenceVerificationResult } from "../test_lib/partial-effect-relation/PartialEffectRelation";
import { Random } from "../test_lib/random/Random";
import { applyUserOpToPartialEffectRelation, createRandomUserOperation, SequenceElementGenerator, UserOperation } from "./UserOperation";

interface OpNode<TOperation, TSequenceElement> {
    op: TOperation | undefined,
    userOp: UserOperation<TSequenceElement> | undefined,
    sequenceAppliedTo: TSequenceElement[] | undefined,
    sequenceNumber: number
};

export interface MergableOpRequest<TOperation> {
    op: TOperation,
    causallyPrecedes(otherOpReq: MergableOpRequest<TOperation>): void;
}

class MergableOpRequestForOpNode<TOperation, TSequenceElement> implements MergableOpRequest<TOperation> {
    public readonly opNode: OpNode<TOperation, TSequenceElement>;
    private readonly causalityGraph: Digraph<OpNode<TOperation, TSequenceElement>>;

    public constructor(opNode: OpNode<TOperation, TSequenceElement>, causalityGraph: Digraph<OpNode<TOperation, TSequenceElement>>) {
        this.opNode = opNode;
        this.causalityGraph = causalityGraph;
    }

    get op(): TOperation {
        if (!this.opNode.op) {
            throw new Error('op on opNode unexpectedly undefined');
        }
        return this.opNode.op;
    }

    public causallyPrecedes(otherOpReq: MergableOpRequest<TOperation>): boolean {
        const other = otherOpReq as MergableOpRequestForOpNode<TOperation, TSequenceElement>;
        return [...this.causalityGraph.iterateSuccessors(this.opNode)].some((opNode) => opNode === other.opNode);
    }
}

export function generateOpsAndTest<TDocument, TOperation, TSequenceElement, TSequenceElementIdentity>(
    documentReadFunc: (document: TDocument) => TSequenceElement[],
    operationFromUserOpAppliedToDoc: (userOperation: UserOperation<TSequenceElement>, document: TDocument) => TOperation,
    mergeFunc: (ops: MergableOpRequest<TOperation>[]) => TDocument,
    elementGenerator: SequenceElementGenerator<TSequenceElement>,
    identityForSequenceElementFunc: (sequenceElement: TSequenceElement) => TSequenceElementIdentity,
    sequenceElementStringificationFunc: (sequenceElement: TSequenceElement) => string,
    random: Random
): string | undefined {
    const opNodeList: OpNode<TOperation, TSequenceElement>[] = [];
    for (let i = 0; i < 20; ++i) {
        opNodeList.push({
            op: undefined,
            userOp: undefined,
            sequenceAppliedTo: undefined,
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
            identityForSequenceElementFunc, sequenceElementStringificationFunc);

        mergableOpSequence.forEach((mergableOp) => {
            const opNode = (mergableOp as MergableOpRequestForOpNode<TOperation, TSequenceElement>).opNode;
            const userOp = opNode.userOp;
            const sequenceAppliedTo = opNode.sequenceAppliedTo;
            if (!userOp || !sequenceAppliedTo) {
                throw new Error("unexpectedly couldn't find operation info on mergable op");
            }
            applyUserOpToPartialEffectRelation<TSequenceElement, TSequenceElementIdentity>(
                userOp, sequenceAppliedTo, partialEffectRelation);
        });
        const doc = mergeFunc(mergableOpSequence);
        const sequence = documentReadFunc(doc);
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

        const userOp = createRandomUserOperation(sequence, elementGenerator, random);

        mergableOpFinal.opNode.userOp = userOp;
        mergableOpFinal.opNode.op = operationFromUserOpAppliedToDoc(userOp, doc);
    }

    const { result } = verifyMergableOpSequence(mergableOps);
    return result.type === 'failure' ? result.reason : undefined;
}
