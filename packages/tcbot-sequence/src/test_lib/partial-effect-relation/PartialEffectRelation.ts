import { Digraph } from "../digraph/Digraph";

export enum SequenceLimit {
    Begin,
    End
}

export interface SequenceVerificationSuccessResult {
    type: 'success';
}

export interface SequenceVerificationFailureResult {
    type: 'failure';
    reason: string;
}

export type SequenceVerificationResult = SequenceVerificationSuccessResult | SequenceVerificationFailureResult;

const sequenceVerificationSuccessResult: SequenceVerificationResult = {
    type: 'success'
};

function sequenceVerificationFailureResult(reason: string): SequenceVerificationResult {
    return {
        type: 'failure',
        reason
    }
}

export class PartialEffectRelation<TSequenceElement, TSequenceElementIdentity> {
    private readonly digraph: Digraph<TSequenceElement | SequenceLimit>;
    private readonly deleted: Set<TSequenceElementIdentity>;
    private readonly identityForSequenceElementFunc: (sequenceElement: TSequenceElement) => TSequenceElementIdentity;
    private readonly sequenceElementStringificationFunc: (sequenceElement: TSequenceElement) => string;

    public constructor(
        identityForSequenceElementFunc: (sequenceElement: TSequenceElement) => TSequenceElementIdentity,
        sequenceElementStringificationFunc: (sequenceElement: TSequenceElement) => string
    ) {
        this.digraph = new Digraph<TSequenceElement | SequenceLimit>();
        this.digraph.addNode(SequenceLimit.Begin);
        this.digraph.addNode(SequenceLimit.End);
        this.digraph.addEdge(SequenceLimit.Begin, SequenceLimit.End);
        this.deleted = new Set<TSequenceElementIdentity>();
        this.identityForSequenceElementFunc = identityForSequenceElementFunc;
        this.sequenceElementStringificationFunc = sequenceElementStringificationFunc;
    }

    public insertSubsequence(
        subsequence: TSequenceElement[],
        before: TSequenceElement | SequenceLimit.Begin,
        after: TSequenceElement | SequenceLimit.End
    ): void {
        let prev: TSequenceElement | undefined;
        for (let seqEl of subsequence) {
            this.digraph.addNode(seqEl);
            this.digraph.addEdge(prev ?? before, seqEl);
            prev = seqEl;
        }
        if (prev) {
            this.digraph.addEdge(prev, after);
            this.digraph.transitiveReduce();
        }
    }

    public deleteSequenceElementsByIdentity(identities: Iterable<TSequenceElementIdentity>): void {
        for (let identity of identities) {
            this.deleted.add(identity);
        }
    }

    public deleteSequenceElements(elements: Iterable<TSequenceElement>): void {
        this.deleteSequenceElementsByIdentity([...elements].map(this.identityForSequenceElementFunc));
    }

    private getImmediateNonDeletedSuccessors(sequenceElement: TSequenceElement | SequenceLimit.Begin): Set<TSequenceElement> {
        const immediateNonDeletedSuccessors = new Set<TSequenceElement>();
        const immediateSuccessors = this.digraph.getImmedateSuccessorNodes(sequenceElement);
        immediateSuccessors.forEach((successor) => {
            if (successor === SequenceLimit.Begin) {
                throw new Error('SequenceLimit.Begin unexpectedly found as successor to sequence element');
            }
            if (successor === SequenceLimit.End) {
                return;
            } else if (this.deleted.has(this.identityForSequenceElementFunc(successor))) {
                this.getImmediateNonDeletedSuccessors(successor).forEach((transitiveSuccessor) => {
                    immediateNonDeletedSuccessors.add(transitiveSuccessor);
                });
            } else {
                immediateNonDeletedSuccessors.add(successor);
            }
        });
        return immediateNonDeletedSuccessors;
    }

    public verifySequence(sequence: TSequenceElement[]): SequenceVerificationResult {

        // invariant: values in possibleNext are elements from our digraph, not from input array
        const possibleNext = new Map<TSequenceElementIdentity, TSequenceElement>();
        
        const addSetToPossibleNext = (newElements: Set<TSequenceElement>) => {
            newElements.forEach((newElement) => {
                possibleNext.set(this.identityForSequenceElementFunc(newElement), newElement);
            });
        }

        const nextAsString = () => 
            `{${[...possibleNext.values()].map(this.sequenceElementStringificationFunc).join(', ')}}`;

        addSetToPossibleNext(this.getImmediateNonDeletedSuccessors(SequenceLimit.Begin));
        
        for (let sequenceElement of sequence) {
            const sequenceElementIdentity = this.identityForSequenceElementFunc(sequenceElement);
            if (possibleNext.has(sequenceElementIdentity)) {
                const foundNext = possibleNext.get(sequenceElementIdentity);
                if (!foundNext) {
                    throw new Error("unexpectedly couldn't get value from map");
                }
                possibleNext.delete(sequenceElementIdentity);
                addSetToPossibleNext(this.getImmediateNonDeletedSuccessors(foundNext));
            } else {
                return sequenceVerificationFailureResult(
                    `found '${
                        this.sequenceElementStringificationFunc(sequenceElement)}
                        ' in sequence where expected one of ${nextAsString()}`);
            }
        }
        return (possibleNext.size === 0)
            ? sequenceVerificationSuccessResult
            : sequenceVerificationFailureResult(
                `premature end of input sequence, expected to find one of ${nextAsString()}`);
    }
}