import { ActionsFrom, assertNever } from "util";
import { Form, FormValidators, createForm, Field, updateFormField, touchFormFields, validateField } from "forms";

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
function initForm<TForm>(name: string, initialValues: TForm, formValidators?: FormValidators<TForm>): InitFormAction {
    const form = createForm<any>(name, initialValues, formValidators);
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
    name: string;
    field: Field;
}
function updateForm(name: string, field: Field, validators?: FormValidators): UpdateFormAction {
    return {
        type: FORMS_UPDATE_FORM,
        name,
        field: validators ? validateField(field, validators) : field
    };
}
function updateFormReducer(state: FormsState, action: UpdateFormAction): FormsState {
    const form = state[action.name];
    if (!form) {
        return state;
    }
    return {
        ...state,
        [form.name]: updateFormField(form, action.field),
    };
}

export const FORMS_TOUCH_FORM = "FORMS:TOUCH_FORM";
export interface TouchFormAction {
    type: typeof FORMS_TOUCH_FORM;
    name: string;
}
function touchForm(name: string): TouchFormAction {
    return { type: FORMS_TOUCH_FORM, name };
}
function touchFormReducer(state: FormsState, action: TouchFormAction): FormsState {
    const form = state[action.name];
    if (!form) {
        return state;
    }
    return {
        ...state,
        [form.name]: touchFormFields(form),
    };
}

//
// Reducer
//

export const actions = {
    initForm,
    updateForm,
    touchForm,
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
        case FORMS_TOUCH_FORM:
            return touchFormReducer(state, action);
        default:
            assertNever(action);
    }
    return state;
}
