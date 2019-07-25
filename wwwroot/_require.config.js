// See:
var require = {
    // Note: baseUrl set at optimization stage (release) or in _Layout (dev)
    // baseUrl = ./generated
    paths: {
        // Map library names to their physical location relative to baseUrl
        "react": "./lib/react/umd/react.development",
        "react-dom": "./lib/react-dom/umd/react-dom.development",
        "react-redux": "./lib/react-redux/dist/react-redux.min",
        "redux": "./lib/redux/dist/redux.min",
        "redux-saga": "./lib/redux-saga/dist/redux-saga.umd.min",
        "redux-saga/effects": "./lib/redux-saga/dist/redux-saga-effects.umd.min",
        // Typescript support library
        "tslib":     "./lib/tslib/tslib"
    }
};
if (typeof exports === 'object') {
    exports.config = require;
}