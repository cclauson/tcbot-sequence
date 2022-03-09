import { IChannel, IChannelAttributes, IChannelFactory, IChannelServices, IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions";
import { SharedTrotSequence } from ".";

export class SharedTrotSequenceFactory implements IChannelFactory {

    public static Type = "SharedTrotSequence";

    public static Attributes: IChannelAttributes = {
        type: SharedTrotSequenceFactory.Type,
        snapshotFormatVersion: "0.1",
        packageVersion: "0.1"
    };

    public get type(): string {
        return SharedTrotSequenceFactory.Type;
    }

    public get attributes(): IChannelAttributes {
        return SharedTrotSequenceFactory.Attributes;
    }

    public async load(
        runtime: IFluidDataStoreRuntime,
        id: string,
        services: IChannelServices,
        _channelAttributes: Readonly<IChannelAttributes>
    ): Promise<IChannel> {
        const sequence = this.create(runtime, id);
        await sequence.load(services);
        return sequence;
    }

    public create(runtime: IFluidDataStoreRuntime, id: string): SharedTrotSequence {
        return new SharedTrotSequence(id, runtime, SharedTrotSequenceFactory.Attributes);
    }

}