import { EffectSequenceElement, RgaDoc } from "./RgaDoc";
import { SequenceElementType, SequenceTypeImplementation, UserOperation } from "../sequence-types/CoreTypes";

interface RgaInsertionOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder> {
    type: 'insertion',
    document: RgaDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder>,
    inserted: Set<TSequenceElementIdentity>
}

interface RgaDeletionOp<TSequenceElementIdentity> {
    type: 'deletion',
    deleted: Set<TSequenceElementIdentity>
}

export type RgaOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder> = RgaInsertionOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder>
    | RgaDeletionOp<TSequenceElementIdentity>;

export class Rga<TSequenceElement, TSequenceElementIdentity, TOperationOrder> implements
    SequenceTypeImplementation<TSequenceElement, RgaOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder>, TOperationOrder, RgaDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder>> {

    public constructor(
        private readonly sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>,
        private readonly sequenceElementOrderCompFn: (o1: TOperationOrder, o2: TOperationOrder) => number) {
        this.sequenceElementType = sequenceElementType;
    }

    public emptyDocument(): RgaDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder> {
        return new RgaDoc([] as EffectSequenceElement<TSequenceElement, TOperationOrder>[], new Set<TSequenceElementIdentity>(), this.sequenceElementType, this.sequenceElementOrderCompFn);
    };
    
    public documentReadFunc(document: RgaDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder>): TSequenceElement[] {
        return document.read();
    }

    public operationFromUserOpAppliedToDoc(userOperation: UserOperation<TSequenceElement>, document: RgaDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder>, order: TOperationOrder): RgaOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder> {
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
            const insertionDoc: RgaDoc<TSequenceElement, TSequenceElementIdentity, TOperationOrder> = new RgaDoc(
                effectSequence,
                new Set<TSequenceElementIdentity>(),
                this.sequenceElementType,
                this.sequenceElementOrderCompFn
            );
            const insertedIdentities = new Set<TSequenceElementIdentity>(userOperation.content.map(this.sequenceElementType.identityForSequenceElementFunc));
            return {
                type: 'insertion',
                document: insertionDoc,
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
}
