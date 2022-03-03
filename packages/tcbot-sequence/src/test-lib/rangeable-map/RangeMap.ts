import { RangeableType } from "./Rangeable";

interface RangeableMapNodeBase<TKey> {
    lowest: TKey,
    highest: TKey,
}

interface RangeableMapBranchNode<TKey, TValue> extends RangeableMapNodeBase<TKey> {
    type: 'branch',
    leftChild: RangeableMapNode<TKey, TValue>,
    rightChild: RangeableMapNode<TKey, TValue>
}

interface RangeableMapLeafNode<TKey, TValue> extends RangeableMapNodeBase<TKey> {
    type: 'leaf',
    values: TValue[]
}

type RangeableMapNode<TKey, TValue> = RangeableMapBranchNode<TKey, TValue> | RangeableMapLeafNode<TKey, TValue>;

export interface RangeEntry<TKey, TValue> {
    lowestKey: TKey,
    highestKey: TKey,
    values: ReadonlyArray<TValue>
}

// Ordered map, where keys can exist in contiguous ranges
export class RangeableMap<TKey, TValue> {
    private root: RangeableMapNode<TKey, TValue> | undefined;

    public constructor(private readonly rangeableType: RangeableType<TKey>) {}

    public set(key: TKey, value: TValue): boolean {
        if (this.root) {
            const { newSubtree, changed } = this.setInSubtreeUnconstrained(key, value, this.root);
            this.root = newSubtree;
            this.checkRep();
            return changed;
        } else {
            this.root = this.createLeafNodeForKeyValue(key, value);
            this.checkRep();
            return true;
        }
    }

    public has(key: TKey): boolean {
        const { leaf: leafWithKey } = this.leafWithKeyIfExists(key);
        this.checkRep();
        return leafWithKey !== undefined;
    }

    public get(key: TKey): TValue | undefined {
        const { leaf: leafWithKey } = this.leafWithKeyIfExists(key);
        if (!leafWithKey) {
            this.checkRep();
            return undefined;
        }
        const index = this.rangeableType.minus(key, leafWithKey.lowest);
        if (index < 0 || index >= leafWithKey.values.length) {
            throw new Error('subtraction between key and lower bound produced unexpected result');
        }
        this.checkRep();
        return leafWithKey.values[index];
    }

    public delete(key: TKey): TValue | undefined {
        if (!this.root) {
            return undefined;
        }
        const deleteResult = this.deleteFromSubtreeUnconstrained(key, this.root);
        if (!deleteResult) {
            this.checkRep();
            return undefined;
        }
        this.root = deleteResult.newSubtree;
        this.checkRep();
        return deleteResult.value;
    }

    private deleteFromSubtreeUnconstrained(key: TKey, subtree: RangeableMapNode<TKey, TValue>): { 
        value: TValue,
        newSubtree: RangeableMapNode<TKey, TValue> | undefined
    } | undefined {
        if (this.rangeableType.lessThan(key, subtree.lowest) || this.rangeableType.lessThan(subtree.highest, key)) {
            return undefined;
        }
        return this.deleteFromSubtree(key, subtree);
    }

    private deleteFromSubtree(key: TKey, subtree: RangeableMapNode<TKey, TValue>): { 
        value: TValue,
        newSubtree: RangeableMapNode<TKey, TValue> | undefined
    } | undefined {
        if (this.rangeableType.lessThan(key, subtree.lowest) || this.rangeableType.lessThan(subtree.highest, key)) {
            throw new Error('key unexpectedly out of range of subtree');
        }
        if (subtree.type === 'branch') {
            let deletionResult: ReturnType<typeof this.deleteFromSubtree>;
            if (!this.rangeableType.lessThan(subtree.leftChild.highest, key)) {
                deletionResult = this.deleteFromSubtree(key, subtree.leftChild);
                if (deletionResult) {
                    if (deletionResult.newSubtree) {
                        subtree.leftChild = deletionResult.newSubtree;
                        deletionResult.newSubtree = subtree;
                    } else {
                        deletionResult.newSubtree = subtree.rightChild;
                    }
                }
            } else if (!this.rangeableType.lessThan(key, subtree.rightChild.lowest)) {
                deletionResult = this.deleteFromSubtree(key, subtree.rightChild);
                if (deletionResult) {
                    if (deletionResult.newSubtree) {
                        subtree.rightChild = deletionResult.newSubtree;
                        deletionResult.newSubtree = subtree;
                    } else {
                        deletionResult.newSubtree = subtree.leftChild;
                    }
                }
            } else {
                return undefined;
            }
            if (!deletionResult) {
                return undefined;
            }
            subtree.lowest = subtree.leftChild.lowest;
            subtree.highest = subtree.rightChild.highest;
            return deletionResult;
        } else {
            if (this.rangeableType.equal(subtree.lowest, subtree.highest)) {
                if (!this.rangeableType.equal(subtree.lowest, key) || !this.rangeableType.equal(subtree.highest, key)) {
                    throw new Error('expected key bounded above and below by same value is not equal to both');
                }
                if (subtree.values.length !== 1) {
                    throw new Error('values array unexpectedly not of length one');
                }
                return {
                    value: subtree.values[0],
                    newSubtree: undefined
                };
            } else if (this.rangeableType.equal(subtree.lowest, key)) {
                subtree.lowest = this.rangeableType.successorOf(key);
                const value = subtree.values.shift();
                if (!value) {
                    throw new Error('values array unexpectedly empty');
                }
                return {
                    value,
                    newSubtree: subtree
                }
            } else if (this.rangeableType.equal(subtree.highest, key)) {
                subtree.highest = this.rangeableType.predecessorOf(key);
                const value = subtree.values.pop();
                if (!value) {
                    throw new Error('values array unexpectedly empty');
                }
                return {
                    value,
                    newSubtree: subtree
                }
            } else {
                // split into two
                const splitIndex = this.rangeableType.minus(key, subtree.lowest);
                if (splitIndex <= 0 || splitIndex >= subtree.values.length - 1) {
                    throw new Error('unexpected splitIndex value');
                }
                const newLeft: RangeableMapLeafNode<TKey, TValue> = {
                    type: 'leaf',
                    lowest: subtree.lowest,
                    highest: this.rangeableType.predecessorOf(key),
                    values: subtree.values.slice(0, splitIndex)
                };
                if (this.rangeableType.lessThan(newLeft.highest, newLeft.lowest)) {
                    throw new Error('highest bound expectedly less than lowest bound in newLeft');
                }
                const newRight: RangeableMapLeafNode<TKey, TValue> = {
                    type: 'leaf',
                    lowest: this.rangeableType.successorOf(key),
                    highest: subtree.highest,
                    values: subtree.values.slice(splitIndex + 1, subtree.values.length)
                };
                if (this.rangeableType.lessThan(newRight.highest, newRight.lowest)) {
                    throw new Error('highest bound expectedly less than lowest bound in newRight');
                }
                if (!this.rangeableType.lessThan(newLeft.highest, newRight.lowest)) {
                    throw new Error('newLeft.highest expected to be less than newRight.lowest');
                }
                if (this.rangeableType.immediatelyPrecedes(newLeft.highest, newRight.lowest)) {
                    throw new Error('newLeft.highest unexpectedly immediate predecessor to newRight.lowest');
                }
                const newBranch = this.createBranchNode(newLeft, newRight);
                return {
                    value: subtree.values[splitIndex],
                    newSubtree: newBranch
                }
            }
        }
    }

    public *iterateRanges(): IterableIterator<RangeEntry<TKey, TValue>> {
        if (this.root) {
            yield *this.iterateRangesInSubtree(this.root);
        }
    }

    private *iterateRangesInSubtree(subtree: RangeableMapNode<TKey, TValue>): IterableIterator<RangeEntry<TKey, TValue>> {
        if (subtree.type === 'branch') {
            yield* this.iterateRangesInSubtree(subtree.leftChild);
            yield* this.iterateRangesInSubtree(subtree.rightChild);
        } else {
            yield {
                lowestKey: subtree.lowest,
                highestKey: subtree.highest,
                values: subtree.values
            }
        }
    }

    private leafWithKeyIfExists(key: TKey): {
        leaf: RangeableMapLeafNode<TKey, TValue> | undefined,
        parent: RangeableMapBranchNode<TKey, TValue> | undefined,
        grandparent: RangeableMapBranchNode<TKey, TValue> | undefined
    } {
        let curr: RangeableMapNode<TKey, TValue> | undefined;
        let parent: RangeableMapBranchNode<TKey, TValue> | undefined;
        let grandparent: RangeableMapBranchNode<TKey, TValue> | undefined;
        if (this.root) {
            curr = this.root;
            while (true) {
                if (this.rangeableType.lessThan(key, curr.lowest) || this.rangeableType.lessThan(curr.highest, key)) {
                    return { leaf: undefined, parent: undefined, grandparent: undefined };
                }
                if (curr.type === 'leaf') {
                    break;
                } else {
                    grandparent = parent;
                    parent = curr;
                    if (!this.rangeableType.lessThan(key, curr.rightChild.lowest)) {
                        curr = curr.rightChild;
                    } else if (!this.rangeableType.lessThan(curr.leftChild.highest, key)) {
                        curr = curr.leftChild;
                    } else {
                        return { leaf: undefined, parent: undefined, grandparent: undefined };
                    }
                }
            }
        }
        return { leaf: curr as RangeableMapLeafNode<TKey, TValue> | undefined, parent, grandparent };
    }

    // set the key/value pair "in" the given subtree, this may return a
    // new node if the given subtree should be replaced
    private setInSubtreeUnconstrained(
        key: TKey,
        value: TValue,
        subtree: RangeableMapNode<TKey, TValue>
    ): {
        newSubtree: RangeableMapNode<TKey, TValue>,
        changed: boolean
    } {
        let ret = {
            newSubtree: subtree,
            changed: true
        };
        if (this.rangeableType.lessThan(key, subtree.lowest)) {
            if (this.rangeableType.immediatelyPrecedes(key, subtree.lowest)) {
                this.appendToStartOfSubtree(key, value, subtree);
            } else {
                // TODO: balance
                ret.newSubtree = this.createBranchNode(this.createLeafNodeForKeyValue(key, value), subtree);
            }
        } else if (this.rangeableType.lessThan(subtree.highest, key)) {
            if (this.rangeableType.immediatelyPrecedes(subtree.highest, key)) {
                this.appendToEndOfSubtree(key, value, subtree);
            } else {
                // TODO: balance
                ret.newSubtree =  this.createBranchNode(subtree, this.createLeafNodeForKeyValue(key, value));
            }
        } else {
            return this.setInSubtree(key, value, subtree);
        }
        return ret;
    }

    private setInSubtree(
        key: TKey,
        value: TValue,
        subtree: RangeableMapNode<TKey, TValue>
    ):{
        newSubtree: RangeableMapNode<TKey, TValue>,
        changed: boolean
    } {
        let ret = {
            newSubtree: subtree,
            changed: true
        }
        if (this.rangeableType.lessThan(key, subtree.lowest) || this.rangeableType.lessThan(subtree.highest, key)) {
            throw new Error("key expected to be within bounds of subtree range, or equal to limit, but isn't");
        }
        if (subtree.type === 'branch') {
            if (!this.rangeableType.lessThan(subtree.leftChild.highest, key)) {
                const { newSubtree, changed } = this.setInSubtree(key, value, subtree.leftChild);;
                subtree.leftChild = newSubtree;
                ret.changed = changed;
                subtree.lowest = subtree.leftChild.lowest;
                subtree.highest = subtree.rightChild.highest;    
            } else if (!this.rangeableType.lessThan(key, subtree.rightChild.lowest)) {
                const { newSubtree, changed } = this.setInSubtree(key, value, subtree.rightChild);
                subtree.rightChild = newSubtree;
                ret.changed = changed;
                subtree.lowest = subtree.leftChild.lowest;
                subtree.highest = subtree.rightChild.highest;    
            } else {
                const immediatelySucceedsLeft = this.rangeableType.immediatelyPrecedes(subtree.leftChild.highest, key);
                const immediatelyPrecedesRight = this.rangeableType.immediatelyPrecedes(key, subtree.rightChild.lowest);
                if (immediatelySucceedsLeft) {
                    if (immediatelyPrecedesRight) {
                        const { newSubtree: newRightChild, values, highestKeyRemoved } = this.removeLeftmostRangeFromSubtree(subtree.rightChild);
                        this.checkRepSubtree(subtree);
                        const valuesToExtendWith = [value, ...values];
                        this.extendSubtreeRightWith(highestKeyRemoved, valuesToExtendWith, subtree.leftChild);
                        if (newRightChild) {
                            subtree.rightChild = newRightChild;
                        } else {
                            ret.newSubtree = subtree.leftChild;
                        }
                    } else {
                        this.appendToEndOfSubtree(key, value, subtree.leftChild);
                    }
                } else if (immediatelyPrecedesRight) {
                    this.appendToStartOfSubtree(key, value, subtree.rightChild);
                } else {
                    // TODO: balance
                    subtree.rightChild = this.createBranchNode(this.createLeafNodeForKeyValue(key, value), subtree.rightChild);
                }
            }
        } else {
            const index = this.rangeableType.minus(key, subtree.lowest);
            if (index < 0 || index >= subtree.values.length) {
                throw new Error('subtraction between key and lower bound produced unexpected result');
            }
            ret.changed = subtree.values[index] !== value;
            subtree.values[index] = value;
        }
        return ret;
    }

    private removeLeftmostRangeFromSubtree(subtree: RangeableMapNode<TKey, TValue>): {
        newSubtree: RangeableMapNode<TKey, TValue> | undefined,
        values: TValue[],
        highestKeyRemoved: TKey
    } {
        if (subtree.type === 'branch') {
            const { newSubtree: newLeftChild, values, highestKeyRemoved } = this.removeLeftmostRangeFromSubtree(subtree.leftChild);
            subtree.lowest = subtree.leftChild.lowest;
            let newSubtree;
            if (newLeftChild) {
                subtree.leftChild = newLeftChild;
                newSubtree = subtree;
            } else {
                newSubtree = subtree.leftChild;
            }
            return { newSubtree, values, highestKeyRemoved };
        } else {
            return {
                newSubtree: undefined,
                values: subtree.values, 
                highestKeyRemoved: subtree.highest
            };
        }
    }

    private appendToStartOfSubtree(key: TKey, value: TValue, subtree: RangeableMapNode<TKey, TValue>): void {
        if (!this.rangeableType.immediatelyPrecedes(key, subtree.lowest)) {
            throw new Error("key expected to be immediate predecessor of lower bound of subtree, but isn't");
        }
        this.extendSubtreeLeftWith(key, [value], subtree);
    }

    private extendSubtreeLeftWith(key: TKey, values: TValue[], subtree: RangeableMapNode<TKey, TValue>): void {
        if (this.rangeableType.minus(subtree.lowest, key) !== values.length) {
            throw new Error("lower bound minus key expected to equal number of values to insert, but doesn't");
        }
        if (subtree.type === 'branch') {
            this.extendSubtreeLeftWith(key, values, subtree.leftChild);
        } else {
            subtree.values.unshift(...values);
        }
        subtree.lowest = key;
    }

    private appendToEndOfSubtree(key: TKey, value: TValue, subtree: RangeableMapNode<TKey, TValue>): void {
        if (!this.rangeableType.immediatelyPrecedes(subtree.highest, key)) {
            throw new Error("key expected to be immediate successor of upper bound of subtree, but isn't");
        }
        this.extendSubtreeRightWith(key, [value], subtree);
    }

    private extendSubtreeRightWith(key: TKey, values: TValue[], subtree: RangeableMapNode<TKey, TValue>): void {
        if (this.rangeableType.minus(key, subtree.highest) !== values.length) {
            throw new Error("key minus upper bound expected to equal number of values to insert, but doesn't");
        }
        if (subtree.type === 'branch') {
            this.extendSubtreeRightWith(key, values, subtree.rightChild);
        } else {
            subtree.values.push(...values);
        }
        subtree.highest = key;
    }

    private createLeafNodeForKeyValue(key: TKey, value: TValue): RangeableMapNode<TKey, TValue> {
        return {
            type: 'leaf',
            lowest: key,
            highest: key,
            values: [value]
        };
    }

    private createBranchNode(leftChild: RangeableMapNode<TKey, TValue>, rightChild: RangeableMapNode<TKey, TValue>): RangeableMapNode<TKey, TValue> {
        return {
            type: 'branch',
            lowest: leftChild.lowest,
            highest: rightChild.highest,
            leftChild,
            rightChild
        };
    }

    public stringify(keyToStringFunc: (key: TKey) => string, valArrayToStringFunc: (values: TValue[]) => string): string {
        if (!this.root) {
            return '(empty)';
        }
        return this.stringifyNode(this.root, 0, keyToStringFunc, valArrayToStringFunc);
    }

    private stringifyNode(
        node: RangeableMapNode<TKey, TValue>,
        indent: number,
        keyToStringFunc: (key: TKey) => string,
        valArrayToStringFunc: (values: TValue[]) => string
    ): string {
        if (node.type === 'leaf') {
            let buffer = '';
            for (let i = 0; i < indent; ++i) {
                buffer += '  ';
            }
            const valsAsString = valArrayToStringFunc(node.values);
            if (this.rangeableType.equal(node.lowest, node.highest)) {
                return buffer + `${node.lowest} => ${valsAsString}\n`;
            } else {
                return buffer + `[${node.lowest}, ${node.highest}] => ${valsAsString}\n`;
            }
        } else {
            return this.stringifyNode(node.leftChild, indent + 1, keyToStringFunc, valArrayToStringFunc)
            + this.stringifyNode(node.rightChild, indent + 1, keyToStringFunc, valArrayToStringFunc);
        }
    }

    private checkRep(): void {
        if (!this.root) {
            return;
        }
        this.checkRepSubtree(this.root);
    }

    private checkRepSubtree(subtree: RangeableMapNode<TKey, TValue>): void {
        if (subtree.type === 'branch') {
            if (!this.rangeableType.equal(subtree.lowest, subtree.leftChild.lowest)) {
                throw new Error("branch node's lowest not equal to left child's lowest");
            }
            if (!this.rangeableType.equal(subtree.highest, subtree.rightChild.highest)) {
                throw new Error("branch node's highest not equal to right child's highest");
            }
            this.checkRepSubtree(subtree.leftChild);
            this.checkRepSubtree(subtree.rightChild);
        }
    }
}
