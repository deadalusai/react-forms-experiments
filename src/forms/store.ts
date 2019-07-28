import { ActionsFrom, assertNever } from "util";
import { Form } from "forms";

//
// State
//

export interface FormsState {
    [name: string]: Form<any> | undefined;
}

export const initialState: FormsState = {};

//
// Selectors
//

function getForm<TForm>(state: FormsState, name: string): Form<TForm> | undefined {
    return state[name] as any;
}

export const selectors = {
    getForm,
};

//
// Actions
//

export const FORMS_INIT_FORM = "FORMS:INIT_FORM";
export interface InitFormAction {
    type: typeof FORMS_INIT_FORM;
    form: Form;
}
function initForm(form: Form): InitFormAction {
    return { type: FORMS_INIT_FORM, form };
}
function initFormReducer(state: FormsState, action: InitFormAction): FormsState {
    return {
        ...state,
        [action.form.name]: action.form,
    };
}

export const FORMS_UPDATE_FORM = "FORMS:UPDATE_FORM";
export interface UpdateFormAction {
    type: typeof FORMS_UPDATE_FORM;
    form: Form;
}
function updateForm(form: Form): UpdateFormAction {
    return { type: FORMS_UPDATE_FORM, form };
}
function updateFormReducer(state: FormsState, action: UpdateFormAction): FormsState {
    let form = state[action.form.name];
    if (!form) {
        // Form not initialised?
        return state;
    }
    return {
        ...state,
        [form.name]: action.form,
    };
}

//
// Reducer
//

export const actions = {
    initForm,
    updateForm,
};

export function reducer(state: FormsState | undefined, action: ActionsFrom<typeof actions>) {
    if (!state) {
        return initialState;
    }
    switch (action.type) {
        case FORMS_INIT_FORM:
            return initFormReducer(state, action);
        case FORMS_UPDATE_FORM:
            return updateFormReducer(state, action);
        default:
            assertNever(action);
    }
    return state;
}
