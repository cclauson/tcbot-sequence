import { DataObject, DataObjectFactory } from "@fluidframework/aqueduct";
import { IFluidHTMLOptions, IFluidHTMLView } from "@fluidframework/view-interfaces";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { SharedTrotSequence } from "@cclauson/trot-sequence-fluid";
import { IFluidHandle } from "@fluidframework/core-interfaces";

export class TextEditorComponent extends DataObject implements IFluidHTMLView {
    IFluidHTMLView: IFluidHTMLView;

    public static factory = new DataObjectFactory(
        "TextEditorComponent",
        TextEditorComponent,
        [SharedTrotSequence.Factory],
        {}
    );

    private static sequenceKey = 'trot-sequence-key';

    public async render(div: HTMLElement, _options?: IFluidHTMLOptions): Promise<void> {
        const sequenceHandle = this.root.get<IFluidHandle<SharedTrotSequence>>(TextEditorComponent.sequenceKey);
        if (!sequenceHandle) {
            throw new Error("unexpectedly couldn't get sequence dds handle");
        }
        const sequence = await sequenceHandle.get();

        function App(): JSX.Element {
            const [count, setCount] = useState<number>(0);
        
            return <div>
                <text>Count: {count}</text>
                <br></br>
                <button onClick={() => setCount(count => count + 1)}>Increment Counter</button>
                <hr></hr>
                <text>Value from DDS: {sequence.getVal()}</text>
            </div>
        }
        ReactDOM.render(<App></App>, div);
    }

    protected async initializingFirstTime(): Promise<void> {
        const sequence = SharedTrotSequence.create(this.runtime);
        this.root.set(TextEditorComponent.sequenceKey, sequence.handle);
    }
}