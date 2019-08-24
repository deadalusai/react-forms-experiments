import { FormErrors, FieldError, keysOf } from "forms/core";

export type FieldValidator<TValue = any> = (value: TValue) => FieldError | null;

export type FormValidator<TForm = any> = (form: TForm) => FormErrors<TForm>;

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
    return (form) => {
        const errors: FormErrors<TForm> = {};
        for (const name of keysOf(form)) {
            let validator = fieldValidators[name];
            if (validator) {
                if (validator instanceof Array) {
                    validator = combineValidators(validator);
                }
                const error = validator(form[name]);
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
    return (value) => {
        for (const validator of validators) {
            const error = validator(value);
            if (error) {
                return error;
            }
        }
        return null;
    };
}

//
// Validators
//

export function required(error = "ERROR.REQUIRED"): FieldValidator {
    return value => !value ? { error, params: { value } } : null;
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