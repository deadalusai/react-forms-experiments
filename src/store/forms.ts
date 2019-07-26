import { ActionsFrom, assertNever } from "util";

export interface FieldMeta {
    valid: boolean;
    errorId?: string;
    errorParams?: any;
}

export function metaValid(): FieldMeta {
    return { valid: true };
}
export function metaInvalid(errorId: string, errorParams?: string): FieldMeta {
    return { valid: false, errorId, errorParams };
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
    fields: FormFields<TForm>;
};

export type FieldValidator<TValue> = (value: TValue) => { errorId: string, errorParams?: any } | null;

export type FormValidators<TForm> = {
    [TKey in keyof TForm]?: FieldValidator<TForm[TKey]>;
};

export type FieldOf<TForm, TKey extends keyof TForm = any, TValue extends TForm[TKey] = any> = Field<TKey, TValue>;

export function applyValidators<TForm, TKey extends keyof TForm, TValue extends TForm[TKey]>(formValidators: FormValidators<TForm>, field: Field<TKey, TValue>) {
    const validator = formValidators[field.name];
    if (validator) {
        const error = validator(field.value);
        if (error) {
            return { ...field, meta: metaInvalid(error.errorId, error.errorParams) };
        }
    }
    return { ...field, meta: metaValid() };
}

export function createForm<TForm>(name: string, data: TForm, validators?: FormValidators<TForm>): Form<TForm> {
    const fields: FormFields<TForm> = {} as any;
    for (const name in data) {
        const value = data[name];
        const validator = validators && validators[name];
        const error = validator && validator(value);
        const meta = error ? metaInvalid(error.errorId, error.errorParams) : metaValid();
        fields[name] = { name, value, meta };
    }
    return { name, fields };
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
    const field = form.fields[action.field.name];
    return {
        ...state,
        forms: {
            ...state.forms,
            [form.name]: {
                ...form,
                fields: {
                    ...form.fields,
                    [field.name]: action.field,
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
