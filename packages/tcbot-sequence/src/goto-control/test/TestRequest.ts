import { createTestOperation, TestOperation } from "./TestOperation";

export class TestRequest implements OpRequest<TestOperation>{
    public readonly name: string;
    public readonly operation: TestOperation;
    private readonly causallyPreceding: Set<TestRequest>;

    public constructor(name: string, causallyPreceding?: Set<TestRequest>, operation?: TestOperation) {
        this.name = name;
        this.operation = operation ?? createTestOperation(name);
        this.causallyPreceding = causallyPreceding ? new Set<TestRequest>(causallyPreceding) : new Set<TestRequest>();
    }

    public causallyPrecedes(other: TestRequest): boolean {
        return other.causallyPreceding.has(this);
    }

    public withOperation(op: TestOperation): TestRequest {
        return new TestRequest(this.name, this.causallyPreceding, op);
    }
}