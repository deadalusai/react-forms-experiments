//
// Forms
//

export interface FieldError {
    /** An error identifier or resource code */
    error: string;
    /** Format parameters for the error */
    params?: any;
    /** If set, this error will only be cleared by another error or a CHANGE event on the field. */
    sticky?: true;
}

/** Represents an asynchronous validation operation in progress */
export interface AsyncValidationMarker {
    async: number;
}

function isFieldError(e: FieldError | AsyncValidationMarker | undefined): e is FieldError {
    return e != null && typeof e === "object" && "error" in e;
}

function isAsyncValidationMarker(e: FieldError | AsyncValidationMarker | undefined): e is AsyncValidationMarker {
    return e != null && typeof e === "object" && "async" in e;
}

export type FieldErrorMap<TForm = any> = {
    [TKey in keyof TForm]?: FieldError | AsyncValidationMarker;
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
    readonly visited: boolean;
    readonly touched: boolean;
    readonly dirty: boolean;
    readonly disabled: boolean;
    readonly validating: boolean;
    readonly focused: string | null; // The name of the field which currently holds focus
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
            visited: false,
            valid: true,
            validating: false,
            touched: false,
            dirty: false,
            disabled: false,
            focused: null,
        },
    };
}

export type FieldUpdate<TValue = any, TForm = any> = {
    name: keyof TForm,
    source?: "FOCUS" | "BLUR" | "CHANGE",
    value?: TValue,
    disabled?: boolean,
};

/**
 * Updates the given form with the given field data.
 * NOTE: Field dirty state is always calulcated based on the initial state of the form.
 * @param form The form to update
 * @param updates A list of field updates to apply.
 */
export function formUpdateField<TForm>(form: Form<TForm>, update: FieldUpdate<any, TForm>): Form<TForm> {
    const name = update.name;
    const field = form.fields[update.name];
    if (!field) {
        return form;
    }
    const value = "value" in update ? update.value! : field.value;
    // Calculate new field metadata
    const meta: FieldMeta = {
        ...field.meta,
        touched: field.meta.touched || update.source === "CHANGE",
        visited: field.meta.visited || update.source === "BLUR",
        focused: (
            update.source === "FOCUS" ? true :
            update.source === "BLUR" ? false : field.meta.focused
        ),
        disabled: "disabled" in update ? update.disabled! : field.meta.disabled,
        dirty: value != form.initial[name],
    };
    // Calculate new form metadata
    const metaFor = (fieldName: keyof TForm) => fieldName === name ? meta : form.fields[fieldName].meta;
    const names = keysOf(form.fields);
    const formMeta: FormMeta = {
        ...form.meta,
        touched: names.reduce((touched, name) => touched || metaFor(name).touched, false as boolean),
        dirty: names.reduce((dirty, name) => dirty || metaFor(name).dirty, false as boolean),
        disabled: names.reduce((disabled, name) => disabled && metaFor(name).disabled, false as boolean),
        focused: names.find((name) => metaFor(name).focused) as string || null,
    };
    return {
        ...form,
        current: {
            ...form.current,
            [name]: value,
        },
        fields: {
            ...form.fields,
            [name]: { ...field, value, meta }
        },
        meta: formMeta,
    };
}

export interface FormValidationEventSource {
    type: "INIT" | "BLUR" | "CHANGE";
    fieldName?: string;
}

/**
 * Updates the error state of each field in the form.
 * @param form The form to update
 * @param errors Current field error information.
 */
export function formUpdateErrors<TForm>(form: Form<TForm>, errorMap: FieldErrorMap<TForm>, source: FormValidationEventSource): Form<TForm> {
    let formValid = true;
    let formValidating = false;
    // Calculate new field/form meta
    const fields: Partial<FormFields<TForm>> = {};
    for (const name of keysOf(form.fields)) {
        const field = form.fields[name];
        const newError = errorMap[name];
        const oldError = field.meta.error;
        const invalid = isFieldError(newError);
        const error = (
            // New errors supercede everything
            (invalid) ? newError :
            // A CHANGE event on this field always resets the error
            (source.type === "CHANGE" && source.fieldName === name) ? null :
            // Otherwise, existing "sticky" errors are retained
            (oldError && oldError.sticky) ? oldError : null
        );
        // The `validating` flag is set when async validation begins and cleared only when
        // receiving a concrete error or by `formCompleteAsyncValidation`
        const validating = (
            isAsyncValidationMarker(newError)
                ? true
                : invalid ? false : field.meta.validating
        );
        fields[name] = {
            ...field,
            meta: {
                ...field.meta,
                validating,
                valid: !error,
                error,
            },
        };
        if (invalid) {
            formValid = false;
        }
        if (validating) {
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
export function formCompleteAsyncValidation<TForm>(form: Form<TForm>, name: keyof TForm, error: FieldError | null) {
    const field = form.fields[name];
    if (!field) {
        return form;
    }
    // Calculate new field meta.
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
    touched?: boolean;
    disabled?: boolean;
    visited?: boolean;
}

/**
 * Applies the given update to all fields in the form.
 * @param form The form to update.
 * @param update The update to apply.
 */
export function formUpdateAll<TForm>(form: Form<TForm>, update: FormUpdate): Form<TForm> {
    // Touch all fields in the form
    const fields: Partial<FormFields<TForm>> = {};
    for (const name of keysOf(form.fields)) {
        const field = form.fields[name];
        fields[name] = {
            ...field,
            meta: {
                ...field.meta,
                touched: "touched" in update ? update.touched! : field.meta.touched,
                disabled: "disabled" in update ? update.disabled! : field.meta.disabled,
                visited: "visited" in update ? update.visited! : field.meta.visited,
            }
        };
    }
    return {
        ...form,
        meta: {
            ...form.meta,
            touched: "touched" in update ? update.touched! : form.meta.touched,
            disabled: "disabled" in update ? update.disabled! : form.meta.disabled,
            visited: "visited" in update ? update.visited! : form.meta.visited,
        },
        fields: fields as FormFields<TForm>,
    };
}
