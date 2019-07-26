import { ActionsFrom, assertNever } from "util";
import { Res, resResult, resLoading } from "api";
import { ISportsperson } from "api/query";

//
// State
//

export interface FactsState {
    sportspeople: Res<ISportsperson[]>;
}

export const initialState: FactsState = {
    sportspeople: resResult([]),
};

//
// Selectors
//

function getSportspeople(state: FactsState) {
    return state.sportspeople;
}

export const selectors = {
    getSportspeople: getSportspeople
};

//
// Actions
//

export const FACTS_SPORTSPEOPLE_FETCH = "FOO:FETCH";
export interface SportspeopleFetchAction {
    type: typeof FACTS_SPORTSPEOPLE_FETCH,
}
function sportspeopleFetch(): SportspeopleFetchAction {
    return { type: FACTS_SPORTSPEOPLE_FETCH };
}
function sportspeopleFetchFetchReducer(state: FactsState, _action: SportspeopleFetchAction): FactsState {
    return { ...state, sportspeople: resLoading() };
}

export const FACTS_SPORTSPEOPLE_FETCH_RESULT = "FOO:FETCH_RESULT";
export interface SportspeopleFetchResultAction {
    type: typeof FACTS_SPORTSPEOPLE_FETCH_RESULT,
    items: ISportsperson[],
}
function sportspeopleFetchResult(items: ISportsperson[]): SportspeopleFetchResultAction {
    return { type: FACTS_SPORTSPEOPLE_FETCH_RESULT, items };
}
function sportspeopleFetchResultReducer(state: FactsState, action: SportspeopleFetchResultAction): FactsState {
    return { ...state, sportspeople: resResult(action.items) };
}

//
// Reducer
//

export const actions = {
    sportspeopleFetch,
    sportspeopleFetchResult,
};

export function reducer(state: FactsState | undefined, action: ActionsFrom<typeof actions>) {
    if (!state) {
        return initialState;
    }
    switch (action.type) {
        case FACTS_SPORTSPEOPLE_FETCH:
            return sportspeopleFetchFetchReducer(state, action);
        case FACTS_SPORTSPEOPLE_FETCH_RESULT:
            return sportspeopleFetchResultReducer(state, action);
        default:
            assertNever(action);
    }
    return state;
}
