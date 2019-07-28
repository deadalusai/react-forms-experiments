//
// Forms
//

export interface FieldError {
    error: string;
    params?: any;
};

export interface FieldMeta {
    valid: boolean;
    visited: boolean;
    touched: boolean;
    focused: boolean;
    dirty: boolean;
    error: FieldError | null;
}

export type FormErrors<TForm> = {
    [key in keyof TForm]?: FieldError;
};

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

export type FormFields<TForm = any> = {
    [TKey in keyof TForm]: Field<TForm[TKey], TKey>
};

export type Form<TForm = any> = {
    name: string;
    initial: TForm;
    current: TForm;
    fields: FormFields<TForm>;
    meta: FormMeta;
};

export type FieldValidator<TValue = any> = (value: TValue) => FieldError | null;
export type FormValidator<TForm = any> = (form: TForm) => FormErrors<TForm>;

//
// Functions
//

const keysOf = Object.keys as <T>(obj: T) => (keyof T)[];

/**
 * Initialises a new form object.
 * @param name The name of the form.
 * @param initial The initial state of the form.
 * @param validator If provided, this form validator is used to calculate the initial form validation state.
 */
export function createForm<TForm>(name: string, initial: TForm, validator?: FormValidator<TForm>): Form<TForm> {
    const fields: FormFields<TForm> = {} as any;
    const errors = validator && validator(initial);
    let valid = true;
    for (const name of keysOf(initial)) {
        const value = initial[name];
        const error = errors && errors[name];
        const meta: FieldMeta = {
            valid: !error,
            visited: false,
            touched: false,
            focused: false,
            dirty: false,
            error: error! || null, // todo: TSC gets confused here - not sure why
        };
        fields[name] = { name, value, meta };
        if (error) {
            valid = false;
        }
    }
    return {
        name,
        initial,
        current: initial,
        fields,
        meta: {
            valid,
            touched: false,
            dirty: false
        }
    };
}

export type FieldChange<TValue = any> = {
    name: string,
    value?: TValue;
    visited?: boolean;
    touched?: boolean;
    focused?: boolean;
};

/**
 * Updates the given form with the given field data.
 * NOTE: Field dirty state is always calulcated based on the initial state of the form.
 * @param form The form to update
 * @param name The field in the form to update.
 */
export function updateFormField<TForm>(
    form: Form<TForm>,
    update: FieldChange,
): Form<TForm> {
    const name = update.name as keyof TForm;
    const field = form.fields[name];
    if (!field) {
        return form;
    }
    const value = "value" in update ? update.value! : field.value;
    // Calculate new field meta
    const fieldMeta = {
        ...field.meta,
        touched: "touched" in update ? update.touched! : field.meta.touched,
        focused: "focused" in update ? update.focused! : field.meta.focused,
        visited: "visited" in update ? update.visited! : field.meta.visited,
        dirty: value != form.initial[name],
    };
    // Calculate new form meta
    const metaFor = (fieldName: keyof TForm) => fieldName === name ? fieldMeta : form.fields[fieldName].meta;
    const names = keysOf(form.fields);
    const formMeta = {
        valid: form.meta.valid,
        touched: names.reduce((touched, name) => touched || metaFor(name).touched, false),
        dirty: names.reduce((dirty, name) => dirty || metaFor(name).dirty, false),
    };
    return {
        ...form,
        current: {
            ...form.current,
            [name]: value,
        },
        fields: {
            ...form.fields,
            [name]: {
                ...field,
                value,
                meta: fieldMeta,
            },
        },
        meta: formMeta,
    };
}

/**
 * Updates the given form with the given field data.
 * NOTE: Field dirty state is always calulcated based on the initial state of the form.
 * @param form The form to update
 * @param name The field in the form to update.
 */
export function updateFormErrors<TForm>(
    form: Form<TForm>,
    errors: FormErrors<TForm>,
): Form<TForm> {
    let valid = true;
    // Calculate new field meta
    const fields: FormFields<TForm> = { ...form.fields };
    const names = keysOf(form.fields);
    for (const name of names) {
        const field = fields[name];
        const error = errors[name];
        fields[name] = {
            ...field,
            meta: {
                ...field.meta,
                valid: !error,
                error,
            }
        };
        if (error) {
            valid = false;
        }
    }
    return {
        ...form,
        fields,
        meta: {
            ...form.meta,
            valid,
        },
    };
}

/**
 * Marks all fields in the form as touched.
 * @param form The form to touch
 */
export function touchFormFields<TForm>(form: Form<TForm>): Form<TForm> {
    // Touch all fields in the form
    const fields: FormFields<TForm> = {} as any;
    for (const name of keysOf(form.fields)) {
        fields[name] = {
            ...form.fields[name],
            meta: {
                ...form.fields[name].meta,
                touched: true,
            }
        };
    }
    return {
        ...form,
        meta: {
            ...form.meta,
            touched: true
        },
        fields,
    };
}

//
// Validators
//

export type FieldValidatorMap<TForm = any> = {
    [TKey in keyof TForm]?: FieldValidator<TForm[TKey]>;
};

export function createFormValidator<TForm>(fieldValidators: FieldValidatorMap<TForm>): (form: TForm) => FormErrors<TForm> {
    return (form: TForm) => {
        const errors: FormErrors<TForm> = {};
        for (const key of keysOf(form)) {
            const validator = fieldValidators[key];
            const error = validator && validator(form[key]);
            if (error) {
                errors[key] = error;
            }
        }
        return errors;
    };
}

export function combineValidators<TValue>(...validators: FieldValidator<TValue>[]): FieldValidator<TValue> {
    return value => validators.reduce((error, validator) => error || validator(value), null as FieldError | null);
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
function greaterThanOrEqual(n: number, error = "ERROR.NOT_GREATER_THAN_OR_EQUAL"): FieldValidator {
    return value => typeof value === "number" && value < n ? { error, params: { n, value } } : null;
}
function greaterThan(n: number, error = "ERROR.NOT_GREATER_THAN"): FieldValidator {
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