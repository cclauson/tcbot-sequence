import { IFluidSerializer } from "@fluidframework/core-interfaces";
import { IChannelStorageService, IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions";
import { ISequencedDocumentMessage, ITree, FileMode, TreeEntry } from "@fluidframework/protocol-definitions";
import { SharedObject } from "@fluidframework/shared-object-base";
import { val } from "@cclauson/tcbot-sequence";
import { SharedTcbotSequenceFactory } from "./Factory";

export class SharedTcbotSequence extends SharedObject {

    public static Factory = new SharedTcbotSequenceFactory();

    public static create(runtime: IFluidDataStoreRuntime, id?: string): SharedTcbotSequence {
		return runtime.createChannel(id, SharedTcbotSequenceFactory.Type) as SharedTcbotSequence;
	}

    protected snapshotCore(serializer: IFluidSerializer): ITree {
        return {
            entries: [
                {
                    mode: FileMode.File,
                    path: 'some-path',
                    type: TreeEntry.Blob,
                    value: {
                        contents: 'snapshot-contents',
                        encoding: 'utf-8'
                    }
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