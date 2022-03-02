import { expect } from "chai";
import { integerRangeable } from "../IntegerRangeable";
import { RangeableMap } from "../RangeMap";

describe('Range map', () => {
    it('Empty map has no values', () => {
        const map = new RangeableMap<number, string>(integerRangeable);
        expect(map.has(3)).to.be.false;
        expect([...map.iterateRanges()].length).to.equal(0);
    });

    it('adding a key-value pair allows it to be found later', () => {
        const map = new RangeableMap<number, string>(integerRangeable);
        const changed = map.set(3, 'foo');

        expect(changed).to.be.true;
        expect(map.has(3)).to.be.true;
 
        expect(map.has(2)).to.be.false;
        expect(map.has(4)).to.be.false;
        expect(map.has(12)).to.be.false;

        expect(map.get(3)).to.equal('foo');

        const ranges = [...map.iterateRanges()];
        expect(ranges.length).to.equal(1);
        const range = ranges[0];
        expect(range.lowestKey).to.equal(3);
        expect(range.highestKey).to.equal(3);
        expect(range.values.length).to.equal(1);
        expect(range.values[0]).to.equal('foo');
    });

    it('single range can be created and extended', () => {
        const map = new RangeableMap<number, string>(integerRangeable);

        let changed = map.set(3, 'foo');
        expect(changed).to.be.true;

        changed = map.set(4, 'bar');
        expect(changed).to.be.true;

        expect(map.has(3)).to.be.true;
        expect(map.has(4)).to.be.true;

        expect(map.has(2)).to.be.false;
        expect(map.has(5)).to.be.false;
        expect(map.has(11)).to.be.false;

        expect(map.get(3)).to.equal('foo');
        expect(map.get(4)).to.equal('bar');

        let ranges = [...map.iterateRanges()];
        expect(ranges.length).to.equal(1);
        let range = ranges[0];
        expect(range.lowestKey).to.equal(3);
        expect(range.highestKey).to.equal(4);
        expect(range.values.length).to.equal(2);
        expect(range.values[0]).to.equal('foo');
        expect(range.values[1]).to.equal('bar');

        changed = map.set(2, 'baz');
        expect(changed).to.be.true;

        expect(map.has(2)).to.be.true;
        expect(map.has(3)).to.be.true;
        expect(map.has(4)).to.be.true;

        expect(map.has(1)).to.be.false;
        expect(map.has(5)).to.be.false;
        expect(map.has(8)).to.be.false;

        expect(map.get(2)).to.equal('baz');
        expect(map.get(3)).to.equal('foo');
        expect(map.get(4)).to.equal('bar');

        ranges = [...map.iterateRanges()];
        expect(ranges.length).to.equal(1);
        range = ranges[0];
        expect(range.lowestKey).to.equal(2);
        expect(range.highestKey).to.equal(4);
        expect(range.values.length).to.equal(3);
        expect(range.values[0]).to.equal('baz');
        expect(range.values[1]).to.equal('foo');
        expect(range.values[2]).to.equal('bar');
    });

    it('two ranges can be created and extended', () => {
        const map = new RangeableMap<number, string>(integerRangeable);

        let changed = map.set(3, 'foo');
        expect(changed).to.be.true;

        changed = map.set(4, 'bar');
        expect(changed).to.be.true;

        changed = map.set(7, 'baz');
        expect(changed).to.be.true;
        expect(map.has(7)).to.be.true;
        expect(map.get(7)).to.equal('baz');

        expect(map.has(6)).to.be.false;
        expect(map.has(8)).to.be.false;

        changed = map.set(6, 'fooo');
        expect(changed).to.be.true;
        expect(map.has(6)).to.be.true;
        expect(map.get(6)).to.equal('fooo');

        expect(map.has(5)).to.be.false;
        expect(map.has(8)).to.be.false;

        const ranges = [...map.iterateRanges()];
        expect(ranges.length).to.equal(2);

        const range1 = ranges[0];
        expect(range1.lowestKey).to.equal(3);
        expect(range1.highestKey).to.equal(4);
        expect(range1.values.length).to.equal(2);
        expect(range1.values[0]).to.equal('foo');
        expect(range1.values[1]).to.equal('bar');

        const range2 = ranges[1];
        expect(range2.lowestKey).to.equal(6);
        expect(range2.highestKey).to.equal(7);
        expect(range2.values.length).to.equal(2);
        expect(range2.values[0]).to.equal('fooo');
        expect(range2.values[1]).to.equal('baz');
    });

    it('three ranges can be created and extended', () => {
        const map = new RangeableMap<number, string>(integerRangeable);

        map.set(0, 'a');
        map.set(4, 'd');
        map.set(8, 'g');

        map.set(1, 'b');
        map.set(5, 'e');
        map.set(9, 'h');

        map.set(2, 'c');
        map.set(6, 'f');
        map.set(10, 'i');

        expect(map.get(0)).to.equal('a');
        expect(map.get(1)).to.equal('b');
        expect(map.get(2)).to.equal('c');
        expect(map.get(3)).to.be.undefined;
        expect(map.get(4)).to.equal('d');
        expect(map.get(5)).to.equal('e');
        expect(map.get(6)).to.equal('f');
        expect(map.get(7)).to.be.undefined;
        expect(map.get(8)).to.equal('g');
        expect(map.get(9)).to.equal('h');
        expect(map.get(10)).to.equal('i');

        const ranges1 = [...map.iterateRanges()];
        expect(ranges1.length).to.equal(3);
        expect(ranges1[0].values.length).to.equal(3);
        expect(ranges1[0].values.join('')).to.equal('abc');
        expect(ranges1[1].values.length).to.equal(3);
        expect(ranges1[1].values.join('')).to.equal('def');
        expect(ranges1[2].values.length).to.equal(3);
        expect(ranges1[2].values.join('')).to.equal('ghi');

        map.set(3, 'z');

        const ranges2 = [...map.iterateRanges()];
        expect(ranges2.length).to.equal(2);
        expect(ranges2[0].values.length).to.equal(7);
        expect(ranges2[0].values.join('')).to.equal('abczdef');
        expect(ranges2[1].values.length).to.equal(3);
        expect(ranges2[1].values.join('')).to.equal('ghi');
    });

    it('adding values that cause no change results in set() returning false', () => {
        const map = new RangeableMap<number, string>(integerRangeable);

        let changed = map.set(3, 'foo');
        expect(map.has(3)).to.be.true;
        expect(map.get(3)).to.equal('foo');
        expect(changed).to.be.true;

        changed = map.set(3, 'foo');
        expect(map.has(3)).to.be.true;
        expect(map.get(3)).to.equal('foo');
        expect(changed).to.be.false;

        changed = map.set(4, 'bar');
        expect(map.has(4)).to.be.true;
        expect(map.get(4)).to.equal('bar');
        expect(changed).to.be.true;

        changed = map.set(4, 'bar');
        expect(map.has(4)).to.be.true;
        expect(map.get(4)).to.equal('bar');
        expect(changed).to.be.false;

        changed = map.set(6, 'baz');
        expect(map.has(6)).to.be.true;
        expect(map.get(6)).to.equal('baz');
        expect(changed).to.be.true;

        changed = map.set(6, 'baz');
        expect(map.has(6)).to.be.true;
        expect(map.get(6)).to.equal('baz');
        expect(changed).to.be.false;

        changed = map.set(4, 'bar');
        expect(map.has(4)).to.be.true;
        expect(map.get(4)).to.equal('bar');
        expect(changed).to.be.false;

        changed = map.set(3, 'foo');
        expect(map.has(3)).to.be.true;
        expect(map.get(3)).to.equal('foo');
        expect(changed).to.be.false;
    });

    it('deletion of single value after insert', () => {
        const map = new RangeableMap<number, string>(integerRangeable);

        map.set(3, 'foo');

        let deletionResult = map.delete(3);
        expect(deletionResult).to.equal('foo');

        expect(map.has(3)).to.be.false;

        deletionResult = map.delete(3);
        expect(deletionResult).to.be.undefined;

        expect([...map.iterateRanges()].length).to.equal(0);
    });

    it('deletion of various keys across three sequences', () => {
        const map = new RangeableMap<number, string>(integerRangeable);
        map.set(1, 'a');
        map.set(3, 'c');
        map.set(5, 'e');

        map.set(7, 'f');
        map.set(9, 'h');
        map.set(11, 'j');

        map.set(13, 'k');
        map.set(15, 'm');
        map.set(17, 'o');

        map.set(2, 'b');
        map.set(4, 'd');

        map.set(8, 'g');
        map.set(10, 'i');

        map.set(14, 'l');
        map.set(16, 'n');

        map.delete(1);
        map.delete(9);
        map.delete(17);

        expect([...map.iterateRanges()].length).to.equal(4);

        map.delete(3);
        map.delete(11);
        map.delete(13);

        expect([...map.iterateRanges()].length).to.equal(5);

        map.delete(5);
        map.delete(7);
        map.delete(15);

        expect([...map.iterateRanges()].length).to.equal(6);
    });
});