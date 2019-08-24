import { ActionsFrom } from "util";
import { Form, FormErrors, formUpdateErrors, FormUpdateErrorsEvent } from "../core";

//
// State
//

export interface FormsState {
    [name: string]: Form<any> | undefined;
}

export const initialState: FormsState = {};

//
// Actions
//

const FORMS_SET_FORM = "FORMS:SET_FORM";
export interface SetFormAction {
    type: typeof FORMS_SET_FORM;
    form: Form;
}
function setForm(form: Form): SetFormAction {
    return { type: FORMS_SET_FORM, form };
}
function setFormReducer(state: FormsState, action: SetFormAction): FormsState {
    return {
        ...state,
        [action.form.name]: action.form,
    };
}

const FORMS_SET_FORM_ERRORS = "FORMS:SET_FORM_ERRORS";
export interface SetFormErrorsAction {
    type: typeof FORMS_SET_FORM_ERRORS;
    formName: string;
    formErrors: FormErrors<any>;
}
function setFormErrors(formName: string, formErrors: FormErrors<any>): SetFormErrorsAction {
    return { type: FORMS_SET_FORM_ERRORS, formName, formErrors };
}
function setFormErrorsReducer(state: FormsState, action: SetFormErrorsAction): FormsState {
    let form = state[action.formName];
    if (!form) {
        return state;
    }
    const event: FormUpdateErrorsEvent = { type: "SETERRORS" };
    form = formUpdateErrors(form, action.formErrors, event);
    return {
        ...state,
        [action.formName]: form,
    };
}

//
// Reducer
//

export const actions = {
    setForm,
    setFormErrors,
};

export function reducer(state: FormsState | undefined, action: ActionsFrom<typeof actions>) {
    if (!state) {
        return initialState;
    }
    switch (action.type) {
        case FORMS_SET_FORM: return setFormReducer(state, action);
        case FORMS_SET_FORM_ERRORS: return setFormErrorsReducer(state, action);
        default:
            const _: never = action;
    }
    return state;
}
