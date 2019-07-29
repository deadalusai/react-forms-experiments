//
// Forms
//

export interface FieldError {
    error: string;
    params?: any;
};

export interface FieldMeta {
    readonly valid: boolean;
    readonly visited: boolean;
    readonly touched: boolean;
    readonly focused: boolean;
    readonly dirty: boolean;
    readonly disabled: boolean;
    readonly error: FieldError | null;
}

export type FormErrors<TForm> = {
    [key in keyof TForm]?: FieldError;
};

export interface FormMeta {
    readonly valid: boolean;
    readonly touched: boolean;
    readonly dirty: boolean;
    readonly disabled: boolean;
}

export type Field<TValue = any, TKey = any> = {
    readonly name: TKey;
    readonly value: TValue;
    readonly meta: FieldMeta;
};

export type FormFields<TForm = any> = {
    readonly [TKey in keyof TForm]: Field<TForm[TKey], TKey>
};

export type Form<TForm = any> = {
    readonly name: string;
    readonly initial: TForm;
    readonly current: TForm;
    readonly fields: FormFields<TForm>;
    readonly meta: FormMeta;
};

export type FieldValidator<TValue = any> = (value: TValue) => FieldError | null;
export type FormValidator<TForm = any> = (form: TForm) => FormErrors<TForm>;

//
// Functions
//

export const keysOf = Object.keys as <T>(obj: T) => (keyof T)[];

/**
 * Initialises a new form object.
 * @param name The name of the form.
 * @param initial The initial state of the form.
 * @param validator If provided, this form validator is used to calculate the initial form validation state.
 */
export function formInit<TForm>(name: string, initial: TForm, validator?: FormValidator<TForm>): Form<TForm> {
    const fields: Partial<FormFields<TForm>> = {};
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
            disabled: false,
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
        fields: fields as FormFields<TForm>,
        meta: {
            valid,
            touched: false,
            dirty: false,
            disabled: false,
        }
    };
}

export type FieldUpdate<TForm = any, TValue = any> = {
    name: keyof TForm,
    value?: TValue;
    visited?: boolean;
    touched?: boolean;
    focused?: boolean;
    disabled?: boolean;
};

/**
 * Updates the given form with the given field data.
 * NOTE: Field dirty state is always calulcated based on the initial state of the form.
 * @param form The form to update
 * @param name The field in the form to update.
 */
export function formUpdateField<TForm>(form: Form<TForm>, update: FieldUpdate<TForm>): Form<TForm> {
    const name = update.name;
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
        disabled: "disabled" in update ? update.disabled! : field.meta.disabled,
        dirty: value != form.initial[name],
    };
    // Calculate new form meta
    const metaFor = (fieldName: keyof TForm) => fieldName === name ? fieldMeta : form.fields[fieldName].meta;
    const names = keysOf(form.fields);
    const formMeta = {
        ...form.meta,
        touched: names.reduce((touched, name) => touched || metaFor(name).touched, false),
        dirty: names.reduce((dirty, name) => dirty || metaFor(name).dirty, false),
        disabled: names.reduce((disabled, name) => disabled && metaFor(name).disabled, true),
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
export function formUpdateErrors<TForm>(form: Form<TForm>, errors: FormErrors<TForm>): Form<TForm> {
    let valid = true;
    // Calculate new field meta
    const fields: Partial<FormFields<TForm>> = {};
    const names = keysOf(form.fields);
    for (const name of names) {
        const field = form.fields[name];
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
        fields: fields as FormFields<TForm>,
        meta: {
            ...form.meta,
            valid,
        },
    };
}

export interface FormUpdate {
    visited?: boolean;
    touched?: boolean;
    focused?: boolean;
    disabled?: boolean;
}

/**
 * Applies the given update to all fields in the form.
 * @param form The form to update.
 * @param update The update to apply.
 */
export function formUpdateAllFields<TForm>(form: Form<TForm>, update: FormUpdate): Form<TForm> {
    // Touch all fields in the form
    const fields: Partial<FormFields<TForm>> = {};
    for (const name of keysOf(form.fields)) {
        const field = form.fields[name];
        fields[name] = {
            ...field,
            meta: {
                ...field.meta,
                ...update
            }
        };
    }
    return {
        ...form,
        meta: {
            ...form.meta,
            ...update
        },
        fields: fields as FormFields<TForm>,
    };
}
