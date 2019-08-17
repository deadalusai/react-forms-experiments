import { Form, FieldError, FieldErrorMap, keysOf } from "forms/core";

export type FormErrors<TForm> = {
    [key in keyof TForm]?: FieldError | Promise<FieldError | null>;
};

export type FieldValidator<TValue = any> = (value: TValue) => FieldError | Promise<FieldError | null> | null;

export type FormValidator<TForm = any> = (form: TForm) => FormErrors<TForm>;

export type FieldValidatorMap<TForm = any> = {
    [TKey in keyof TForm]?: FieldValidator<TForm[TKey]> | FieldValidator<TForm[TKey]>[];
};

export function createFormValidator<TForm>(fieldValidators: FieldValidatorMap<TForm>): FormValidator<TForm> {
    return (form: TForm) => {
        const errors: FormErrors<TForm> = {};
        for (const key of keysOf(form)) {
            let validator = fieldValidators[key];
            if (validator) {
                if (validator instanceof Array) {
                    validator = combineValidators(validator);
                }
                const error = validator(form[key]);
                if (error) {
                    errors[key] = error;
                }
            }
        }
        return errors;
    };
}

export function combineValidators<TValue>(validators: FieldValidator<TValue>[]): FieldValidator<TValue> {
    return value => {
        for (const validator of validators) {
            const error = validator(value);
            if (error) {
                return error;
            }
        }
        return null;
    };
}

// Async validator tracking

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

/**
 * Applies the validator function to the given form - any asynchronous validation results
 * are subscribed to automatically. Results are published via the `registerValidationListener` callbacks.
 * 
 * @param form The form state to validate.
 * @param validator The validator function to apply.
 * @returns A map of field errors which can be written back into the form state.
 */
export function formApplyValidator<TForm>(form: Form<TForm>, validator: FormValidator<TForm>): FieldErrorMap<TForm> {
    // Validate the form
    const rawErrors = validator(form.current);
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