import { IFluidSerializer } from "@fluidframework/core-interfaces";
import { IChannelStorageService } from "@fluidframework/datastore-definitions";
import { ISequencedDocumentMessage, ITree, FileMode, TreeEntry } from "@fluidframework/protocol-definitions";
import { SharedObject } from "@fluidframework/shared-object-base";
import { val } from "@cclauson/tcbot-sequence";

export class SharedTcbotSequence extends SharedObject {
    protected snapshotCore(serializer: IFluidSerializer): ITree {
        return {
            entries: [
                {
                    mode: FileMode.File,
                    path: 'some-path',
                    type: TreeEntry.Commit,
                    value: 'snapshot-value'
                }
            ]
        }
    }
    protected async loadCore(services: IChannelStorageService): Promise<void> {
        // TODO: handle snapshot
    }

    protected processCore(message: ISequencedDocumentMessage, local: boolean, localOpMetadata: unknown) {
        
    }

    protected applyStashedOp(content: any): void {
        // not implemented
    }

    protected onDisconnect() {
        // Do nothing
    }
    
    protected registerCore() {
        // Do nothing
    }

    public getVal(): string {
        return val;
    }
}