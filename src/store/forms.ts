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

export type Field<TValue> = {
    name: string;
    value: TValue;
    meta: FieldMeta;
};

export type Form<TForm> = {
    [K in keyof TForm]: Field<TForm[K]>
};

export type FormValues<TForm> = {
    [K in keyof TForm]: TForm[K];
};

//
// State
//

export interface FormsState {
    forms: {
        [name: string]: Form<any> | undefined;
    };
}

export const initialState: FormsState = {
    forms: {},
};

//
// Selectors
//

function getForm<TForm>(state: FormsState, name: string): Form<TForm> | undefined {
    const form = state.forms[name];
    return form as any;
}

function getFormValues<TForm>(state: FormsState, name: string): Form<TForm> | undefined {
    const form = state.forms[name];
    return form && form as any;
}

export const selectors = {
    getForm,
    getFormValues,
};

//
// Actions
//

export const FORMS_INIT_FORM = "FORMS:INIT_FORM";
export interface InitFormAction {
    type: typeof FORMS_INIT_FORM;
    name: string;
    initialValues: FormValues<any> | null;
}
function initForm<TForm>(name: string, initialValues: FormValues<TForm> | null = null): InitFormAction {
    return { type: FORMS_INIT_FORM, name, initialValues };
}
function initFormReducer(state: FormsState, action: InitFormAction): FormsState {
    const fields: { [name: string]: Field<any> } = {};
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
            [action.name]: fields,
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
    if (!form) {
        return state;
    }
    const field = form[action.field];
    const meta = action.meta || field.meta || metaValid();
    return {
        ...state,
        forms: {
            ...state.forms,
            [action.form]: {
                ...form,
                [action.field]: {
                    name: action.field,
                    value: action.value,
                    meta
                }
            }
        }
    };
}

function updateForm<TValue>(form: string, field: Field<TValue>) {
    return setFormValue(form, field.name, field.value, field.meta);
}

//
// Reducer
//

export const actions = {
    initForm,
    setFormValue,
    updateForm,
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
