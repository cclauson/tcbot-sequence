import { expect } from "chai";
import { DocumentState } from "../../rga-cvrdt/DocumentState";
import { CharSequence } from "../CharSequence";
import { MergableOpRequest, userDeletionOperation, userInsertOperation, UserOperation } from "../CoreTypes";
import { RgaCvrdt, RgaCvrdtOp } from "../RgaCvrdt";

const rgaCvrdt = new RgaCvrdt(CharSequence);

class TestMergableOpRequest implements MergableOpRequest<RgaCvrdtOp<string, string>> {
    public readonly op: RgaCvrdtOp<string, string>;
    private readonly causallyPreceding: Set<RgaCvrdtOp<string, string>>;

    public constructor(op: RgaCvrdtOp<string, string>, causallyPreceding: Set<RgaCvrdtOp<string, string>>) {
        this.op = op;
        this.causallyPreceding = causallyPreceding;
    }

    public causallyPrecedes(otherOpReq: MergableOpRequest<RgaCvrdtOp<string, string>>): boolean {
        const other = otherOpReq as TestMergableOpRequest;
        return other.causallyPreceding.has(this.op);
    }
}

function mergableOpFromOp(op: RgaCvrdtOp<string, string>, causallyPreceding?: Iterable<RgaCvrdtOp<string, string>>): MergableOpRequest<RgaCvrdtOp<string, string>> {
    return new TestMergableOpRequest(op, causallyPreceding ? new Set<RgaCvrdtOp<string, string>>(causallyPreceding) : new Set<RgaCvrdtOp<string, string>>());
}

class TestDocumentState {
    public constructor(
        private readonly documentState: DocumentState<string, string>,
        private readonly operations: Map<number, MergableOpRequest<RgaCvrdtOp<string, string>>>,
        private readonly rgaCvrdt: RgaCvrdt<string, string>) {}

    public withUserOperation(userOperation: UserOperation<string>, order: number): TestDocumentState {
        const newOp = this.rgaCvrdt.operationFromUserOpAppliedToDoc(userOperation, this.documentState);
        const causallyPrecedingOps = [...this.operations.values()].map((op) => op.op);
        const mergableOp = mergableOpFromOp(newOp, causallyPrecedingOps);
        const operationsNew = new Map<number, MergableOpRequest<RgaCvrdtOp<string, string>>>(this.operations);
        if (operationsNew.has(order)) {
            throw new Error('invalid order, already present');
        }
        operationsNew.set(order, mergableOp);
        const operationsSorted = this.operationMapValuesSorted(operationsNew);
        const newDocumentState = this.rgaCvrdt.mergeFunc(operationsSorted);
        return new TestDocumentState(newDocumentState, operationsNew, this.rgaCvrdt);
    }

    private operationMapValuesSorted(operations: Map<number, MergableOpRequest<RgaCvrdtOp<string, string>>>): MergableOpRequest<RgaCvrdtOp<string, string>>[] {
        return [...operations.keys()].sort().map((i) => { 
            const val = operations.get(i);
            if (!val) {
                throw new Error("unexpectedly couldn't find key in map");
            }
            return val;
        });
    }

    public read(): string[] {
        return this.rgaCvrdt.documentReadFunc(this.documentState);
    }

    public mergeWith(other: TestDocumentState): TestDocumentState {
        [...this.operations.keys()].forEach((order) => {
            if (other.operations.has(order)) {
                if (this.operations.get(order) !== other.operations.get(order)) {
                    throw new Error('failed during merge, order maps to different operations in two document states');
                }
            }
        });
        const newMap = new Map<number, MergableOpRequest<RgaCvrdtOp<string, string>>>([...this.operations, ...other.operations]);
        const newDoc = this.rgaCvrdt.mergeFunc(this.operationMapValuesSorted(newMap));
        return new TestDocumentState(newDoc, newMap, this.rgaCvrdt);
    }
}

class TestDocumentStateFactory {
    public constructor(private readonly rgaCvrt: RgaCvrdt<string, string>) {}

    public emptyState(): TestDocumentState {
        const emptyDoc = rgaCvrdt.mergeFunc([]);
        return new TestDocumentState(emptyDoc, new Map<number, MergableOpRequest<RgaCvrdtOp<string, string>>>(), this.rgaCvrt);
    }
}

const testDocumentStateFactory = new TestDocumentStateFactory(rgaCvrdt);

describe('RGA CVRDT implementation', () => {
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
