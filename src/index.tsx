import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { store } from "store";
import FooList from "components/app";

const app = (
    <Provider store={store}>
        <FooList />
    </Provider>
);

ReactDOM.render(app, document.getElementById("app"));