//
// State
//

export interface GlobalState {
    errorId: string | null;
    errorParams: any | null;
}

export const initialState: GlobalState = {
    errorId: null,
    errorParams: null,
};

//
// Actions
//

export const GLOBAL_SET_ERROR = "GLOBAL:SET_ERROR";
export interface SetErrorAction {
    type: typeof GLOBAL_SET_ERROR;
    errorId: string;
    errorParams: any | null;
}
function setError(errorId: string, errorParams: any | null = null): SetErrorAction {
    return { type: GLOBAL_SET_ERROR, errorId, errorParams };
}
function setErrorReducer(state: GlobalState, action: SetErrorAction): GlobalState {
    return {
        ...state,
        errorId: action.errorId,
        errorParams: action.errorParams,
    };
}

export const actions = {
    setError
};

//
// Reducer
//

export function reducer(state: GlobalState | undefined, action: SetErrorAction) {
    if (!state) {
        return initialState;
    }
    switch (action.type) {
        case GLOBAL_SET_ERROR:
            return setErrorReducer(state, action);
    }
    return state;
}
