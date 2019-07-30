import { FieldValidator, FormErrors, FieldError, keysOf } from "forms/core";

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

export function combine<TValue>(...validators: FieldValidator<TValue>[]): FieldValidator<TValue> {
    return value => validators.reduce((error, validator) => error || validator(value), null as FieldError | null);
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