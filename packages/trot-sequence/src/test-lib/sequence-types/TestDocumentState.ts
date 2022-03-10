import { InternalDocument, MergableOpRequest, SequenceTypeImplementation, UserOperation } from "./CoreTypes";

class TestMergableOpRequest<TOperation> implements MergableOpRequest<TOperation> {
    public readonly op: TOperation;
    private readonly causallyPreceding: Set<TOperation>;

    public constructor(op: TOperation, causallyPreceding: Set<TOperation>) {
        this.op = op;
        this.causallyPreceding = causallyPreceding;
    }

    public causallyPrecedes(otherOpReq: MergableOpRequest<TOperation>): boolean {
        const other = otherOpReq as TestMergableOpRequest<TOperation>;
        return other.causallyPreceding.has(this.op);
    }
}

function mergableOpFromOp<TOperation>(op: TOperation, causallyPreceding?: Iterable<TOperation>): MergableOpRequest<TOperation> {
    return new TestMergableOpRequest(op, causallyPreceding ? new Set<TOperation>(causallyPreceding) : new Set<TOperation>());
}

export class TestDocumentState<TSequenceElement, TOperation, TDocument extends InternalDocument<TSequenceElement, TDocument, TOperation, number>> {
    public constructor(
        public readonly documentState: TDocument,
        private readonly operations: Map<number, MergableOpRequest<TOperation>>,
        private readonly implementation: SequenceTypeImplementation<TSequenceElement, TOperation, number, TDocument>) {}

    public withUserOperation(userOperation: UserOperation<TSequenceElement>, order: number): TestDocumentState<TSequenceElement, TOperation, TDocument> {
        const newOp = this.implementation.operationFromUserOpAppliedToDoc(userOperation, this.documentState, order);
        const causallyPrecedingOps = [...this.operations.values()].map((op) => op.op);
        const mergableOp = mergableOpFromOp(newOp, causallyPrecedingOps);
        const operationsNew = new Map<number, MergableOpRequest<TOperation>>(this.operations);
        if (operationsNew.has(order)) {
            throw new Error('invalid order, already present');
        }
        operationsNew.set(order, mergableOp);
        const newDocumentState = this.documentState.clone();
        newDocumentState.applyOpWithOrder(mergableOp, order);
        return new TestDocumentState<TSequenceElement, TOperation, TDocument>(newDocumentState, operationsNew, this.implementation);
    }

    public read(): TSequenceElement[] {
        return this.documentState.read();
    }

    private updateDocumentWithOperationsNotIn(
        document: TDocument,
        operations: Map<number, MergableOpRequest<TOperation>>,
        operationsAlreadyInDoc: Map<number, MergableOpRequest<TOperation>>
    ): void {
        [...operations.keys()].sort((a, b) => a - b).forEach((order) => {
            const operation = operations.get(order);
            if (!operation) {
                throw new Error("Unexpectedly couldn't find operation in map");
            }
            if (operationsAlreadyInDoc.has(order)) {
                if (operation !== operationsAlreadyInDoc.get(order)) {
                    throw new Error('failed during merge, order maps to different operations in two document states');
                }
            } else {
                document.applyOpWithOrder(operation, order);
            }
        });
    }

    public mergeWith(other: TestDocumentState<TSequenceElement, TOperation, TDocument>): TestDocumentState<TSequenceElement, TOperation, TDocument> {
        const thisDocUpdated = this.documentState.clone();
        const otherDocUpdated = other.documentState.clone();
        this.updateDocumentWithOperationsNotIn(thisDocUpdated, other.operations, this.operations);
        this.updateDocumentWithOperationsNotIn(otherDocUpdated, this.operations, other.operations);
        if (!thisDocUpdated.equals(otherDocUpdated)) {
            throw new Error('Convergence failure detected, documents at different sites are not equal');
        }
        const newMap = new Map<number, MergableOpRequest<TOperation>>([...this.operations, ...other.operations]);
        return new TestDocumentState(thisDocUpdated, newMap, this.implementation);
    }

    public getSequenceNumbers(): number[] {
        return [...this.operations.keys()].sort((a, b) => a - b);
    }
}

export class TestDocumentStateFactory<TSequenceElement, TOperation, TDocument extends InternalDocument<TSequenceElement, TDocument, TOperation, number>> {
    public constructor(private readonly implementation: SequenceTypeImplementation<TSequenceElement, TOperation, number, TDocument>) {}

    public emptyState(): TestDocumentState<TSequenceElement, TOperation, TDocument> {
        const emptyDoc = this.implementation.emptyDocument();;
        return new TestDocumentState<TSequenceElement, TOperation, TDocument>(emptyDoc, new Map<number, MergableOpRequest<TOperation>>(), this.implementation);
    }
}
