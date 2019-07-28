//
// State
//

export interface GlobalErrorInfo {
    errorId: string;
    errorParams?: any;
}

export interface GlobalState {
    error: GlobalErrorInfo | null;
}

export const initialState: GlobalState = {
    error: null,
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
        error: {
            errorId: action.errorId,
            errorParams: action.errorParams,
        }
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
