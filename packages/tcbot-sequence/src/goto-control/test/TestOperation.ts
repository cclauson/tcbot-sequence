export abstract class TestOperation implements Operation<TestOperation> {
    public backTransposeWith(op2: TestOperation): { op1: TestOperation; op2: TestOperation; } {
        const op1Prime = this.exclusionTransformAgainst(op2);
        const op2Prime = op2.inclusionTransformAgainst(op1Prime);
        return { op1: op1Prime, op2: op2Prime };
    }

    public inclusionTransformAgainst(operation: TestOperation): TestOperation {
        return new InclusionTestOperation(this, operation);
    }

    public exclusionTransformAgainst(operation: TestOperation): TestOperation {
        return new ExclusionTestOperation(this, operation);
    }

    public abstract equals(other: TestOperation): boolean;

    public abstract toString(): string;

    public abstract numTimesTransformed(): number;
}

class ExclusionTestOperation extends TestOperation {
    public constructor(readonly operation: TestOperation, readonly excludee: TestOperation) {
        super();
    }

    public equals(other: TestOperation): boolean {
        if (!(other instanceof ExclusionTestOperation)) {
            return false;
        }
        const otherExclusionTestOperation = other as ExclusionTestOperation;
        return this.operation.equals(otherExclusionTestOperation.operation)
            && this.excludee.equals(otherExclusionTestOperation.excludee);
    }

    public toString(): string {
        return `${this.operation.toString()} excluded against ${this.excludee.toString()}`;
    }

    public numTimesTransformed(): number {
        return this.operation.numTimesTransformed() + 1;
    }
}

class InclusionTestOperation extends TestOperation {
    public constructor(readonly operation: TestOperation, readonly includee: TestOperation) {
        super();
    }

    public equals(other: TestOperation): boolean {
        if (!(other instanceof InclusionTestOperation)) {
            return false;
        }
        const otherInclusionTestOperation = other as InclusionTestOperation;
        return this.operation.equals(otherInclusionTestOperation.operation)
            && this.includee.equals(otherInclusionTestOperation.includee);
    }

    public toString(): string {
        return `${this.operation.toString()} included against ${this.includee.toString()}`;
    }

    public numTimesTransformed(): number {
        return this.operation.numTimesTransformed() + 1;
    }
}

class LeafTestOperation extends TestOperation {
    public constructor(readonly name: string) {
        super();
    }

    public equals(other: TestOperation): boolean {
        return Object.is(this, other);
    }

    public toString(): string {
        return this.name;
    }

    public numTimesTransformed(): number {
        return 0;
    }
}

export function createTestOperation(name: string): TestOperation {
    return new LeafTestOperation(name);
}