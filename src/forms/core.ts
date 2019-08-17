//
// Forms
//

export interface FieldError {
    error: string;
    params?: any;
}

export interface AsyncFieldError {
    id: number;
}

function isFieldError(e: any): e is FieldError {
    return typeof e === "object" && "error" in e;
}

function isAsyncFieldError(e: any): e is AsyncFieldError {
    return typeof e === "object" && "id" in e;
}

export type FieldErrorMap<TForm = any> = {
    [TKey in keyof TForm]?: FieldError | AsyncFieldError;
};

export interface FieldMeta {
    readonly valid: boolean;
    readonly visited: boolean;
    readonly touched: boolean;
    readonly focused: boolean;
    readonly dirty: boolean;
    readonly disabled: boolean;
    readonly validating: boolean;
    readonly error: FieldError | null;
}

export interface FormMeta {
    readonly valid: boolean;
    readonly touched: boolean;
    readonly dirty: boolean;
    readonly disabled: boolean;
    readonly validating: boolean;
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
export function formInit<TForm>(name: string, initial: TForm): Form<TForm> {
    const fields: Partial<FormFields<TForm>> = {};
    for (const name of keysOf(initial)) {
        const value = initial[name];
        const meta: FieldMeta = {
            valid: true,
            validating: false,
            visited: false,
            touched: false,
            focused: false,
            dirty: false,
            disabled: false,
            error: null,
        };
        fields[name] = { name, value, meta };
    }
    return {
        name,
        initial,
        current: initial,
        fields: fields as FormFields<TForm>,
        meta: {
            valid: true,
            validating: false,
            touched: false,
            dirty: false,
            disabled: false,
        }
    };
}

export type FieldUpdate<TValue = any, TForm = any> = {
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
 * @param updates A list of field updates to apply.
 */
export function formUpdateFields<TForm>(form: Form<TForm>, updates: FieldUpdate<any, TForm>[]): Form<TForm> {
    const newValues: Partial<TForm> = {};
    const newFields: Partial<FormFields<TForm>> = {};
    for (const update of updates) {
        const name = update.name;
        const field = form.fields[name];
        if (!field) {
            continue;
        }
        const value = "value" in update ? update.value! : field.value;
        // Calculate new field meta
        const meta: FieldMeta = {
            ...field.meta,
            touched: "touched" in update ? update.touched! : field.meta.touched,
            focused: "focused" in update ? update.focused! : field.meta.focused,
            visited: "visited" in update ? update.visited! : field.meta.visited,
            disabled: "disabled" in update ? update.disabled! : field.meta.disabled,
            dirty: value != form.initial[name],
        };
        newValues[name] = value;
        newFields[name] = { name, value, meta };
    }
    // Calculate new form meta
    const metaFor = (fieldName: keyof TForm) => ((newFields[fieldName] as any) || form.fields[fieldName]).meta;
    const names = keysOf(form.fields);
    const formMeta: FormMeta = {
        ...form.meta,
        touched: names.reduce((touched, name) => touched || metaFor(name).touched, false),
        dirty: names.reduce((dirty, name) => dirty || metaFor(name).dirty, false),
        disabled: names.reduce((disabled, name) => disabled && metaFor(name).disabled, false),
    };
    return {
        ...form,
        current: {
            ...form.current,
            ...newValues,
        },
        fields: {
            ...form.fields,
            ...newFields,
        },
        meta: formMeta,
    };
}

/**
 * Updates the error state of each field in the form.
 * @param form The form to update
 * @param errors Current field error information.
 */
export function formUpdateErrors<TForm>(form: Form<TForm>, errorMap: FieldErrorMap<TForm>): Form<TForm> {
    let formValid = true;
    let formValidating = false;
    // Calculate new field/form meta
    const fields: Partial<FormFields<TForm>> = {};
    for (const name of keysOf(form.fields)) {
        const field = form.fields[name];
        const error = errorMap[name];
        const isAsync = isAsyncFieldError(error);
        const isError = isFieldError(error);
        fields[name] = {
            ...field,
            meta: {
                ...field.meta,
                validating: isAsync,
                valid: isError === false,
                error: isError ? error : null,
            },
        };
        if (isError) {
            formValid = false;
        }
        if (isAsync) {
            formValidating = true;
        }
    }
    return {
        ...form,
        fields: fields as FormFields<TForm>,
        meta: {
            ...form.meta,
            valid: formValid,
            validating: formValidating,
        },
    };
}

/**
 * Updates the error state of a single field in the form after it has completed async validation.
 * @param form The form to update
 * @param name The name of the field to update.
 * @param error The error to write to the field.
 */
export function formCompleteAsyncError<TForm>(form: Form<TForm>, name: keyof TForm, error: FieldError | null) {
    const field = form.fields[name];
    if (!field) {
        return form;
    }
    // Local synchronous validation may have already written a new error.
    // If so, we have to throw this asynchronous validation result away.
    if (field.meta.error) {
        return form;
    }
    // Calculate new field meta
    const meta: FieldMeta = {
        ...field.meta,
        validating: false,
        valid: !error,
        error,
    };
    // Calculate new form meta
    const metaFor = (fieldName: keyof TForm) => (name === fieldName) ? meta : form.fields[name].meta;
    const names = keysOf(form.fields);
    const formMeta: FormMeta = {
        ...form.meta,
        validating: names.reduce((validating, name) => validating && metaFor(name).validating, false),
        disabled: names.reduce((disabled, name) => disabled && metaFor(name).disabled, false),
    };
    return {
        ...form,
        fields: {
            ...form.fields,
            [name]: {
                ...field,
                meta,
            },
        },
        meta: formMeta,
    };
}

export interface FormUpdate {
    visited?: boolean;
    touched?: boolean;
    focused?: boolean;
    disabled?: boolean;
    validating?: boolean;
}

/**
 * Applies the given update to all fields in the form.
 * @param form The form to update.
 * @param update The update to apply.
 */
export function formUpdate<TForm>(form: Form<TForm>, update: FormUpdate): Form<TForm> {
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
