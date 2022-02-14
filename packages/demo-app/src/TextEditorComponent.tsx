import { DataObject, DataObjectFactory } from "@fluidframework/aqueduct";
import { IFluidHTMLOptions, IFluidHTMLView } from "@fluidframework/view-interfaces";
import React, { useState } from "react";
import ReactDOM from "react-dom";

export class TextEditorComponent extends DataObject implements IFluidHTMLView {
    IFluidHTMLView: IFluidHTMLView;

    public static factory = new DataObjectFactory("TextEditorComponent", TextEditorComponent, [], {});

    render(div: HTMLElement, _options?: IFluidHTMLOptions): void {
        function App(): JSX.Element {
            const [count, setCount] = useState<number>(0);
        
            return <div>
                <text>Count: {count}</text>
                <div></div>
                <button onClick={() => setCount(count => count + 1)}>Increment Counter</button>
            </div>
        }
        ReactDOM.render(<App></App>, div);
    }

    protected async initializingFirstTime(): Promise<void> {
        // currently does nothing
    }
}