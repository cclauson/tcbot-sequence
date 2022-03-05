import { expect } from 'chai';
import { charSequence } from '../../sequence-types/CharSequence';
import { RgaCvrdtDoc } from '../RgaCvrdtDoc';
import { createCharacterComparatorFromOrder } from './CreateCharacterComparaterFromOrder';

describe('RgaCvrdt doc', () => {
    it('read document with no deleted content', () => {
        const document = new RgaCvrdtDoc<string, string>(
            ['a', 'b', 'c'],
            new Set<string>(),
            charSequence
        );
        const readResult = document.read();
        expect(readResult.join('')).equals('abc');
    });

    it('read document with all deleted content', () => {
        const document = new RgaCvrdtDoc<string, string>(
            ['a', 'b', 'c'],
            new Set<string>(['a', 'b', 'c']),
            charSequence
        );
        const readResult = document.read();
        expect(readResult.join('')).equals('');
    });

    it('read document with some deleted content', () => {
        const document = new RgaCvrdtDoc<string, string>(
            ['a', 'b', 'c'],
            new Set<string>(['b']),
            charSequence
        );
        const readResult = document.read();
        expect(readResult.join('')).equals('ac');
    });

    it('merge disjoint document states results as expected', () => {
        const document1 = new RgaCvrdtDoc<string, string>(
            ['a', 'b', 'c'],
            new Set<string>(['b']),
            charSequence
        );
        const document2 = new RgaCvrdtDoc<string, string>(
            ['x', 'y', 'z'],
            new Set<string>(['x', 'z']),
            charSequence
        );
        const comp = createCharacterComparatorFromOrder('abcxyz');
        const merged = document1.merge(document2, comp);
        expect(merged.getEffectSequence().join('')).equals('abcxyz');
        expect(merged.getDeleted().has('b'));
        expect(merged.getDeleted().has('x'));
        expect(merged.getDeleted().has('z'));
    });

    it('merge identical document states is idempotent', () => {
        const document = new RgaCvrdtDoc<string, string>(
            ['a', 'b', 'c'],
            new Set<string>(['b']),
            charSequence
        );
        const comp = createCharacterComparatorFromOrder('abc');
        const merged = document.merge(document, comp);
        expect(merged.getEffectSequence().join('')).equals('abc');
        expect(merged.getDeleted().has('b'));
    });

    it('merge false tie states is as expected', () => {
        const document1 = new RgaCvrdtDoc<string, string>(
            ['a', 'b', 'c'],
            new Set<string>(['b']),
            charSequence
        );
        const document2 = new RgaCvrdtDoc<string, string>(
            ['a', 'x', 'b', 'c'],
            new Set<string>(),
            charSequence
        );
        const document3 = new RgaCvrdtDoc<string, string>(
            ['a', 'b', 'y', 'c'],
            new Set<string>(),
            charSequence
        );
        const comp = createCharacterComparatorFromOrder('yxabc');
        const merged1 = document1.merge(document2, comp);
        const merged = merged1.merge(document3, comp);
        expect(merged.read().join('')).equals('axyc');
    });
});
