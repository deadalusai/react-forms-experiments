import { ActionsFrom, assertNever } from "util";

export interface FieldMeta {
    valid: boolean;
    errorId?: string;
    errorParams?: string;
}

export function metaValid(): FieldMeta {
    return { valid: true };
}
export function metaError(errorId: string, errorParams?: string): FieldMeta {
    return { valid: false, errorId, errorParams };
}

export interface FieldData {
    name: string;
    value: any;
    meta: FieldMeta;
}

export interface FormData {
    name: string;
    fields: {
        [name: string]: FieldData;
    }
}

export interface FormValues {
    [name: string]: any;
}

//
// State
//

export interface FormsState {
    forms: {
        [name: string]: FormData;
    };
}

export const initialState: FormsState = {
    forms: {},
};

//
// Actions
//

export const FORMS_INIT_FORM = "FORMS:INIT_FORM";
export interface InitFormAction {
    type: typeof FORMS_INIT_FORM;
    name: string;
    initialValues: FormValues | null;
}
function initForm(name: string, initialValues: FormValues | null = null): InitFormAction {
    return { type: FORMS_INIT_FORM, name, initialValues };
}
function initFormReducer(state: FormsState, action: InitFormAction): FormsState {
    const fields: { [name: string]: FieldData } = {};
    if (action.initialValues) {
        for (const name in action.initialValues) {
            fields[name] = {
                name,
                value: action.initialValues[name],
                meta: metaValid(),
            };
        }
    }
    return {
        ...state,
        forms: {
            ...state.forms,
            [action.name]: {
                name: action.name,
                fields,
            }
        }
    };
}

export const FORMS_SET_FORM_VALUE = "FORMS:SET_FORM_VALUE";
export interface SetFormValueAction {
    type: typeof FORMS_SET_FORM_VALUE;
    form: string;
    field: string;
    value: any;
    meta?: FieldMeta;
}
function setFormValue(form: string, field: string, value: any, meta?: FieldMeta): SetFormValueAction {
    return { type: FORMS_SET_FORM_VALUE, form, field, value, meta };
}
function setFormValueReducer(state: FormsState, action: SetFormValueAction): FormsState {
    const form = state.forms[action.form];
    const field = form.fields[action.field];
    const meta = action.meta || field.meta || metaValid();
    return {
        ...state,
        forms: {
            ...state.forms,
            [action.form]: {
                ...form,
                fields: {
                    ...form.fields,
                    [action.field]: {
                        name: action.field,
                        value: action.value,
                        meta
                    }
                }
            }
        }
    };
}

//
// Reducer
//

export const actions = {
    initForm,
    setFormValue,
};

export function reducer(state: FormsState | undefined, action: ActionsFrom<typeof actions>) {
    if (!state) {
        return initialState;
    }
    switch (action.type) {
        case FORMS_INIT_FORM:
            return initFormReducer(state, action);
        case FORMS_SET_FORM_VALUE:
            return setFormValueReducer(state, action);
        default:
            assertNever(action);
    }
    return state;
}
