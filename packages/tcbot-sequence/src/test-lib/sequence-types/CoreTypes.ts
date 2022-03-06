export interface SequenceElementType<TSequenceElement, TSequenceElementIdentity> {
    identityForSequenceElementFunc: (sequenceElement: TSequenceElement) => TSequenceElementIdentity,
    sequenceElementStringificationFunc: (sequenceElement: TSequenceElement) => string
}

export interface InternalDocument<TSequenceElement, TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument, TOperation, TOperationOrder>, TOperation, TOperationOrder> {
    read(): TSequenceElement[]
    equals(other: TInternalDocument): boolean
    applyOpWithOrder(operation: MergableOpRequest<TOperation>, order: TOperationOrder): TInternalDocument
}

export interface SequenceTypeImplementation<TSequenceElement, TOperation, TOperationOrder, TInternalDocument extends InternalDocument<TSequenceElement, TInternalDocument, TOperation, TOperationOrder>> {
    operationFromUserOpAppliedToDoc: (userOperation: UserOperation<TSequenceElement>, document: TInternalDocument, order: TOperationOrder) => TOperation,
    emptyDocument: () => TInternalDocument
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