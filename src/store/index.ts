import { combineReducers, createStore, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";

import { FooState, reducer as fooReducer } from "./foo";
import { saga as fooSaga } from "saga/foo";

export type RootState = {
    foo: FooState,
}

const rootReducer = combineReducers<RootState>({
    foo: fooReducer
});

const sagaMiddleware = createSagaMiddleware();

export const store = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(fooSaga);