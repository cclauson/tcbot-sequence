import { expect } from "chai";
import { mergeEffectSequence } from "../MergeEffectSequence";
import { createCharacterComparatorFromOrder } from "./CreateCharacterComparaterFromOrder";

describe('merge effect sequence', () => {
    it('merges disjoint sequences according to expected order, two sequences', () => {
        const comp = createCharacterComparatorFromOrder('ab');
        const result = mergeEffectSequence<string>(['a'], ['b'], comp);
        expect(result.join('')).equals('ab');
    });

    it('merges disjoint sequences according to expected order, three sequences', () => {
        const comp = createCharacterComparatorFromOrder('abc');
        const result1 = mergeEffectSequence<string>(['a'], ['b'], comp);
        const result = mergeEffectSequence<string>(result1, ['c'], comp);
        expect(result.join('')).equals('abc');
    });

    it('merging identical sequences is idempotent', () => {
        const comp = createCharacterComparatorFromOrder('bca');
        const sequence = ['a', 'b', 'c'];
        const result = mergeEffectSequence<string>(sequence, sequence, comp);
        expect(result.join('')).equals(sequence.join(''));
    });

    it('merges sequences with common elements and tie as expected', () => {
        const comp = createCharacterComparatorFromOrder('baxy');
        const seq1 = ['a', 'x', 'b'];
        const seq2 = ['a', 'y', 'b'];
        const result = mergeEffectSequence<string>(seq1, seq2, comp);
        expect(result.join('')).equals('axyb');
    });

    it('merges sequences from false tie as expected', () => {
        const comp = createCharacterComparatorFromOrder('bcxay');
        const seq1 = ['a', 'b', 'c'];
        const seq2 = ['a', 'x', 'b', 'c'];
        const seq3 = ['a', 'b', 'y', 'c'];
        const result1 = mergeEffectSequence<string>(seq1, seq2, comp);
        const result = mergeEffectSequence<string>(result1, seq3, comp);
        expect(result.join('')).equals('axbyc');
    });
});