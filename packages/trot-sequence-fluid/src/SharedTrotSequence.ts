import { IFluidSerializer } from "@fluidframework/core-interfaces";
import { IChannelStorageService, IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions";
import { ISequencedDocumentMessage, ITree, FileMode, TreeEntry } from "@fluidframework/protocol-definitions";
import { SharedObject } from "@fluidframework/shared-object-base";
import { val } from "@cclauson/trot-sequence";
import { SharedTrotSequenceFactory } from "./Factory";

export class SharedTrotSequence extends SharedObject {

    public static Factory = new SharedTrotSequenceFactory();

    public static create(runtime: IFluidDataStoreRuntime, id?: string): SharedTrotSequence {
		return runtime.createChannel(id, SharedTrotSequenceFactory.Type) as SharedTrotSequence;
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