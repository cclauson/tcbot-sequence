import { InternalDocument, SequenceElementType } from "../sequence-types/CoreTypes";
import { mergeEffectSequence } from "./MergeEffectSequence";

export class RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity> implements InternalDocument<TSequenceElement, RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity>> {
    constructor(
        private readonly effectSequence: TSequenceElement[],
        private readonly deleted: Set<TSequenceElementIdentity>,
        private readonly sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>
    ) {}

    public getEffectSequence(): TSequenceElement[] {
        return [...this.effectSequence];
    }

    public getDeleted(): Set<TSequenceElementIdentity> {
        return new Set<TSequenceElementIdentity>([...this.deleted]);
    }

    public read(): TSequenceElement[] {
        const outputBuffer: TSequenceElement[] = [];
        this.effectSequence.forEach((sequenceElement) => {
            if (!this.deleted.has(this.sequenceElementType.identityForSequenceElementFunc(sequenceElement))) {
                outputBuffer.push(sequenceElement);
            }
        })
        return outputBuffer;
    }

    public merge(other: RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity>, comp: (sequenceElement1: TSequenceElement, sequenceElement2: TSequenceElement) => number) {
        return new RgaCvrdtDoc(
            mergeEffectSequence(this.effectSequence, other.effectSequence, comp),
            new Set([...this.deleted, ...other.deleted]),
            this.sequenceElementType
        );
    }

    public equals(other: RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity>): boolean {
        throw new Error("Method not implemented.");
    }
}

export function emptyDocument<TSequenceElement, TSequenceElementIdentity>(
    sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>
): RgaCvrdtDoc<TSequenceElement, TSequenceElementIdentity> {
    return new RgaCvrdtDoc([], new Set<TSequenceElementIdentity>(), sequenceElementType);
};
