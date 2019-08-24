import { ActionsFrom } from "util";

export enum FooType {
    foo1 = 1, 
    foo2 = 2, 
    foo3 = 3,
}
export enum BarType {
    bar1 = "first", 
    bar2 = "second", 
    bar3 = "third",
}
export enum BazType {
    baz1 = "aaa", 
    baz2 = "bbb", 
    baz3 = "ccc",
}
export interface MyForm {
    text1: string;
    text2: string;
    checkbox1: boolean;
    checkbox2: BazType | null;
    select1: FooType | null;
    select2: FooType[];
    radio1: BarType | null;
}

//
// Store
//

export interface MyFormState {
    submitting: boolean;
}

export const initialState: MyFormState = {
    submitting: false,
};

//
// Actions
//

export const MYFORM_SAVE_CHANGES = "MYFORM:SAVE_CHANGES";
export interface ISaveChangesAction {
    type: typeof MYFORM_SAVE_CHANGES;
    formName: string;
    formData: MyForm;
}
const saveChanges = (formName: string, formData: MyForm): ISaveChangesAction => {
    return { type: MYFORM_SAVE_CHANGES, formName, formData };
};
const saveChangesReducer = (state: MyFormState, _action: ISaveChangesAction): MyFormState => {
    return {
        ...state,
        submitting: true,
    };
};

export const MYFORM_SAVE_CHANGES_COMPLETE = "MYFORM:SAVE_CHANGES_COMPLETE";
export interface ISaveChangesCompleteAction {
    type: typeof MYFORM_SAVE_CHANGES_COMPLETE;
    formName: string;
}
const saveChangesComplete = (formName: string): ISaveChangesCompleteAction => {
    return { type: MYFORM_SAVE_CHANGES_COMPLETE, formName };
};
const saveChangesCompleteReducer = (state: MyFormState, _action: ISaveChangesCompleteAction): MyFormState => {
    return {
        ...state,
        submitting: false,
    };
};

export const actionCreators = {
    saveChanges,
    saveChangesComplete,
};

//
// Reducer
//

export const reducer = (state: MyFormState | undefined, action: ActionsFrom<typeof actionCreators>): MyFormState => {
    if (!state) {
        return initialState;
    }
    switch (action.type) {
        case MYFORM_SAVE_CHANGES: return saveChangesReducer(state, action);
        case MYFORM_SAVE_CHANGES_COMPLETE: return saveChangesCompleteReducer(state, action);
        default:
            const _: never = action;
    }
    return state;
};