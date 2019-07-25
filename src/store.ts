import { combineReducers, createStore, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";

import { reducer as fooReducer } from "./store/foo";
import { saga as fooSaga } from "saga/foo";

const rootReducer = combineReducers({
    foo: fooReducer
});

const sagaMiddleware = createSagaMiddleware();

export const store = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(fooSaga);