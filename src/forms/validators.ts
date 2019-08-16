import { FieldValidator, FormErrors, keysOf } from "forms/core";

export type FieldValidatorMap<TForm = any> = {
    [TKey in keyof TForm]?: FieldValidator<TForm[TKey]> | FieldValidator<TForm[TKey]>[];
};

export function createFormValidator<TForm>(fieldValidators: FieldValidatorMap<TForm>): (form: TForm) => FormErrors<TForm> {
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

//
// Validators
//

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