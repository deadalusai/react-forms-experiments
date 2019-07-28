//
// Forms
//

export interface FormError {
    error: string;
    params?: any;
};

export interface FieldMeta {
    valid: boolean;
    touched: boolean;
    dirty: boolean;
    error: FormError | null;
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

export type FormFields<TForm = any> = {
    [TKey in keyof TForm]: Field<TForm[TKey], TKey>
};

export type Form<TForm = any> = {
    name: string;
    initial: TForm;
    fields: FormFields<TForm>;
    meta: FormMeta;
};

export type FieldValidator<TValue = any> = (value: TValue) => FormError | null;

export type FormValidators<TForm = any> = {
    [TKey in keyof TForm]?: FieldValidator<TForm[TKey]>;
};

export type FieldOf<TForm, TKey extends keyof TForm = any, TValue extends TForm[TKey] = any> = Field<TValue, TKey>;

//
// Functions
//

const keysOf = Object.keys as <T>(obj: T) => (keyof T)[];

/**
 * Calculates the new validation state of the given form field using the validation rules provided.
 * @param validators A validator map for the form this field belongs to.
 * @param field A field to calulate new validation state for.
 */
export function validateField<TForm, TKey extends keyof TForm, TValue extends TForm[TKey]>(
    field: Field<TValue, TKey>,
    validators: FormValidators<TForm>
): Field<TValue, TKey> {
    const validator = validators[field.name];
    const error = validator && validator(field.value) || null;
    return {
        ...field,
        meta: {
            ...field.meta,
            valid: error === null,
            error
        }
    };
}

/**
 * Updates the given field with a new value and marks it as touched.
 * @param field The field to touch
 * @param value The value to touch the field with
 */
export function touchField<TField extends Field>(field: TField, value: any): TField {
    return {
        ...field,
        value,
        meta: {
            ...field.meta,
            touched: true
        }
    };
}

/**
 * Initialises a new form object.
 * @param name The name of the form.
 * @param initial The initial state of the form.
 * @param validators If provided, this validator collection is used to calculate the initial validation state.
 */
export function createForm<TForm>(name: string, initial: TForm, validators?: FormValidators<TForm>): Form<TForm> {
    const fields: FormFields<TForm> = {} as any;
    let valid = true;
    for (const name of keysOf(initial)) {
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
    return {
        name,
        initial,
        fields,
        meta: {
            valid,
            touched: false,
            dirty: false
        }
    };
}

/**
 * Updates the given form with the given field data.
 * NOTE: Field dirty state is always calulcated based on the initial state of the form.
 * @param form The form to update
 * @param field The field in the form to update.
 */
export function updateFormField<TForm, TKey extends keyof TForm, TValue extends TForm[TKey]>(
    form: Form<TForm>,
    field: Field<TValue, TKey>
): Form<TForm> {
    // Calculate new field meta
    const fieldMeta = {
        valid: field.meta.valid,
        touched: field.meta.touched,
        dirty: field.value != form.initial[field.name],
        error: field.meta.error,
    };
    // Calculate new form meta
    const metaFor = (fieldName: keyof TForm) => fieldName === field.name ? fieldMeta : form.fields[fieldName].meta;
    const names = keysOf(form.fields);
    const formMeta = {
        valid: names.reduce((valid, name) => valid && metaFor(name).valid, true),
        touched: names.reduce((touched, name) => touched || metaFor(name).touched, false),
        dirty: names.reduce((dirty, name) => dirty || metaFor(name).dirty, false),
    };
    return {
        ...form,
        meta: formMeta,
        fields: {
            ...form.fields,
            [field.name]: {
                ...field,
                meta: fieldMeta,
            },
        }
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

export function combineValidators<TValue>(...validators: FieldValidator<TValue>[]): FieldValidator<TValue> {
    return value => validators.reduce((error, validator) => error || validator(value), null as FormError | null);
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