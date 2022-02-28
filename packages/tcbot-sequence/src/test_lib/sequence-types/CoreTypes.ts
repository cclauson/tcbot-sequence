export interface SequenceElementType<TSequenceElement, TSequenceElementIdentity> {
    identityForSequenceElementFunc: (sequenceElement: TSequenceElement) => TSequenceElementIdentity,
    sequenceElementStringificationFunc: (sequenceElement: TSequenceElement) => string
}

export interface SequenceTypeImplementation<TSequenceElement, TOperation, TDocument> {
    documentReadFunc: (document: TDocument) => TSequenceElement[],
    operationFromUserOpAppliedToDoc: (userOperation: UserOperation<TSequenceElement>, document: TDocument) => TOperation,
    mergeFunc: (ops: MergableOpRequest<TOperation>[]) => TDocument
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