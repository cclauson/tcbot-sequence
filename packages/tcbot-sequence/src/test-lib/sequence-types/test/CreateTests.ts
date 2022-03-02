import { expect } from "chai";
import { MergableOpRequest, SequenceTypeImplementation, userDeletionOperation, userInsertOperation, UserOperation } from "../CoreTypes";

export function createTests<TOperation, TDocument>(title: string, implementation: SequenceTypeImplementation<string, TOperation, TDocument>): void {
    const testDocumentStateFactory = new TestDocumentStateFactory(implementation);

    describe(title, () => {
        it('no ops results in empty sequence', () => {
            const emptyState = testDocumentStateFactory.emptyState();
            const emptyDocSequence = emptyState.read();
            expect(emptyDocSequence.length).equals(0);
        });
    
        it('insert two chars sequentially', () => {
            const emptyState = testDocumentStateFactory.emptyState();
            const stateWithA = emptyState.withUserOperation(userInsertOperation(['a'], 0), 0);
            expect(stateWithA.read().join('')).to.equal('a');
            const stateWithAB = stateWithA.withUserOperation(userInsertOperation(['b'], 1), 1);
            expect(stateWithAB.read().join('')).to.equal('ab');
        });
    
        it('insert two chars sequentially, the second (spatially) before the first', () => {
            const emptyState = testDocumentStateFactory.emptyState();
            const stateWithA = emptyState.withUserOperation(userInsertOperation(['a'], 0), 0);
            expect(stateWithA.read().join('')).to.equal('a');
            const stateWithAB = stateWithA.withUserOperation(userInsertOperation(['b'], 0), 1);
            expect(stateWithAB.read().join('')).to.equal('ba');
        });
    
        it('insert two chars concurrently', () => {
            const emptyState = testDocumentStateFactory.emptyState();
            const stateWithA = emptyState.withUserOperation(userInsertOperation(['a'], 0), 0);
            expect(stateWithA.read().join('')).to.equal('a');
            const stateWithB = emptyState.withUserOperation(userInsertOperation(['b'], 0), 1);
            expect(stateWithB.read().join('')).to.equal('b');
            const stateWithAB = stateWithA.mergeWith(stateWithB);
            expect(stateWithAB.read().join('')).to.equal('ba');
        });
    
        it('insertion followed by deletion', () => {
            const emptyState = testDocumentStateFactory.emptyState();
            const stateWithABC = emptyState.withUserOperation(userInsertOperation(['a', 'b', 'c'], 0), 0);
            expect(stateWithABC.read().join('')).to.equal('abc');
            const stateWithABCAndDelete = stateWithABC.withUserOperation(userDeletionOperation(1, 2), 1);
            expect(stateWithABCAndDelete.read().join('')).to.equal('ac');
        });
    
        it('insertion and deletion concurrent', () => {
            const emptyState = testDocumentStateFactory.emptyState();
            const stateWithABCD = emptyState.withUserOperation(userInsertOperation(['a', 'b', 'c', 'd'], 0), 0);
            expect(stateWithABCD.read().join('')).to.equal('abcd');
            const stateWithABCDAndDelete = stateWithABCD.withUserOperation(userDeletionOperation(1, 3), 1);
            expect(stateWithABCDAndDelete.read().join('')).to.equal('ad');
            const stateWithABCDAndInsertE = stateWithABCD.withUserOperation(userInsertOperation(['e'], 2), 2);
            expect(stateWithABCDAndInsertE.read().join('')).to.equal('abecd');
            const stateMerged = stateWithABCDAndDelete.mergeWith(stateWithABCDAndInsertE);
            expect(stateMerged.read().join('')).to.equal('aed');
        });
    
        it('false tie scenario', () => {
            const emptyState = testDocumentStateFactory.emptyState();
            const abcState = emptyState.withUserOperation(userInsertOperation(['a', 'b', 'c'], 0), 0);
            const deleteBState = abcState.withUserOperation(userDeletionOperation(1, 2), 1);
            expect(deleteBState.read().join('')).to.equal('ac');
            const insertYState = abcState.withUserOperation(userInsertOperation(['y'], 2), 2);
            expect(insertYState.read().join('')).to.equal('abyc');
            const insertXState = abcState.withUserOperation(userInsertOperation(['x'], 1), 3);
            expect(insertXState.read().join('')).to.equal('axbc');
            const mergedState1 = deleteBState.mergeWith(insertYState);
            expect(mergedState1.read().join('')).to.equal('ayc');
            const mergedStateFinal = mergedState1.mergeWith(insertXState);
            expect(mergedStateFinal.read().join('')).to.equal('axyc');
        });
    });    
}

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

class TestDocumentState<TSequenceElement, TOperation, TDocument> {
    public constructor(
        private readonly documentState: TDocument,
        private readonly operations: Map<number, MergableOpRequest<TOperation>>,
        private readonly implementation: SequenceTypeImplementation<TSequenceElement, TOperation, TDocument>) {}

    public withUserOperation(userOperation: UserOperation<TSequenceElement>, order: number): TestDocumentState<TSequenceElement, TOperation, TDocument> {
        const newOp = this.implementation.operationFromUserOpAppliedToDoc(userOperation, this.documentState);
        const causallyPrecedingOps = [...this.operations.values()].map((op) => op.op);
        const mergableOp = mergableOpFromOp(newOp, causallyPrecedingOps);
        const operationsNew = new Map<number, MergableOpRequest<TOperation>>(this.operations);
        if (operationsNew.has(order)) {
            throw new Error('invalid order, already present');
        }
        operationsNew.set(order, mergableOp);
        const operationsSorted = this.operationMapValuesSorted(operationsNew);
        const newDocumentState = this.implementation.mergeFunc(operationsSorted);
        return new TestDocumentState(newDocumentState, operationsNew, this.implementation);
    }

    private operationMapValuesSorted(operations: Map<number, MergableOpRequest<TOperation>>): MergableOpRequest<TOperation>[] {
        return [...operations.keys()].sort().map((i) => { 
            const val = operations.get(i);
            if (!val) {
                throw new Error("unexpectedly couldn't find key in map");
            }
            return val;
        });
    }

    public read(): TSequenceElement[] {
        return this.implementation.documentReadFunc(this.documentState);
    }

    public mergeWith(other: TestDocumentState<TSequenceElement, TOperation, TDocument>): TestDocumentState<TSequenceElement, TOperation, TDocument> {
        [...this.operations.keys()].forEach((order) => {
            if (other.operations.has(order)) {
                if (this.operations.get(order) !== other.operations.get(order)) {
                    throw new Error('failed during merge, order maps to different operations in two document states');
                }
            }
        });
        const newMap = new Map<number, MergableOpRequest<TOperation>>([...this.operations, ...other.operations]);
        const newDoc = this.implementation.mergeFunc(this.operationMapValuesSorted(newMap));
        return new TestDocumentState(newDoc, newMap, this.implementation);
    }
}

class TestDocumentStateFactory<TSequenceElement, TOperation, TDocument> {
    public constructor(private readonly implementation: SequenceTypeImplementation<TSequenceElement, TOperation, TDocument>) {}

    public emptyState(): TestDocumentState<TSequenceElement, TOperation, TDocument> {
        const emptyDoc = this.implementation.mergeFunc([]);
        return new TestDocumentState<TSequenceElement, TOperation, TDocument>(emptyDoc, new Map<number, MergableOpRequest<TOperation>>(), this.implementation);
    }
}
