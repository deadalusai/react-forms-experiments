import { combineReducers, createStore, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";

import { FactsState, reducer as factsReducer } from "./facts";
import { saga as fooSaga } from "saga/facts";

export type RootState = {
    facts: FactsState,
}

const rootReducer = combineReducers<RootState>({
    facts: factsReducer
});

const sagaMiddleware = createSagaMiddleware();

export const store = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(fooSaga);