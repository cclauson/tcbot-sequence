import { expect } from "chai";
import { Digraph } from "../Digraph";

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
});
