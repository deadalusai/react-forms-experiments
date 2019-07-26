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

export type Field<TValue = any, TKey = any> = {
    name: TKey;
    value: TValue;
    meta: FieldMeta;
};

export type FormFields<TForm> = {
    [TKey in keyof TForm]: Field<TForm[TKey], TKey>
};

export type Form<TForm = any> = {
    name: string;
    initial: TForm;
    fields: FormFields<TForm>;
    meta: FormMeta;
};

export type FieldValidator<TValue = any> = (value: TValue) => ErrorType | null;

export type FormValidators<TForm = any> = {
    [TKey in keyof TForm]?: FieldValidator<TForm[TKey]>;
};

export type FieldOf<TForm, TKey extends keyof TForm = any, TValue extends TForm[TKey] = any> = Field<TValue, TKey>;

export function applyValidators<TForm, TKey extends keyof TForm, TValue extends TForm[TKey]>(
    formValidators: FormValidators<TForm>,
    field: Field<TValue, TKey>
): Field<TValue, TKey> {
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
// Validators
//

export function combineValidators<TValue>(...validators: FieldValidator<TValue>[]): FieldValidator<TValue> {
    return value => validators.reduce((error, validator) => error || validator(value), null as ErrorType | null);
}

function required(error = "ERROR.REQUIRED"): FieldValidator {
    return value => value === null || value === undefined || value === "" ? { error, params: { value } } : null;
}
function number(error = "ERROR.NOT_A_NUMBER"): FieldValidator {
    return value => isNaN(value) ? { error, params: { value } } : null;
}
function lessThanOrEqual(n: number, error = "ERROR.NOT_LESS_THAN_OR_EQUAL"): FieldValidator {
    return value => typeof value === "number" && value > n ? { error, params: { n, value } } : null;
}
function lessThan(n: number, error = "ERROR.NOT_LESS_THAN"): FieldValidator {
    return value => typeof value === "number" && value >= n ? { error, params: { n, value } } : null;
}
function greaterThanOrEqual(n: number, error = "ERROR.NOT_LESS_THAN_OR_EQUAL"): FieldValidator {
    return value => typeof value === "number" && value < n ? { error, params: { n, value } } : null;
}
function greaterThan(n: number, error = "ERROR.NOT_LESS_THAN"): FieldValidator {
    return value => typeof value === "number" && value <= n ? { error, params: { n, value } } : null;
}
function pattern(p: RegExp, error = "ERROR.PATTERN_NOT_MATCHED"): FieldValidator {
    return value => (typeof value === "string") && !p.test(value) ? { error, params: { value } } : null;
}

export const validators = {
    required,
    number,
    lessThanOrEqual,
    lessThan,
    greaterThanOrEqual,
    greaterThan,
    pattern,
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
    form: Form;
}
function initForm<TForm>(name: string, initialValues: TForm, formValidators?: FormValidators<TForm>): InitFormAction {
    const form = createForm<any>(name, initialValues, formValidators);
    return { type: FORMS_INIT_FORM, form };
}
function initFormReducer(state: FormsState, action: InitFormAction): FormsState {
    return {
        ...state,
        forms: {
            ...state.forms,
            [action.form.name]: action.form,
        }
    };
}

export const FORMS_UPDATE_FORM = "FORMS:SET_FORM_VALUE";
export interface UpdateFormAction {
    type: typeof FORMS_UPDATE_FORM;
    name: string;
    field: Field;
}
function updateForm(name: string, field: Field, formValidators?: FormValidators): UpdateFormAction {
    return {
        type: FORMS_UPDATE_FORM,
        name,
        field: formValidators ? applyValidators(formValidators, field) : field
    };
}
function updateFormReducer(state: FormsState, action: UpdateFormAction): FormsState {
    const form = state.forms[action.name];
    if (!form) {
        return state;
    }
    const field = action.field;
    const meta: FieldMeta = {
        valid: field.meta.valid,
        touched: field.meta.touched,
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

export const FORMS_TOUCH_FORM = "FORMS:TOUCH_FORM";
export interface TouchFormAction {
    type: typeof FORMS_TOUCH_FORM;
    name: string;
}
function touchForm(name: string): TouchFormAction {
    return { type: FORMS_TOUCH_FORM, name };
}
function touchFormReducer(state: FormsState, action: TouchFormAction): FormsState {
    const form = state.forms[action.name];
    if (!form) {
        return state;
    }
    const fields = { ...form.fields };
    for (const name in fields) {
        fields[name] = {
            ...fields[name],
            meta: {
                ...fields[name].meta,
                touched: true,
            }
        };
    }
    const meta = {
        ...form.meta,
        touched: true
    };
    return {
        ...state,
        forms: {
            ...state.forms,
            [form.name]: {
                ...form,
                fields,
                meta
            },
        }
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
