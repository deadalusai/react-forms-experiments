import { combineReducers, createStore, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";

import { FactsState, reducer as factsReducer } from "./facts";
import { GlobalState, reducer as globalReducer } from "./global";
import { FormsState, reducer as formsReducer } from "./forms";
import { saga as fooSaga } from "saga/facts";

export type RootState = {
    global: GlobalState,
    facts: FactsState,
    forms: FormsState,
}

const rootReducer = combineReducers<RootState>({
    global: globalReducer,
    facts: factsReducer,
    forms: formsReducer,
});

const sagaMiddleware = createSagaMiddleware();

export const store = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(fooSaga);