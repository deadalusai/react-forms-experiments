import { ActionsFrom, assertNever } from "util";

export interface ErrorType {
    error: string;
    params?: any;
};

export interface FieldMeta {
    valid: boolean;
    touched: boolean;
    dirty: boolean;
    error: ErrorType | null;
}

export interface FormMeta {
    valid: boolean;
    touched: boolean;
    dirty: boolean;
}

export type Field<TKey = any, TValue = any> = {
    name: TKey;
    value: TValue;
    meta: FieldMeta;
};

export type FormFields<TForm> = {
    [TKey in keyof TForm]: Field<TKey, TForm[TKey]>
};

export type Form<TForm = any> = {
    name: string;
    initial: TForm;
    fields: FormFields<TForm>;
    meta: FormMeta;
};

export type FieldValidator<TValue> = (value: TValue) => ErrorType | null;

export type FormValidators<TForm> = {
    [TKey in keyof TForm]?: FieldValidator<TForm[TKey]>;
};

export type FieldOf<TForm, TKey extends keyof TForm = any, TValue extends TForm[TKey] = any> = Field<TKey, TValue>;

export function applyValidators<TForm, TKey extends keyof TForm, TValue extends TForm[TKey]>(
    formValidators: FormValidators<TForm>,
    field: Field<TKey, TValue>
): Field<TKey, TValue> {
    const validator = formValidators[field.name];
    if (validator) {
        const error = validator(field.value);
        if (error) {
            return {
                ...field,
                meta: { ...field.meta, valid: false, error },
            };
        }
    }
    return {
        ...field,
        meta: { ...field.meta, valid: true, error: null }
    };
}

export function createForm<TForm>(name: string, initial: TForm, validators?: FormValidators<TForm>): Form<TForm> {
    const fields: FormFields<TForm> = {} as any;
    let valid = true;
    for (const name in initial) {
        const value = initial[name];
        const validator = validators && validators[name];
        const error = validator && validator(value) || null;
        const meta = {
            valid: error === null,
            touched: false,
            dirty: false,
            error
        };
        fields[name] = { name, value, meta };
        if (error) {
            valid = false;
        }
    }
    return { name, initial, fields, meta: { valid, touched: false, dirty: false } };
}

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
    return state.forms[name] as any;
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
    name: string;
    initialValues: any;
    formValidators?: FormValidators<any>;
}
function initForm<TForm>(name: string, initialValues: TForm, formValidators?: FormValidators<TForm>): InitFormAction {
    return { type: FORMS_INIT_FORM, name, initialValues, formValidators };
}
function initFormReducer(state: FormsState, action: InitFormAction): FormsState {
    return {
        ...state,
        forms: {
            ...state.forms,
            [action.name]: createForm(action.name, action.initialValues, action.formValidators),
        }
    };
}

export const FORMS_UPDATE_FORM = "FORMS:SET_FORM_VALUE";
export interface SetFormValueAction {
    type: typeof FORMS_UPDATE_FORM;
    form: Form;
    field: Field;
}
function updateForm<TForm, TKey extends keyof TForm, TValue extends TForm[TKey]>(
    form: Form<TForm>,
    field: Field<TKey, TValue>,
    formValidators?: FormValidators<TForm>
): SetFormValueAction {
    return {
        type: FORMS_UPDATE_FORM,
        form: form as any,
        field: formValidators ? applyValidators(formValidators, field) : field
    };
}
function updateFormReducer(state: FormsState, action: SetFormValueAction): FormsState {
    const form = state.forms[action.form.name];
    if (!form) {
        return state;
    }
    const field = action.field;
    const meta: FieldMeta = {
        valid: field.meta.valid,
        touched: field.meta.touched || field.value != form.initial[field.name],
        dirty: field.value != form.initial[field.name],
        error: field.meta.error
    };
    // Calculate form meta
    const fieldNames = Object.keys(form.fields);
    const fieldMeta = (fieldName: any) => {
        return fieldName === field.name ? meta : form.fields[fieldName].meta;
    }
    const formValid = fieldNames.reduce((valid, name) => valid && fieldMeta(name).valid, true);
    const formTouched = fieldNames.reduce((touched, name) => touched || fieldMeta(name).touched, false);
    const formDirty = fieldNames.reduce((dirty, name) => dirty || fieldMeta(name).dirty, false);
    return {
        ...state,
        forms: {
            ...state.forms,
            [form.name]: {
                ...form,
                meta: {
                    valid: formValid,
                    touched: formTouched,
                    dirty: formDirty,
                },
                fields: {
                    ...form.fields,
                    [field.name]: {
                        ...field,
                        meta,
                    },
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
