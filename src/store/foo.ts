import { ActionsFrom, assertNever } from "util";
import { ErrorType } from "api";

//
// State
//

export interface FooState {
    items: string[];
}

export const initialState: FooState = {
    items: [],
};

//
// Actions
//

export const FOO_FETCH = "FOO:FETCH";
export interface FooFetchAction {
    type: typeof FOO_FETCH,
}
function fooFetch(): FooFetchAction {
    return { type: FOO_FETCH };
}
function fooFetchReducer(state: FooState, _action: FooFetchAction): FooState {
    return { ...state };
}

export const FOO_FETCH_ERROR = "FOO:FETCH_ERROR";
export interface FooFetchErrorAction {
    type: typeof FOO_FETCH_ERROR,
    error: ErrorType,
}
function fooFetchError(error: ErrorType): FooFetchErrorAction {
    return { type: FOO_FETCH_ERROR, error };
}
function fooFetchErrorReducer(state: FooState, action: FooFetchErrorAction): FooState {
    return { ...state };
}

export const FOO_FETCH_RESULT = "FOO:FETCH_RESULT";
export interface FooFetchResultAction {
    type: typeof FOO_FETCH_RESULT,
    items: string[],
}
function fooFetchResult(items: string[]): FooFetchResultAction {
    return { type: FOO_FETCH_RESULT, items };
}
function fooFetchResultReducer(state: FooState, action: FooFetchResultAction): FooState {
    return { ...state, items: action.items };
}

//
// Reducer
//

export const actions = {
    fooFetch,
    fooFetchResult,
    fooFetchError,
};

export function reducer(state: FooState | undefined, action: ActionsFrom<typeof actions>) {
    if (!state) {
        return initialState;
    }
    switch (action.type) {
        case FOO_FETCH:
            return fooFetchReducer(state, action);
        case FOO_FETCH_ERROR:
            return fooFetchErrorReducer(state, action);
        case FOO_FETCH_RESULT:
            return fooFetchResultReducer(state, action);
        default:
            assertNever(action);
    }
    return state;
}