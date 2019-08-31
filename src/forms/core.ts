//
// Forms
//

export interface FieldError {
    /** An error identifier or resource code */
    error: string;
    /** Format parameters for the error */
    params?: any;
    /** If set, this error will only be cleared by another error or a CHANGE event on the field. */
    sticky?: boolean;
}

export type FormErrors<TForm> = {
    [key in keyof TForm]?: FieldError | null;
};

export interface FieldMeta {
    readonly valid: boolean;
    readonly visited: boolean;
    readonly touched: boolean;
    readonly focused: boolean;
    readonly dirty: boolean;
    readonly error: FieldError | null;
}

export interface FormMeta {
    readonly valid: boolean;
    readonly visited: boolean;
    readonly touched: boolean;
    readonly dirty: boolean;
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
    readonly initial: Readonly<TForm>;
    readonly current: Readonly<TForm>;
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
            visited: false,
            touched: false,
            focused: false,
            dirty: false,
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
            touched: false,
            dirty: false,
            focused: null,
        },
    };
}

export type FieldUpdate<TValue = any, TForm = any> = {
    name: keyof TForm,
    type: "FOCUS" | "BLUR" | "CHANGE",
    value?: TValue,
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
        touched: field.meta.touched || update.type === "CHANGE",
        visited: field.meta.visited || update.type === "BLUR",
        focused: (
            update.type === "FOCUS" ? true :
            update.type === "BLUR" ? false : field.meta.focused
        ),
        dirty: value != form.initial[name],
    };
    // Calculate new form metadata
    const metaFor = (fieldName: keyof TForm) => fieldName === name ? meta : form.fields[fieldName].meta;
    const names = keysOf(form.fields);
    const formMeta: FormMeta = {
        ...form.meta,
        dirty: names.reduce((dirty, name) => dirty || metaFor(name).dirty, false as boolean),
        touched: names.reduce((touched, name) => touched || metaFor(name).touched, false as boolean),
        visited: names.reduce((visited, name) => visited || metaFor(name).visited, false as boolean),
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

export interface FormUpdateErrorsEvent {
    type: "INIT" | "CHANGE" | "SETERRORS";
    fieldName?: string;
}

/**
 * Updates the error state of each field in the form.
 * @param form The form to update
 * @param errors Current field error information.
 * @param event Infomation about the event which triggered the update.
 */
export function formUpdateErrors<TForm>(form: Form<TForm>, errorMap: FormErrors<TForm>, event: FormUpdateErrorsEvent): Form<TForm> {
    // SETERRORS only updates the fields mentioned in the error map
    // Other events update the entire form
    const namesToUpdate = (event.type === "SETERRORS")
        ? keysOf(errorMap)
        : keysOf(form.fields);
    // Calculate new field/form meta
    const newFields = { ...form.fields };
    for (const name of namesToUpdate) {
        const field = form.fields[name];
        const newError = errorMap[name] as FieldError | null;
        const oldError = field.meta.error;
        const error = (
            // New errors take precedence
            (newError) ? newError :
            // A CHANGE event on a particular field always resets the error on that field
            (event.type === "CHANGE" && event.fieldName === name) ? null :
            // Existing "sticky" errors are retained
            (oldError && oldError.sticky) ? oldError : null
        );
        (newFields as Partial<FormFields<TForm>>)[name] = {
            ...field,
            meta: {
                ...field.meta,
                valid: !error,
                error: error && {
                    error: error.error,
                    params: error.params,
                    // Errors set by "SETERRORS" are always marked sticky
                    sticky: error.sticky || event.type === "SETERRORS"
                },
            },
        };
    }
    const valid = keysOf(form.fields).reduce((valid, name) => valid && !newFields[name].meta.error, true);
    return {
        ...form,
        fields: newFields,
        meta: {
            ...form.meta,
            valid,
        },
    };
}

export interface FormUpdate {
    touched?: boolean;
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
                visited: "visited" in update ? update.visited! : field.meta.visited,
            }
        };
    }
    return {
        ...form,
        meta: {
            ...form.meta,
            touched: "touched" in update ? update.touched! : form.meta.touched,
            visited: "visited" in update ? update.visited! : form.meta.visited,
        },
        fields: fields as FormFields<TForm>,
    };
}
