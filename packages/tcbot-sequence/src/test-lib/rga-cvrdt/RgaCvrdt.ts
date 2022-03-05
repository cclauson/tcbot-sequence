import { EffectSequenceElement, RgaCvrdtDoc } from "./RgaCvrdtDoc";
import { MergableOpRequest, SequenceElementType, SequenceTypeImplementation, UserOperation } from "../sequence-types/CoreTypes";

interface RgaCvrdtInsertionOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder> {
    type: 'insertion',
    document: RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder>,
    inserted: Set<TSequenceElementIdentity>
}

interface RgaCvrdtDeletionOp<TSequenceElementIdentity> {
    type: 'deletion',
    deleted: Set<TSequenceElementIdentity>
}

export type RgaCvrdtOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder> = RgaCvrdtInsertionOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder>
    | RgaCvrdtDeletionOp<TSequenceElementIdentity>;

export class RgaCvrdt<TSequenceElement, TSequenceElementIdentity, TOperationOrder> implements
    SequenceTypeImplementation<TSequenceElement, RgaCvrdtOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder>, TOperationOrder, RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder>> {

    public constructor(
        private readonly sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>,
        private readonly sequenceElementOrderCompFn: (o1: TOperationOrder, o2: TOperationOrder) => number) {
        this.sequenceElementType = sequenceElementType;
    }

    public emptyDocument(): RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder> {
        return new RgaCvrdtDoc([] as EffectSequenceElement<TSequenceElement, TOperationOrder>[], new Set<TSequenceElementIdentity>(), this.sequenceElementType, this.sequenceElementOrderCompFn);
    };
    
    public documentReadFunc(document: RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder>): TSequenceElement[] {
        return document.read();
    }

    public operationFromUserOpAppliedToDoc(userOperation: UserOperation<TSequenceElement>, document: RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder>, order: TOperationOrder): RgaCvrdtOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder> {
        const nonTombstoneEffectSequence = document.getNonTombstoneEffectSequence();
        if (userOperation.type === 'insertion') {
            const effectSequence: EffectSequenceElement<TSequenceElement, TOperationOrder>[] = [];
            if (userOperation.index !== 0) {
                effectSequence.push(nonTombstoneEffectSequence[userOperation.index - 1]);
            }
            effectSequence.push(...userOperation.content.map(seqEl => { return { sequenceElement: seqEl, order };}));
            if (userOperation.index !== nonTombstoneEffectSequence.length) {
                effectSequence.push(nonTombstoneEffectSequence[userOperation.index]);
            }
            const insertionDoc: RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder> = new RgaCvrdtDoc(
                effectSequence,
                new Set<TSequenceElementIdentity>(),
                this.sequenceElementType,
                this.sequenceElementOrderCompFn
            );
            const insertedIdentities = new Set<TSequenceElementIdentity>(userOperation.content.map(this.sequenceElementType.identityForSequenceElementFunc));
            const mergedDoc = document.merge(insertionDoc);
            return {
                type: 'insertion',
                document: mergedDoc,
                inserted: insertedIdentities
            };
        } else {
            const deletedIdentities =
                nonTombstoneEffectSequence.slice(userOperation.startIndex, userOperation.endIndex).map(
                    seqEl => this.sequenceElementType.identityForSequenceElementFunc(seqEl.sequenceElement)
                );
            return {
                type: 'deletion',
                deleted: new Set<TSequenceElementIdentity>(deletedIdentities)
            }
        }
    }

    public mergeFunc(ops: MergableOpRequest<RgaCvrdtOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder>>[]): RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder> {
        let document = this.emptyDocument();
        for(let mergableOp of ops) {
            const op = mergableOp.op;
            if (op.type === 'insertion') {
                document = document.merge(op.document);
            } else {
                document = document.merge(new RgaCvrdtDoc([], op.deleted, this.sequenceElementType, this.sequenceElementOrderCompFn));
            }
        }
        return document;
    }
}
