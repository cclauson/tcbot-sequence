import { DocumentState as RgaCvrdtDocumentState, emptyDocument, mergeDocumentStates, readDocumentState } from "../rga-cvrdt/DocumentState";
import { MergableOpRequest, SequenceElementType, SequenceTypeImplementation, UserOperation } from "./CoreTypes";

interface RgaCvrdtInsertionOp<TSequenceElement, TSequenceElementIdentity> {
    type: 'insertion',
    document: RgaCvrdtDocumentState<TSequenceElement, TSequenceElementIdentity>,
    inserted: Set<TSequenceElementIdentity>
}

interface RgaCvrdtDeletionOp<TSequenceElementIdentity> {
    type: 'deletion',
    deleted: Set<TSequenceElementIdentity>
}

export type RgaCvrdtOp<TSequenceElement, TSequenceElementIdentity> = RgaCvrdtInsertionOp<TSequenceElement, TSequenceElementIdentity>
    | RgaCvrdtDeletionOp<TSequenceElementIdentity>;

export class RgaCvrdt<TSequenceElement, TSequenceElementIdentity> implements
    SequenceTypeImplementation<TSequenceElement, RgaCvrdtOp<TSequenceElement, TSequenceElementIdentity>, RgaCvrdtDocumentState<TSequenceElement, TSequenceElementIdentity>> {

    private readonly sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>;

    public constructor(sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>) {
        this.sequenceElementType = sequenceElementType;
    }
    
    public documentReadFunc(document: RgaCvrdtDocumentState<TSequenceElement, TSequenceElementIdentity>): TSequenceElement[] {
        return readDocumentState(document, this.sequenceElementType.identityForSequenceElementFunc);
    }

    public operationFromUserOpAppliedToDoc(userOperation: UserOperation<TSequenceElement>, document: RgaCvrdtDocumentState<TSequenceElement, TSequenceElementIdentity>): RgaCvrdtOp<TSequenceElement, TSequenceElementIdentity> {
        const readResult = this.documentReadFunc(document);
        if (userOperation.type === 'insertion') {
            const effectSequence: TSequenceElement[] = [];
            if (userOperation.index !== 0) {
                effectSequence.push(readResult[userOperation.index - 1]);
            }
            effectSequence.push(...userOperation.content);
            if (userOperation.index !== readResult.length) {
                effectSequence.push(readResult[userOperation.index]);
            }
            const insertionDoc: RgaCvrdtDocumentState<TSequenceElement, TSequenceElementIdentity> = {
                effectSequence,
                deleted: new Set<TSequenceElementIdentity>()
            };
            const insertedIdentities = new Set<TSequenceElementIdentity>(userOperation.content.map(this.sequenceElementType.identityForSequenceElementFunc));
            const mergedDoc = this.addTiebreakingSucceedingContentViaDocumentMerge(document, insertionDoc, insertedIdentities);
            return {
                type: 'insertion',
                document: mergedDoc,
                inserted: insertedIdentities
            };
        } else {
            const deletedIdentities =
                readResult.slice(userOperation.startIndex, userOperation.endIndex).map(this.sequenceElementType.identityForSequenceElementFunc);
            return {
                type: 'deletion',
                deleted: new Set<TSequenceElementIdentity>(deletedIdentities)
            }
        }
    }

    // supplement a document with additional content in the form of a document, where all new content which is distict
    // from that already in the document succeeds that in the document in tiebreaking order
    private addTiebreakingSucceedingContentViaDocumentMerge(
        doc: RgaCvrdtDocumentState<TSequenceElement, TSequenceElementIdentity>,
        newContent: RgaCvrdtDocumentState<TSequenceElement, TSequenceElementIdentity>,
        insertedIdentities: Set<TSequenceElementIdentity>
    ) {
        const compareWithinSequence = (seqElId1: TSequenceElementIdentity, seqElId2: TSequenceElementIdentity, seq: TSequenceElement[]) => {
            const index1 = seq.findIndex((el) => this.sequenceElementType.identityForSequenceElementFunc(el) === seqElId1);
            const index2 = seq.findIndex((el) => this.sequenceElementType.identityForSequenceElementFunc(el) === seqElId2);
            if (index1 < 0 || index2 < 0) {
                throw new Error('unexpectedly failed to find identity in sequence');
            }
            return index1 - index2;
        }

        return mergeDocumentStates(doc, newContent, (seqEl1: TSequenceElement, seqEl2: TSequenceElement) => {
            const seqElId1 = this.sequenceElementType.identityForSequenceElementFunc(seqEl1);
            const seqElId2 = this.sequenceElementType.identityForSequenceElementFunc(seqEl2);
            if (seqElId1 === seqElId2) {
                return 0;
            } else if (insertedIdentities.has(seqElId1) && insertedIdentities.has(seqElId2)) {
                return compareWithinSequence(seqElId1, seqElId2, newContent.effectSequence);
            } else if (insertedIdentities.has(seqElId1)) {
                // seqEl1 comes later in causally consistent tiebreaking order, therefore
                // place it first in spatial order (this is consistent with rga)
                return -1;
            } else if (insertedIdentities.has(seqElId2)) {
                // and vice versa
                return 1;
            } else {
                return compareWithinSequence(seqElId1, seqElId2, doc.effectSequence);
            }
        })
    }

    public mergeFunc(ops: MergableOpRequest<RgaCvrdtOp<TSequenceElement, TSequenceElementIdentity>>[]): RgaCvrdtDocumentState<TSequenceElement, TSequenceElementIdentity> {
        let document = emptyDocument<TSequenceElement, TSequenceElementIdentity>();
        for(let mergableOp of ops) {
            const op = mergableOp.op;
            if (op.type === 'insertion') {
                document = this.addTiebreakingSucceedingContentViaDocumentMerge(document, op.document, op.inserted);
            } else {
                op.deleted.forEach((deletedId) => {
                    document.deleted.add(deletedId);
                });
            }
        }
        return document;
    }
}
