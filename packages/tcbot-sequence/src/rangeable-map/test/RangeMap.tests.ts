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
});