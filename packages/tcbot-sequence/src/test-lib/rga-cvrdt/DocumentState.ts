import { mergeEffectSequence } from "./MergeEffectSequence";

/**
 * Represents the state of the document.
 * 
 * TSequenceElement is the type of the element in the sequence.
 * TSequenceElementIdentity is the type describing an identity of
 * an element in the sequence.  This can be idnetical to TSequenceElement,
 * but could also be something unique to the sequence element, e.g., a GUID
 * associated with each sequence element.
 */
export interface DocumentState<TSequenceElement, TSequenceElementIdentity> {
    // all content that has ever been in the document, including possibly
    // deleted content
    effectSequence: TSequenceElement[];
    // deleted content
    deleted: Set<TSequenceElementIdentity>;
}

/**
 * Returns the concrete sequence represented by this document state.
 * In practice, just by removing tombstones.
 * 
 * @param documentState 
 * 
 * @param identityOfFn 
 * @returns 
 */
export function readDocumentState<TSequenceElement, TSequenceElementIdentity>(
    documentState: DocumentState<TSequenceElement, TSequenceElementIdentity>,
    identityOfFn: (sequenceElement: TSequenceElement) => TSequenceElementIdentity
): TSequenceElement[] {
    const outputBuffer: TSequenceElement[] = [];
    documentState.effectSequence.forEach((sequenceElement) => {
        if (!documentState.deleted.has(identityOfFn(sequenceElement))) {
            outputBuffer.push(sequenceElement);
        }
    })
    return outputBuffer;
}

export function mergeDocumentStates<TSequenceElement, TSequenceElementIdentity>(
    documentState1: DocumentState<TSequenceElement, TSequenceElementIdentity>,
    documentState2: DocumentState<TSequenceElement, TSequenceElementIdentity>,
    comp: (sequenceElement1: TSequenceElement, sequenceElement2: TSequenceElement) => number
): DocumentState<TSequenceElement, TSequenceElementIdentity> {
    return {
        effectSequence: mergeEffectSequence(documentState1.effectSequence, documentState2.effectSequence, comp),
        deleted: new Set([...documentState1.deleted, ...documentState2.deleted])
    };
}

const emptyDocumentI = {
    effectSequence: [],
    deleted: new Set()
};

export function emptyDocument<TSequenceElement, TSequenceElementIdentity>(): DocumentState<TSequenceElement, TSequenceElementIdentity> {
    return emptyDocumentI as DocumentState<TSequenceElement, TSequenceElementIdentity>;
};
