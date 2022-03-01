export interface SequenceElementType<TSequenceElement, TSequenceElementIdentity> {
    identityForSequenceElementFunc: (sequenceElement: TSequenceElement) => TSequenceElementIdentity,
    sequenceElementStringificationFunc: (sequenceElement: TSequenceElement) => string
}

export interface InternalDocument<TSequenceElement, TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument>> {
    // TODO: Uncomment, implement
    // read(): TSequenceElement[]
    // equals(other: TInternalDocument): boolean
}

export interface SequenceTypeImplementation<TSequenceElement, TOperation, TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument>> {
    documentReadFunc: (document: TInternalDocument) => TSequenceElement[],
    operationFromUserOpAppliedToDoc: (userOperation: UserOperation<TSequenceElement>, document: TInternalDocument) => TOperation,
    mergeFunc: (ops: MergableOpRequest<TOperation>[]) => TInternalDocument
}

export interface MergableOpRequest<TOperation> {
    op: TOperation,
    causallyPrecedes(otherOpReq: MergableOpRequest<TOperation>): boolean;
}

export interface UserInsertOperation<TSequenceElement> {
    type: 'insertion'
    content: TSequenceElement[],
    index: number
}

export interface UserDeletionOperation {
    type: 'deletion',
    startIndex: number,
    endIndex: number
}

export type UserOperation<TSequenceElement> = UserInsertOperation<TSequenceElement> | UserDeletionOperation;

export function userInsertOperation<TSequenceElement>(content: TSequenceElement[], index: number): UserOperation<TSequenceElement> {
    return {
        type: 'insertion',
        content,
        index
    };
};

export function userDeletionOperation<TSequenceElement>(startIndex: number, endIndex: number): UserOperation<TSequenceElement> {
    return {
        type: 'deletion',
        startIndex,
        endIndex
    };
};