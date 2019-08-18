import { combineReducers, createStore, applyMiddleware, compose } from "redux";
import createSagaMiddleware from "redux-saga";
import { FormStateMap, reducer as reduxFormReducer } from "redux-form";

import { FactsState, reducer as factsReducer } from "./facts";
import { GlobalState, reducer as globalReducer } from "./global";
import { FormsState, reducer as formsReducer } from "forms/redux";
import { saga as factsSaga } from "saga/facts";

export type RootState = {
    global: GlobalState,
    facts: FactsState,
    forms: FormsState,
    form: FormStateMap,
}

const rootReducer = combineReducers<RootState>({
    global: globalReducer,
    facts: factsReducer,
    forms: formsReducer,
    form: reduxFormReducer,
});

const sagaMiddleware = createSagaMiddleware();

const composeEnhancers =
    typeof window === 'object' &&
        "__REDUX_DEVTOOLS_EXTENSION_COMPOSE__" in window
            ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ /* name, actionsBlacklist, actionsCreators, serialize... */ })
            : compose;

const enhancer = composeEnhancers(
    applyMiddleware(sagaMiddleware),
);

export const store = createStore(
    rootReducer,
    enhancer
);

sagaMiddleware.run(factsSaga);