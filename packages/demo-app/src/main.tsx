import { DataObjectTypes, IDataObjectProps } from "@fluidframework/aqueduct";
import { IFluidModule } from "@fluidframework/container-definitions";
import { IFluidHTMLView } from "@fluidframework/view-interfaces";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { LocalDriver } from "./LocalDriver";
import { TextEditorComponent } from "./TextEditorComponent";
import { TextEditorContainerRuntimeFactory } from "./TextEditorContainer";

function App(): JSX.Element {
    const [count, setCount] = useState<number>(0);

    return <div>
        <text>Count: {count}</text>
        <div></div>
        <button onClick={() => setCount(count => count + 1)}>Increment Counter</button>
    </div>
}

const localDriver = new LocalDriver({
    load: () => Promise.resolve<IFluidModule>({ fluidExport: TextEditorContainerRuntimeFactory })
});

async function createTextEditorComponentInstance(): Promise<TextEditorComponent> {
    const containerName = 'my-container';
    const container = await localDriver.getLocalContainer(containerName, { package: 'text-component-container' });
    return (await container.request({ url: '/' })).value as TextEditorComponent;
}

async function onLoad() {
    const mainDiv = document.getElementById("main-div");
    const div1 = document.createElement('div');
    mainDiv.appendChild(div1);
    const hr = document.createElement('hr');
    mainDiv.appendChild(hr);
    const div2 = document.createElement('div');
    mainDiv.appendChild(div2);
    const textEditor1 = await createTextEditorComponentInstance();
    textEditor1.render(div1);
    const textEditor2 = await createTextEditorComponentInstance();
    textEditor2.render(div2);
}

document.addEventListener('DOMContentLoaded', onLoad);
