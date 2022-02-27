export class Digraph<TNode> {
    private readonly nodes: Set<TNode>;
    private forwardEdges: Map<TNode, Set<TNode>>;
    private reverseEdges: Map<TNode, Set<TNode>>;

    public constructor() {
        this.nodes = new Set<TNode>();
        this.forwardEdges = new Map<TNode, Set<TNode>>();
        this.reverseEdges = new Map<TNode, Set<TNode>>();
    }

    public addNode(node: TNode): void {
        this.nodes.add(node);
    }

    private validateSrcDestArgs(src: TNode, dest: TNode): void {
        if (!this.nodes.has(src)) {
            throw new Error("can't create edge, src node not in graph");
        }
        if (!this.nodes.has(dest)) {
            throw new Error("can't create edge, dest node not in graph");
        }
    }

    public addEdge(src: TNode, dest: TNode): void {
        this.validateSrcDestArgs(src, dest);
        if (!this.forwardEdges.has(src)) {
            this.forwardEdges.set(src, new Set<TNode>());
        }
        const forwardEdges = this.forwardEdges.get(src);
        if (!forwardEdges) {
            throw new Error('forward edges for src unexpectedly undefined');
        }
        forwardEdges.add(dest);
        if (!this.reverseEdges.has(dest)) {
            this.reverseEdges.set(dest, new Set<TNode>());
        }
        const reverseEdges = this.reverseEdges.get(dest);
        if (!reverseEdges) {
            throw new Error('reverse edges for dst unexpectedly undefined');
        }
        reverseEdges.add(src);
    }

    public removeEdge(src: TNode, dest: TNode): void {
        this.validateSrcDestArgs(src, dest);
        const forwardEdges = this.forwardEdges.get(src);
        if (forwardEdges) {
            forwardEdges.delete(dest);
            if (forwardEdges.size === 0) {
                this.forwardEdges.delete(src);
            }
        }
        const reverseEdges = this.reverseEdges.get(dest);
        if (reverseEdges) {
            reverseEdges.delete(src);
            if (reverseEdges.size === 0) {
                this.reverseEdges.delete(dest);
            }
        }
    }

    private *iterateEdges(node: TNode, edgeSet: Map<TNode, Set<TNode>>): Iterable<TNode> {
        const visited = new Set<TNode>();
        // count node as visited, so we don't return it in iteration
        visited.add(node);
        const toVisit: TNode[] = [];
        const pushUnvisitedImmediateSuccessorNodesToVisit = (node: TNode) => {
            const immediateSuccessors = edgeSet.get(node);
            if (immediateSuccessors) {
                immediateSuccessors.forEach((successor) => {
                    if (!visited.has(successor)) {
                        toVisit.push(successor);
                        visited.add(successor);
                    }
                });
            }
        };
        pushUnvisitedImmediateSuccessorNodesToVisit(node);
        while (toVisit.length !== 0) {
            const current = toVisit.pop();
            if (!current) {
                throw new Error('current unexpectedly undefined');
            }
            pushUnvisitedImmediateSuccessorNodesToVisit(current);
            yield current;
        }
    }

    public iterateSuccessors(node: TNode): Iterable<TNode> {
        return this.iterateEdges(node, this.forwardEdges);
    }

    public iteratePredecessors(node: TNode): Iterable<TNode> {
        return this.iterateEdges(node, this.reverseEdges);
    }

    public getImmedateSuccessorNodes(node: TNode): Set<TNode> {
        const immediateSuccessors = this.forwardEdges.get(node);
        return immediateSuccessors ? new Set<TNode>(immediateSuccessors) : new Set<TNode>();
    }

    public getImmedatePredecessorNodes(node: TNode): Set<TNode> {
        const immediatePredecessors = this.reverseEdges.get(node);
        return immediatePredecessors ? new Set<TNode>(immediatePredecessors) : new Set<TNode>();
    }

    public hasEdge(src: TNode, dest: TNode) {
        this.validateSrcDestArgs(src, dest);
        const hasForward = this.forwardEdges.get(src)?.has(dest) ?? false;
        const hasReverse = this.reverseEdges.get(dest)?.has(src) ?? false;
        if (hasForward && !hasReverse) {
            throw new Error('digraph invariant violated: edge tracked in forward direction, but not reverse');
        }
        if (!hasForward && hasReverse) {
            throw new Error('digraph invariant violated: edge tracked in reverse direction, but not forward');
        }
        return hasForward;
    }

    // NOTE: This method should only be used with DAGs
    // TODO: Assert this
    public transitiveReduce(): void {
        for (let node of this.nodes) {
            const immediateSuccessors = this.getImmedateSuccessorNodes(node);
            const immediateSuccessorsToRemove = new Set<TNode>();
            for (let immediateSuccessor of immediateSuccessors) {
                for (let transitiveSuccessor of this.iterateSuccessors(immediateSuccessor)) {
                    if (immediateSuccessors.has(transitiveSuccessor)) {
                        immediateSuccessorsToRemove.add(transitiveSuccessor);
                    }
                }
            }
            for (let immediateSuccessorToRemove of immediateSuccessorsToRemove) {
                this.removeEdge(node, immediateSuccessorToRemove);
            }
        }
    }
}
