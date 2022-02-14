import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Provider, useSelector } from "react-redux";
import { createStore } from "redux";

interface StoreType {
    value: string;
}

function reducer(_state: StoreType, _action: any): StoreType {
    return { value: 'foobarbaz' };
}

const store = createStore(reducer);

function namedSelector(st: StoreType): string {
    console.log('selector rerun');
    return st.value;
}

function App(): JSX.Element {
    const [count, setCount] = useState<number>(0);

    const arrowFunctionSelector: (st: StoreType) => string = (st) => {
        console.log('selector rerun');
        return st.value;
    }

    const valFromRedux = useSelector<StoreType>(namedSelector, () => true);

    console.log(`val from redux: ${valFromRedux}`);

    return <div>
        <text>Count: {count}</text>
        <div></div>
        <button onClick={() => setCount(count => count + 1)}>Increment Counter</button>
    </div>
}

async function onLoad() {
    const app = <Provider store={store}><App /></Provider>;
    ReactDOM.render(app, document.getElementById("main-div"));
}

document.addEventListener('DOMContentLoaded', onLoad);
