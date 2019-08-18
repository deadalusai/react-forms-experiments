import { Form, FieldError, FieldErrorMap, keysOf } from "forms/core";

export type FormErrors<TForm> = {
    [key in keyof TForm]?: FieldError | Promise<FieldError | null>;
};

export interface FieldValidationInfo {
    name: string;
    isFocused: boolean;
    isBlurring: boolean;
}

export type FieldValidator<TValue = any> = (value: TValue, info: FieldValidationInfo) => FieldError | Promise<FieldError | null> | null;

export interface FormValidationInfo {
    focused: string | null;
    blurring: string | null;
}

export type FormValidator<TForm = any> = (form: TForm, source: FormValidationInfo) => FormErrors<TForm>;

export type FieldValidatorMap<TForm = any> = {
    [TKey in keyof TForm]?: FieldValidator<TForm[TKey]> | FieldValidator<TForm[TKey]>[];
};

// Validator combinators

/**
 * Creates a form validation function from a map of field-specific validation functions.
 * 
 * @param fieldValidators A map of field-specific validation functions
 */
export function createFormValidator<TForm>(fieldValidators: FieldValidatorMap<TForm>): FormValidator<TForm> {
    return (form, info) => {
        const errors: FormErrors<TForm> = {};
        for (const name of keysOf(form)) {
            let validator = fieldValidators[name];
            if (validator) {
                if (validator instanceof Array) {
                    validator = combineValidators(validator);
                }
                const fieldInfo: FieldValidationInfo = {
                    name: name as string,
                    isFocused: info.focused === name,
                    isBlurring: info.blurring === name,
                };
                const error = validator(form[name], fieldInfo);
                if (error) {
                    errors[name] = error;
                }
            }
        }
        return errors;
    };
}

/**
 * Creates a field validator from the given list of field validators.
 * Each validator is applied in turn until one returns an error, or all validators are exhausted.
 * 
 * @param validators An array of field validators
 */
export function combineValidators<TValue>(validators: FieldValidator<TValue>[]): FieldValidator<TValue> {
    return (value, info) => {
        for (const validator of validators) {
            const error = validator(value, info);
            if (error) {
                return error;
            }
        }
        return null;
    };
}

export function onBlur<TValue>(validator: FieldValidator<TValue>): FieldValidator<TValue> {
    return (value, info) => info.isBlurring ? validator(value, info) : null;
}

// Async validation tracking

function isFieldErrorPromise(e: any): e is Promise<FieldError> {
    return typeof e === "object" && "then" in e;
}

function isFieldError(e: any): e is FieldError {
    return typeof e === "object" && "error" in e;
}

const LISTENERS: { [formName: string]: (fieldName: string, error: FieldError | null) => void; } = {};

export function registerValidationListener(formName: string, asyncValidationResolved: (fieldName: string, error: FieldError | null) => void) {
    LISTENERS[formName] = asyncValidationResolved;
}

export function unregisterValidationListener(formName: string) {
    delete LISTENERS[formName];
}

let UUID = 0;
const IN_PROGRESS: { [key: string]: number; } = {};

function subscribe(formName: string, fieldName: string, promise: Promise<FieldError | null>): number {
    const id = UUID++;
    const key = `${formName}:${fieldName}`;
    IN_PROGRESS[key] = id;
    promise.then((error) => {
        if (IN_PROGRESS[key] !== id) {
            // This promise was superceded by another - ignore this result.
            return;
        }
        delete IN_PROGRESS[key];
        const asyncValidationResolved = LISTENERS[formName];
        if (asyncValidationResolved) {
            asyncValidationResolved(fieldName, error);
        }
    });
    return id;
}

//
// Validators
//

export interface FormValidationEventSource {
    type: "INIT" | "BLUR" | "CHANGE";
    fieldName?: string;
}
1
/**
 * Applies the validator function to the given form - any asynchronous validation results
 * are subscribed to automatically. Results are published via the `registerValidationListener` callbacks.
 * 
 * @param form The form state to validate.
 * @param validator The validator function to apply.
 * @returns A map of field errors which can be written back into the form state.
 */
export function formApplyValidator<TForm>(form: Form<TForm>, validator: FormValidator<TForm>, source: FormValidationEventSource): FieldErrorMap<TForm> {
    // Validate the form
    const info: FormValidationInfo = {
        focused: form.meta.focused,
        blurring: source.type === "BLUR" && source.fieldName || null,
    };
    const rawErrors = validator(form.current, info);
    // Convert the errors into something we can store
    const formErrors: FieldErrorMap<TForm> = {};
    for (const name of keysOf(rawErrors)) {
        const error = rawErrors[name];
        if (isFieldErrorPromise(error)) {
            // Start listening to the validator
            const id = subscribe(form.name, name as string, error);
            formErrors[name] = { id }; 
        }
        else if (isFieldError(error)) {
            formErrors[name] = error;
        }
    }
    return formErrors;
}

export function required(error = "ERROR.REQUIRED"): FieldValidator {
    return value => value === null || value === undefined || value === "" ? { error, params: { value } } : null;
}

export function number(error = "ERROR.MUST_BE_A_NUMBER"): FieldValidator {
    return value => isNaN(value) ? { error, params: { value } } : null;
}

export function lessThanOrEqual(n: number, error = "ERROR.MUST_BE_LESS_THAN_OR_EQUAL"): FieldValidator {
    return value => typeof value === "number" && value > n ? { error, params: { n, value } } : null;
}

export function lessThan(n: number, error = "ERROR.MUST_BE_LESS_THAN"): FieldValidator {
    return value => typeof value === "number" && value >= n ? { error, params: { n, value } } : null;
}

export function greaterThanOrEqual(n: number, error = "ERROR.MUST_BE_GREATER_THAN_OR_EQUAL"): FieldValidator {
    return value => typeof value === "number" && value < n ? { error, params: { n, value } } : null;
}

export function greaterThan(n: number, error = "ERROR.MUST_BE_GREATER_THAN"): FieldValidator {
    return value => typeof value === "number" && value <= n ? { error, params: { n, value } } : null;
}

export function pattern(p: RegExp, error = "ERROR.MUST_MATCH_PATTERN"): FieldValidator {
    return value => (typeof value === "string") && !p.test(value) ? { error, params: { value } } : null;
}