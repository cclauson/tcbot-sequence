import { RgaOp, Rga } from "../rga/Rga";
import { EffectSequenceElement, RgaDoc } from "../rga/RgaDoc";
import { SequenceTypeImplementation, InternalDocument, MergableOpRequest, UserOperation, SequenceElementType } from "../sequence-types/CoreTypes";

export class RgaOtDoc<TSequenceElement, TSequenceElementOrder, TSequenceElementIdentity, TOperationOrder> implements InternalDocument<TSequenceElement, RgaOtDoc<TSequenceElement, TSequenceElementOrder, TSequenceElementIdentity, TOperationOrder>, RgaOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder>, TOperationOrder> {
    public effectSequence: EffectSequenceElement<TSequenceElement, TOperationOrder>[] = [];

    public read(): TSequenceElement[] {
        throw new Error("Method not implemented.");
    }
    public equals(other: RgaOtDoc<TSequenceElement, TSequenceElementOrder, TSequenceElementIdentity, TOperationOrder>): boolean {
        throw new Error("Method not implemented.");
    }
    public applyOpWithOrder(operation: MergableOpRequest<RgaOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder>>, order: TOperationOrder): void {
        throw new Error("Method not implemented.");
    }
    public clone(): RgaOtDoc<TSequenceElement, TSequenceElementOrder, TSequenceElementIdentity, TOperationOrder> {
        throw new Error("Method not implemented.");
    }
}

export class RgaOt<TSequenceElement, TSequenceElementOrder, TSequenceElementIdentity, TOperationOrder> implements SequenceTypeImplementation<TSequenceElement, RgaOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder>, TOperationOrder, RgaOtDoc<TSequenceElement, TSequenceElementOrder, TSequenceElementIdentity, TOperationOrder>> {
    private readonly rga: Rga<TSequenceElement, TSequenceElementIdentity, TOperationOrder>;
    private readonly sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>;
    private readonly sequenceElementOrderCompFn: (o1: TOperationOrder, o2: TOperationOrder) => number;

    public constructor(
        sequenceElementType: SequenceElementType<TSequenceElement, TSequenceElementIdentity>,
        sequenceElementOrderCompFn: (o1: TOperationOrder, o2: TOperationOrder) => number
    ) {
        this.rga = new Rga(sequenceElementType, sequenceElementOrderCompFn);
        this.sequenceElementType = sequenceElementType;
        this.sequenceElementOrderCompFn = sequenceElementOrderCompFn;
    }

    public emptyDocument(): RgaOtDoc<TSequenceElement, TSequenceElementOrder, TSequenceElementIdentity, TOperationOrder> {
        return new RgaOtDoc();
    }
    public operationFromUserOpAppliedToDoc(userOperation: UserOperation<TSequenceElement>, document: RgaOtDoc<TSequenceElement, TSequenceElementOrder, TSequenceElementIdentity, TOperationOrder>, order: TOperationOrder): RgaOp<TSequenceElement, TSequenceElementIdentity, TOperationOrder> {
        const rgaDoc = new RgaDoc(document.effectSequence, new Set<TSequenceElementIdentity>(), this.sequenceElementType, this.sequenceElementOrderCompFn);
        return this.rga.operationFromUserOpAppliedToDoc(userOperation, rgaDoc, order);
    }
}
