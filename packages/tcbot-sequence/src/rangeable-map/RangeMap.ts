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
            return changed;
        } else {
            this.root = this.createLeafNodeForKeyValue(key, value);
            return true;
        }
    }

    public has(key: TKey): boolean {
        return this.leafWithKeyIfExists(key) !== undefined;
    }

    public get(key: TKey): TValue | undefined {
        const leafWithKey = this.leafWithKeyIfExists(key);
        if (!leafWithKey) {
            return undefined;
        }
        const index = this.rangeableType.minus(key, leafWithKey.lowest);
        if (index < 0 || index >= leafWithKey.values.length) {
            throw new Error('subtraction between key and lower bound produced unexpected result');
        }
        return leafWithKey.values[index];
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

    private leafWithKeyIfExists(key: TKey): RangeableMapLeafNode<TKey, TValue> | undefined {
        if (!this.root) {
            return undefined;
        }
        let curr = this.root;
        while (true) {
            if (this.rangeableType.lessThan(key, curr.lowest) || this.rangeableType.lessThan(curr.highest, key)) {
                return undefined;
            }
            if (curr.type === 'leaf') {
                return curr;
            } else {
                if (!this.rangeableType.lessThan(key, curr.rightChild.lowest)) {
                    curr = curr.rightChild;
                } else if (!this.rangeableType.lessThan(curr.leftChild.highest, key)) {
                    curr = curr.leftChild;
                } else {
                    return undefined;
                }
            }
        }
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
            } else if (!this.rangeableType.lessThan(key, subtree.rightChild.lowest)) {
                const { newSubtree, changed } = this.setInSubtree(key, value, subtree.rightChild);
                subtree.rightChild = newSubtree;
                ret.changed = changed;
            } else {
                const immediatelySucceedsLeft = this.rangeableType.immediatelyPrecedes(subtree.leftChild.highest, key);
                const immediatelyPrecedesRight = this.rangeableType.immediatelyPrecedes(key, subtree.rightChild.lowest);
                if (immediatelySucceedsLeft) {
                    if (immediatelyPrecedesRight) {
                        const { newSubtree: newRightChild, values } = this.removeLeftmostRangeFromSubtree(subtree.rightChild);
                        this.extendSubtreeRightWith(key, values, subtree.leftChild);
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
        values: TValue[]
    } {
        if (subtree.type === 'branch') {
            const { newSubtree: newLeftChild, values } = this.removeLeftmostRangeFromSubtree(subtree.leftChild);
            let newSubtree;
            if (newLeftChild) {
                subtree.leftChild = newLeftChild;
                newSubtree = subtree;
            } else {
                newSubtree = subtree.leftChild;
            }
            return { newSubtree, values };
        } else {
            return {
                newSubtree: undefined,
                values: subtree.values
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

}
