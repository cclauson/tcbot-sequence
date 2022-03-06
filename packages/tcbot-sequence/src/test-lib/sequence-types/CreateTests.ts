import { expect } from "chai";
import { InternalDocument, SequenceTypeImplementation, userDeletionOperation, userInsertOperation } from "./CoreTypes";
import { TestDocumentStateFactory } from "./TestDocumentState";

export function createTests<TOperation, TDocument extends InternalDocument<string, TDocument, TOperation, number>>(title: string, implementation: SequenceTypeImplementation<string, TOperation, number, TDocument>): void {
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
