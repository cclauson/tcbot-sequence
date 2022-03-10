import { InternalDocument, MergableOpRequest, SequenceElementType } from "../sequence-types/CoreTypes";
import { mergeEffectSequence } from "./MergeEffectSequence";
import { RgaOp } from "./Rga";

export interface EffectSequenceElement<TSequenceElement, TSequenceElementOrder> {
    sequenceElement: TSequenceElement,
    order: TSequenceElementOrder
}

export class RgaDoc<TSequenceElement, TSequenceElementIdentity, TSequenceElementOrder> implements InternalDocument<TSequenceElement, RgaDoc<TSequenceElement, TSequenceElementIdentity, TSequenceElementOrder>, RgaOp<TSequenceElement, TSequenceElementIdentity, TSequenceElementOrder>, TSequenceElementOrder> {
    constructor(
        private readonly effectSequence: EffectSequenceElement<TSequenceElement, TSequenceElementOrder>[],
        private readonly deleted: Set<TSequenceElementIdentity>,
        private readonly sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>,
        private readonly sequenceElementOrderCompFn: (o1: TSequenceElementOrder, o2: TSequenceElementOrder) => number
    ) {}

    public read(): TSequenceElement[] {
        return this.getNonTombstoneEffectSequence().map(effectSequenceElement => effectSequenceElement.sequenceElement);
    }

    public getNonTombstoneEffectSequence(): EffectSequenceElement<TSequenceElement, TSequenceElementOrder>[] {
        return this.effectSequence.filter(
            (effectSequenceElement) => !this.deleted.has(this.sequenceElementType.identityForSequenceElementFunc(effectSequenceElement.sequenceElement)));
    }

    public merge(other: RgaDoc<TSequenceElement, TSequenceElementIdentity, TSequenceElementOrder>) {
        return new RgaDoc(
            mergeEffectSequence(
                this.effectSequence,
                other.effectSequence,
                (sequenceElement1: EffectSequenceElement<TSequenceElement, TSequenceElementOrder>, sequenceElement2: EffectSequenceElement<TSequenceElement, TSequenceElementOrder>) => {
                    return this.sequenceElementType.identityForSequenceElementFunc(sequenceElement1.sequenceElement) === this.sequenceElementType.identityForSequenceElementFunc(sequenceElement2.sequenceElement);
                },
                (sequenceElement1: EffectSequenceElement<TSequenceElement, TSequenceElementOrder>, sequenceElement2: EffectSequenceElement<TSequenceElement, TSequenceElementOrder>) => {
                    const ordering = this.sequenceElementOrderCompFn(sequenceElement1.order, sequenceElement2.order);
                    if (ordering === 0) {
                        throw new Error('unexpectedly comparing two distict sequence elements with same order');
                    }
                    // reverse--we want content that comes causally later to come earlier in sequence
                    // NOTE: This is entirely a convention, but we choose this one to be consistent with standard RGA
                    return -ordering;
                }
            ),
            new Set([...this.deleted, ...other.deleted]),
            this.sequenceElementType,
            this.sequenceElementOrderCompFn
        );
    }

    public equals(other: RgaDoc<TSequenceElement, TSequenceElementIdentity, TSequenceElementOrder>): boolean {
        if (this.effectSequence.length !== other.effectSequence.length) {
            return false;
        }
        if (this.deleted.size !== other.deleted.size) {
            return false;
        }
        for (let i = 0; i < this.effectSequence.length; ++i) {
            const ese1 = this.effectSequence[i];
            const ese2 = other.effectSequence[i];
            if (this.sequenceElementOrderCompFn(ese1.order, ese2.order) !== 0) {
                return false;
            }
            if (this.sequenceElementType.identityForSequenceElementFunc(ese1.sequenceElement)
                !== this.sequenceElementType.identityForSequenceElementFunc(ese2.sequenceElement)) {
                return false;
            }
        }
        const otherDeletedCopy = new Set<TSequenceElementIdentity>(other.deleted);
        for (let sequenceElementId of this.deleted) {
            if (!otherDeletedCopy.has(sequenceElementId)) {
                return false;
            }
            otherDeletedCopy.delete(sequenceElementId);
        }
        return otherDeletedCopy.size === 0;
    }

    public applyOpWithOrder(mergableOp: MergableOpRequest<RgaOp<TSequenceElement, TSequenceElementIdentity, TSequenceElementOrder>>, order: TSequenceElementOrder): RgaDoc<TSequenceElement, TSequenceElementIdentity, TSequenceElementOrder> {
        const operation = mergableOp.op;
        return operation.type === 'insertion'
            ? this.merge(operation.document)
            : this.merge(new RgaDoc([], operation.deleted, this.sequenceElementType, this.sequenceElementOrderCompFn));
    }

    // used for testing
    public getEffectSequence(): EffectSequenceElement<TSequenceElement, TSequenceElementOrder>[] {
        return [...this.effectSequence];
    }

    // used for testing
    public getDeleted(): Set<TSequenceElementIdentity> {
        return new Set<TSequenceElementIdentity>([...this.deleted]);
    }

}
