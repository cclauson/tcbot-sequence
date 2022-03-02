import { expect } from 'chai';
import { DocumentState, mergeDocumentStates, readDocumentState } from '../DocumentState';
import { createCharacterComparatorFromOrder } from './CreateCharacterComparaterFromOrder';

describe('Document state', () => {
    it('read document with no deleted content', () => {
        const document: DocumentState<string, string> = {
            effectSequence: ['a', 'b', 'c'],
            deleted: new Set<string>()
        };
        const readResult = readDocumentState(document, (seqel) => seqel);
        expect(readResult.join('')).equals('abc');
    });

    it('read document with all deleted content', () => {
        const document: DocumentState<string, string> = {
            effectSequence: ['a', 'b', 'c'],
            deleted: new Set<string>(['a', 'b', 'c'])
        };
        const readResult = readDocumentState(document, (seqel) => seqel);
        expect(readResult.join('')).equals('');
    });

    it('read document with some deleted content', () => {
        const document: DocumentState<string, string> = {
            effectSequence: ['a', 'b', 'c'],
            deleted: new Set<string>('b')
        };
        const readResult = readDocumentState(document, (seqel) => seqel);
        expect(readResult.join('')).equals('ac');
    });

    it('merge disjoint document states results as expected', () => {
        const document1: DocumentState<string, string> = {
            effectSequence: ['a', 'b', 'c'],
            deleted: new Set<string>('b')
        };
        const document2: DocumentState<string, string> = {
            effectSequence: ['x', 'y', 'z'],
            deleted: new Set<string>(['x', 'z'])
        };
        const comp = createCharacterComparatorFromOrder('abcxyz');
        const merged = mergeDocumentStates(document1, document2, comp);
        expect(merged.effectSequence.join('')).equals('abcxyz');
        expect(merged.deleted.has('b'));
        expect(merged.deleted.has('x'));
        expect(merged.deleted.has('z'));
    });

    it('merge identical document states is idempotent', () => {
        const document: DocumentState<string, string> = {
            effectSequence: ['a', 'b', 'c'],
            deleted: new Set<string>('b')
        };
        const comp = createCharacterComparatorFromOrder('abc');
        const merged = mergeDocumentStates(document, document, comp);
        expect(merged.effectSequence.join('')).equals('abc');
        expect(merged.deleted.has('b'));
    });

    it('merge false tie states is as expected', () => {
        const document1: DocumentState<string, string> = {
            effectSequence: ['a', 'b', 'c'],
            deleted: new Set<string>('b')
        };

        const document2: DocumentState<string, string> = {
            effectSequence: ['a', 'x', 'b', 'c'],
            deleted: new Set<string>()
        };

        const document3: DocumentState<string, string> = {
            effectSequence: ['a', 'b', 'y', 'c'],
            deleted: new Set<string>()
        };
        const comp = createCharacterComparatorFromOrder('yxabc');
        const merged1 = mergeDocumentStates(document1, document2, comp);
        const merged = mergeDocumentStates(merged1, document3, comp);
        expect(readDocumentState(merged, (seqel) => seqel).join('')).equals('axyc');
    });
});
