import { expect } from "chai";
import { Random } from "../../random/Random";
import { Digraph, randomMinimumDigraphFromSequence } from "../Digraph";

const testSeed = '{"i":0,"j":79,"S":[26,100,180,205,208,37,207,128,120,154,227,230,38,116,118,79,105,90,247,67,12,143,150,191,28,138,241,220,172,178,114,121,171,34,64,76,168,21,3,221,183,209,198,106,57,35,253,187,226,18,223,56,204,156,122,137,117,140,84,151,186,185,210,192,88,148,182,86,234,147,51,200,159,0,104,96,174,244,211,27,7,197,72,24,45,248,25,163,153,246,54,173,47,62,11,6,135,59,133,32,202,250,14,193,255,157,20,78,112,61,124,162,77,175,195,2,206,145,99,201,46,251,63,219,41,36,190,125,29,98,215,80,33,179,252,243,127,240,60,93,19,5,217,155,31,123,92,134,242,165,13,158,136,75,94,233,224,30,83,9,141,164,113,235,212,161,91,50,52,119,81,245,66,82,169,218,254,167,144,43,199,73,238,17,95,139,181,177,15,44,107,110,222,16,108,89,170,115,101,126,203,237,130,109,196,142,132,160,71,68,10,189,225,213,49,69,53,214,8,184,40,74,188,42,111,48,131,236,85,65,22,97,152,232,194,176,87,70,1,102,55,4,23,103,39,58,129,231,216,166,146,228,249,239,229,149]}';

describe('Digraph', () => {
    it('Nodes in linear digraph have expected immediate successors/predecessors', () => {
        const digraph = new Digraph<string>();
        digraph.addNode('a');
        digraph.addNode('b');
        digraph.addNode('c');
        digraph.addEdge('a', 'b');
        digraph.addEdge('b', 'c');

        const aSuccessors = digraph.getImmedateSuccessorNodes('a');
        expect(aSuccessors.size).equals(1);
        expect(aSuccessors.has('b'));
        const bSuccessors = digraph.getImmedateSuccessorNodes('b');
        expect(bSuccessors.size).equals(1);
        expect(bSuccessors.has('c'));
        const cSuccessors = digraph.getImmedateSuccessorNodes('c');
        expect(cSuccessors.size).equals(0);

        const aPredecessors = digraph.getImmedatePredecessorNodes('a');
        expect(aPredecessors.size).equals(0);
        const bPredecessors = digraph.getImmedatePredecessorNodes('b');
        expect(bPredecessors.size).equals(1);
        expect(bPredecessors.has('a'));
        const cPredecessors = digraph.getImmedatePredecessorNodes('c');
        expect(cPredecessors.size).equals(1);
        expect(cPredecessors.has('b'));
    });

    it('Nodes in linear digraph have expected successor/predecessor iterations', () => {
        const digraph = new Digraph<string>();
        digraph.addNode('a');
        digraph.addNode('b');
        digraph.addNode('c');
        digraph.addEdge('a', 'b');
        digraph.addEdge('b', 'c');

        const aSuccessors = new Set<string>([...digraph.iterateSuccessors('a')]);
        expect(aSuccessors.size).equals(2);
        expect(aSuccessors.has('b'));
        expect(aSuccessors.has('c'));
        const bSuccessors = new Set<string>([...digraph.iterateSuccessors('b')]);
        expect(bSuccessors.size).equals(1);
        expect(bSuccessors.has('c'));
        const cSuccessors = new Set<string>([...digraph.iterateSuccessors('c')]);
        expect(cSuccessors.size).equals(0);

        const aPredecessors = new Set<string>([...digraph.iteratePredecessors('a')]);
        expect(aPredecessors.size).equals(0);
        const bPredecessors = new Set<string>([...digraph.iteratePredecessors('b')]);
        expect(bPredecessors.size).equals(1);
        expect(bPredecessors.has('a'));
        const cPredecessors = new Set<string>([...digraph.iteratePredecessors('c')]);
        expect(cPredecessors.size).equals(2);
        expect(bPredecessors.has('a'));
        expect(cPredecessors.has('b'));
    });

    it('Nodes in diamond digraph have expected immediate successors/predecessors', () => {
        const digraph = new Digraph<string>();
        digraph.addNode('a');
        digraph.addNode('b');
        digraph.addNode('c');
        digraph.addNode('d');
        digraph.addEdge('a', 'b');
        digraph.addEdge('a', 'c');
        digraph.addEdge('b', 'd');
        digraph.addEdge('c', 'd');

        const aSuccessors = digraph.getImmedateSuccessorNodes('a');
        expect(aSuccessors.size).equals(2);
        expect(aSuccessors.has('b'));
        expect(aSuccessors.has('c'));
        const bSuccessors = digraph.getImmedateSuccessorNodes('b');
        expect(bSuccessors.size).equals(1);
        expect(bSuccessors.has('d'));
        const cSuccessors = digraph.getImmedateSuccessorNodes('c');
        expect(cSuccessors.size).equals(1);
        expect(cSuccessors.has('d'));
        const dSuccessors = digraph.getImmedateSuccessorNodes('d');
        expect(dSuccessors.size).equals(0);

        const aPredecessors = digraph.getImmedatePredecessorNodes('a');
        expect(aPredecessors.size).equals(0);
        const bPredecessors = digraph.getImmedatePredecessorNodes('b');
        expect(bPredecessors.size).equals(1);
        expect(bPredecessors.has('a'));
        const cPredecessors = digraph.getImmedatePredecessorNodes('c');
        expect(cPredecessors.size).equals(1);
        expect(cPredecessors.has('a'));
        const dPredecessors = digraph.getImmedatePredecessorNodes('d');
        expect(dPredecessors.size).equals(2);
        expect(dPredecessors.has('b'));
        expect(dPredecessors.has('c'));
    });

    it('Nodes in diamond digraph have expected successor/predecessor iterations', () => {
        const digraph = new Digraph<string>();
        digraph.addNode('a');
        digraph.addNode('b');
        digraph.addNode('c');
        digraph.addNode('d');
        digraph.addEdge('a', 'b');
        digraph.addEdge('a', 'c');
        digraph.addEdge('b', 'd');
        digraph.addEdge('c', 'd');

        const aSuccessors = new Set<string>([...digraph.iterateSuccessors('a')]);
        expect(aSuccessors.size).equals(3);
        expect(aSuccessors.has('b'));
        expect(aSuccessors.has('c'));
        expect(aSuccessors.has('d'));
        const bSuccessors = new Set<string>([...digraph.iterateSuccessors('b')]);
        expect(bSuccessors.size).equals(1);
        expect(bSuccessors.has('d'));
        const cSuccessors = new Set<string>([...digraph.iterateSuccessors('c')]);
        expect(cSuccessors.size).equals(1);
        expect(cSuccessors.has('d'));
        const dSuccessors = new Set<string>([...digraph.iterateSuccessors('d')]);
        expect(dSuccessors.size).equals(0);

        const aPredecessors = new Set<string>([...digraph.iteratePredecessors('a')]);
        expect(aPredecessors.size).equals(0);
        const bPredecessors = new Set<string>([...digraph.iteratePredecessors('b')]);
        expect(bPredecessors.size).equals(1);
        expect(bPredecessors.has('a'));
        const cPredecessors = new Set<string>([...digraph.iteratePredecessors('c')]);
        expect(cPredecessors.size).equals(1);
        expect(cPredecessors.has('a'));
        const dPredecessors = new Set<string>([...digraph.iteratePredecessors('d')]);
        expect(dPredecessors.size).equals(3);
        expect(dPredecessors.has('a'));
        expect(dPredecessors.has('b'));
        expect(dPredecessors.has('c'));
    });

    it('nodes in graph with cycle have expected successors/predecessors', () => {
        const digraph = new Digraph<string>();
        digraph.addNode('a');
        digraph.addNode('b');
        digraph.addEdge('a', 'b');
        digraph.addEdge('b', 'b');

        const aImmediatePredecessors = digraph.getImmedatePredecessorNodes('a');
        expect(aImmediatePredecessors.size).equals(0);
        const aImmediateSuccessors = digraph.getImmedateSuccessorNodes('a');
        expect(aImmediateSuccessors.size).equals(1);
        expect(aImmediateSuccessors.has('b'));

        const bImmediatePredecessors = digraph.getImmedatePredecessorNodes('b');
        expect(bImmediatePredecessors.size).equals(2);
        expect(bImmediatePredecessors.has('a'));
        expect(bImmediatePredecessors.has('b'));
        const bImmediateSuccessors = digraph.getImmedateSuccessorNodes('b');
        expect(bImmediateSuccessors.size).equals(1);
        expect(bImmediateSuccessors.has('b'));

        const aPredecessorIteration = new Set<string>([...digraph.iteratePredecessors('a')]);
        expect(aPredecessorIteration.size).equals(0);
        const aSuccessorIteration = new Set<string>([...digraph.iterateSuccessors('a')]);
        expect(aSuccessorIteration.size).equals(1);
        expect(aSuccessorIteration.has('b'));

        const bPredecessorIteration = new Set<string>([...digraph.iteratePredecessors('b')]);
        expect(bPredecessorIteration.size).equals(1);
        expect(bPredecessorIteration.has('a'));
        const bSuccessorIteration = new Set<string>([...digraph.iterateSuccessors('b')]);
        expect(bSuccessorIteration.size).equals(0);
    });

    it('transitive reduce with three node graph', () => {
        const digraph = new Digraph();
        digraph.addNode('a');
        digraph.addNode('b');
        digraph.addNode('c');
        digraph.addEdge('a', 'b');
        digraph.addEdge('b', 'c');
        digraph.addEdge('a', 'c');

        digraph.transitiveReduce();

        expect(digraph.hasEdge('a', 'b'));
        expect(digraph.hasEdge('b', 'c'));
        expect(digraph.hasEdge('a', 'c')).to.be.false;
    });

    it('transitive reduce with more complicated graph', () => {
        const digraph = new Digraph();
        digraph.addNode('a');
        digraph.addNode('b');
        digraph.addNode('c');
        digraph.addNode('d');
        digraph.addNode('e');
        digraph.addEdge('a', 'b');
        digraph.addEdge('b', 'c');
        digraph.addEdge('a', 'c');
        digraph.addEdge('c', 'd');
        digraph.addEdge('a', 'd');
        digraph.addEdge('c', 'e');

        digraph.transitiveReduce();

        expect(digraph.hasEdge('a', 'b'));
        expect(digraph.hasEdge('b', 'c'));
        expect(digraph.hasEdge('c', 'd'));
        expect(digraph.hasEdge('c', 'e'));
        expect(digraph.hasEdge('a', 'c')).to.be.false;
        expect(digraph.hasEdge('a', 'd')).to.be.false;
    });

    it('random minimal digraphs can be created, have orders consistent with provided sequence', () => {
        const intSequence = [];
        for (let i = 0; i < 20; ++i) {
            intSequence.push(i);
        }
        const random = new Random(testSeed);

        for (let n = 0; n < 10; ++n) {
            const digraph = randomMinimumDigraphFromSequence(intSequence, random);
            for (let i of intSequence) {
                for (let j of digraph.iterateSuccessors(i)) {
                    expect(i).to.be.lessThan(j);
                }
            }
        }
    });
});
