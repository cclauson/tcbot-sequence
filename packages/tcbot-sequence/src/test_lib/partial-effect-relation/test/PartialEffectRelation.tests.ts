import { expect } from "chai";
import { PartialEffectRelation, SequenceLimit } from "../PartialEffectRelation";

function createNewStringPartialEffectRelation() {
    const id = (e: string) => e;
    return new PartialEffectRelation<string, string>(id, id);
}

describe('partial effect relation', () => {
    it('empty partial effect relation matches exactly empty sequence', () => {
        const relation = createNewStringPartialEffectRelation();
        expect(relation.verifySequence([]).type).to.equal('success');
        expect(relation.verifySequence(['a', 'b']).type).to.equal('failure');
    });

    it("two element partial effect relation with insertion matches expected strings, doesn't match others", () => {
        const relation = createNewStringPartialEffectRelation();
        relation.insertSubsequence(['a'], SequenceLimit.Begin, SequenceLimit.End);
        relation.insertSubsequence(['b'], 'a', SequenceLimit.End);

        expect(relation.verifySequence('ab'.split('')).type).to.equal('success');

        expect(relation.verifySequence('ba'.split('')).type).to.equal('failure');

        expect(relation.verifySequence('a'.split('')).type).to.equal('failure');
        expect(relation.verifySequence('b'.split('')).type).to.equal('failure');
    });

    it("three element partial effect relation with insertion matches expected strings, doesn't match others", () => {
        const relation = createNewStringPartialEffectRelation();
        relation.insertSubsequence(['a', 'c'], SequenceLimit.Begin, SequenceLimit.End);
        relation.insertSubsequence(['b'], 'a', 'c');

        expect(relation.verifySequence('abc'.split('')).type).to.equal('success');

        expect(relation.verifySequence('acb'.split('')).type).to.equal('failure');
        expect(relation.verifySequence('bac'.split('')).type).to.equal('failure');
        expect(relation.verifySequence('bca'.split('')).type).to.equal('failure');
        expect(relation.verifySequence('cab'.split('')).type).to.equal('failure');
        expect(relation.verifySequence('cba'.split('')).type).to.equal('failure');
    });

    it("diamond partial effect relation matches expected strings, doesn't match others", () => {
        const relation = createNewStringPartialEffectRelation();
        relation.insertSubsequence(['a', 'd'], SequenceLimit.Begin, SequenceLimit.End);
        relation.insertSubsequence(['b'], 'a', 'd');
        relation.insertSubsequence(['c'], 'a', 'd');
        expect(relation.verifySequence('abcd'.split('')).type).to.equal('success');
        expect(relation.verifySequence('acbd'.split('')).type).to.equal('success');

        expect(relation.verifySequence('acd'.split('')).type).to.equal('failure');
        expect(relation.verifySequence('abd'.split('')).type).to.equal('failure');

        expect(relation.verifySequence('ad'.split('')).type).to.equal('failure');

        expect(relation.verifySequence('bacd'.split('')).type).to.equal('failure');
        expect(relation.verifySequence('abdc'.split('')).type).to.equal('failure');

        expect(relation.verifySequence('abc'.split('')).type).to.equal('failure');
        expect(relation.verifySequence('cbd'.split('')).type).to.equal('failure');
    });

    it('three node insert, one deletion', () => {
        const relation = createNewStringPartialEffectRelation();
        relation.insertSubsequence(['a', 'b', 'c'], SequenceLimit.Begin, SequenceLimit.End);
        relation.deleteSequenceElements(['b']);

        expect(relation.verifySequence('ac'.split('')).type).to.equal('success');
        expect(relation.verifySequence('abc'.split('')).type).to.equal('failure');
    });

    it('delete subsequence from concurrently inserted content', () => {
        const relation = createNewStringPartialEffectRelation();
        relation.insertSubsequence('abcd'.split(''), SequenceLimit.Begin, SequenceLimit.End);
        relation.insertSubsequence('stuv'.split(''), 'b', 'c');
        relation.insertSubsequence('wxyz'.split(''), 'b', 'c');
        relation.deleteSequenceElements('stu'.split(''));
        relation.deleteSequenceElements('z'.split(''));

        expect(relation.verifySequence('abvwxycd'.split(''))).to.equal('success');
        expect(relation.verifySequence('abwvxycd'.split(''))).to.equal('success');
        expect(relation.verifySequence('abwxvycd'.split(''))).to.equal('success');
        expect(relation.verifySequence('abwxyvcd'.split(''))).to.equal('success');

        expect(relation.verifySequence('abvwxyc'.split(''))).to.equal('failure');
        expect(relation.verifySequence('abwxycd'.split(''))).to.equal('failure');
        expect(relation.verifySequence('avbwxycd'.split(''))).to.equal('failure');
        expect(relation.verifySequence('abwxycvd'.split(''))).to.equal('failure');
    });
});