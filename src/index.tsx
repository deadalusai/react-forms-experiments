import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { store } from "store";
import TestOne from "components/test-one";
import TestTwo from "components/test-two";

function App() {
    return <>
        <div style={{ margin: "20px" }}><TestOne /></div>
        <div style={{ margin: "20px" }}><TestTwo /></div>
    </>;
}

const app = (
    <Provider store={store}>
        <App />
    </Provider>
);

ReactDOM.render(app, document.getElementById("app"));