import { IChannel, IChannelAttributes, IChannelFactory, IChannelServices, IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions";
import { SharedTcbotSequence } from ".";

export class SharedTcbotSequenceFactory implements IChannelFactory {

    public static Type = "SharedTcbotSequence";

    public static Attributes: IChannelAttributes = {
        type: SharedTcbotSequenceFactory.Type,
        snapshotFormatVersion: "0.1",
        packageVersion: "0.1"
    };

    public get type(): string {
        return SharedTcbotSequenceFactory.Type;
    }

    public get attributes(): IChannelAttributes {
        return SharedTcbotSequenceFactory.Attributes;
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

    public create(runtime: IFluidDataStoreRuntime, id: string): SharedTcbotSequence {
        return new SharedTcbotSequence(id, runtime, SharedTcbotSequenceFactory.Attributes);
    }

}