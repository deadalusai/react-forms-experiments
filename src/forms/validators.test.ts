import { createFormValidator, FieldValidatorMap, combineValidators, FieldValidator } from './validators';
import * as Validators from "./validators";
import { FieldError } from './core';

describe("forms validators", () => {

    interface TestFormData {
        strField: string;
        numField: number;
        boolField: boolean;
    }

    const FORM_NAME = "test-form-name";
    const INITIAL_FORM_DATA: TestFormData = Object.freeze({
        strField: "hello, world",
        numField: 1,
        boolField: true,
    });

    describe("createFormValidator", () => {

        it("should create a form validator function", () => {
            // Arrange
            const formValidatorMap: FieldValidatorMap<TestFormData> = {
                strField: (v) => ({ error: `INVALID: ${v}` }),
                numField: (v) => ({ error: `INVALID: ${v}` }),
            };
            // Act
            const formValidator = createFormValidator(formValidatorMap);
            // Assert
            const errors = formValidator(INITIAL_FORM_DATA);
            expect(errors).toEqual({
                strField: { error: `INVALID: ${INITIAL_FORM_DATA.strField}` },
                numField: { error: `INVALID: ${INITIAL_FORM_DATA.numField}` },
            });
        });

        it("should support validator collections", () => {
            // Arrange
            const formValidatorMap: FieldValidatorMap<TestFormData> = {
                strField: [
                    (_v) => (null),
                    (_v) => ({ error: `INVALID` }),
                ],
                numField: (_v) => (null),
                boolField: [
                    (_v) => (null),
                    (_v) => ({ error: `INVALID` }),
                ],
            };
            // Act
            const formValidator = createFormValidator(formValidatorMap);
            // Assert
            const errors = formValidator(INITIAL_FORM_DATA);
            expect(errors).toEqual({
                strField: { error: `INVALID` },
                boolField: { error: `INVALID` },
            });
        });
    });

    describe("combineValidators", () => {

        it("should create an empty validator", () => {
            // Arrange
            // Act
            const validator = combineValidators([]);
            // Assert
            const error = validator("Hello");
            expect(error).toBeNull();
        });

        it("should invoke validators in the order provided", () => {
            // Arrange
            let validatorOrder: number[] = [];
            const mockValidators: FieldValidator<string>[] = [
                (_v) => { validatorOrder.push(1); return null; },
                (_v) => { validatorOrder.push(2); return null; },
                (_v) => { validatorOrder.push(3); return null; },
            ];
            // Act
            const validator = combineValidators(mockValidators);
            // Assert
            const error = validator("Hello");
            expect(error).toBeNull();
            expect(validatorOrder).toEqual([1, 2, 3]);
        });

        it("should return on the first validator which fails", () => {
            // Arrange
            let validatorOrder: number[] = [];
            const mockValidators: FieldValidator<string>[] = [
                (_v) => { validatorOrder.push(1); return null; },
                (_v) => { validatorOrder.push(2); return { error: "INVALID" }; },
                (_v) => { validatorOrder.push(3); return null; },
            ];
            // Act
            const validator = combineValidators(mockValidators);
            // Assert
            const error = validator("Hello");
            expect(error).toEqual({ error: "INVALID" });
            expect(validatorOrder).toEqual([1, 2]);
        });
    });

    describe("validators", () => {

        interface ValidatorTestCase { value: any; expectedError: string | null; }
        type ValidatorFactory<TArgs extends any[]> = (...args: TArgs) => (value: any) => FieldError | null;
        function validatorSpec<TArgs extends any[]>(validatorFactory: ValidatorFactory<TArgs>, args: TArgs, testCases: ValidatorTestCase[]) {
            const name = `${validatorFactory.name}(${args.map(a => a instanceof RegExp ? `/${a.source}/${a.flags}` : JSON.stringify(a)).join(", ")})`;
            return { 
                name,
                validator: validatorFactory(...args),
                testCases,
            };
        }

        const SPECS = [
            validatorSpec(Validators.required, [], [
                { value: "hello",   expectedError: null },
                { value: null,      expectedError: "ERROR.REQUIRED" },
                { value: undefined, expectedError: "ERROR.REQUIRED" },
                { value: "",        expectedError: "ERROR.REQUIRED" },
                { value: "   ",     expectedError: "ERROR.REQUIRED" },
            ]),
            validatorSpec(Validators.required, ["ERROR.CUSTOM"], [
                { value: "hello",   expectedError: null },
                { value: null,      expectedError: "ERROR.CUSTOM" },
            ]),
            validatorSpec(Validators.number, [], [
                { value: 100,       expectedError: null },
                { value: null,      expectedError: null },
                { value: undefined, expectedError: null },
                { value: NaN,       expectedError: "ERROR.MUST_BE_A_NUMBER" },
                { value: "string",  expectedError: "ERROR.MUST_BE_A_NUMBER" },
            ]),
            validatorSpec(Validators.number, ["ERROR.CUSTOM"], [
                { value: 100,       expectedError: null },
                { value: NaN,       expectedError: "ERROR.CUSTOM" },
            ]),
            validatorSpec(Validators.lessThanOrEqual, [100], [
                { value: null,      expectedError: null },
                { value: undefined, expectedError: null },
                { value: "string",  expectedError: null },
                { value: 90,        expectedError: null },
                { value: 100,       expectedError: null },
                { value: 110,       expectedError: "ERROR.MUST_BE_LESS_THAN_OR_EQUAL" },
            ]),
            validatorSpec(Validators.lessThanOrEqual, [100, "ERROR.CUSTOM"], [
                { value: null,      expectedError: null },
                { value: 110,       expectedError: "ERROR.CUSTOM" },
            ]),
            validatorSpec(Validators.lessThan, [100], [
                { value: null,      expectedError: null },
                { value: undefined, expectedError: null },
                { value: "string",  expectedError: null },
                { value: 90,        expectedError: null },
                { value: 100,       expectedError: "ERROR.MUST_BE_LESS_THAN" },
                { value: 110,       expectedError: "ERROR.MUST_BE_LESS_THAN" },
            ]),
            validatorSpec(Validators.lessThan, [100, "ERROR.CUSTOM"], [
                { value: null,      expectedError: null },
                { value: 100,       expectedError: "ERROR.CUSTOM" },
            ]),
            validatorSpec(Validators.greaterThanOrEqual, [100], [
                { value: null,      expectedError: null },
                { value: undefined, expectedError: null },
                { value: "string",  expectedError: null },
                { value: 90,        expectedError: "ERROR.MUST_BE_GREATER_THAN_OR_EQUAL" },
                { value: 100,       expectedError: null },
                { value: 110,       expectedError: null },
            ]),
            validatorSpec(Validators.greaterThanOrEqual, [100, "ERROR.CUSTOM"], [
                { value: null,      expectedError: null },
                { value: 90,        expectedError: "ERROR.CUSTOM" },
            ]),
            validatorSpec(Validators.greaterThan, [100], [
                { value: null,      expectedError: null },
                { value: undefined, expectedError: null },
                { value: "string",  expectedError: null },
                { value: 90,        expectedError: "ERROR.MUST_BE_GREATER_THAN" },
                { value: 100,       expectedError: "ERROR.MUST_BE_GREATER_THAN" },
                { value: 110,       expectedError: null },
            ]),
            validatorSpec(Validators.greaterThan, [100, "ERROR.CUSTOM"], [
                { value: null,      expectedError: null },
                { value: 100,       expectedError: "ERROR.CUSTOM" },
            ]),
            validatorSpec(Validators.pattern, [/a[bB]c/], [
                { value: null,      expectedError: null },
                { value: undefined, expectedError: null },
                { value: 100,       expectedError: null },
                { value: "aBc",     expectedError: null },
                { value: "aDc",     expectedError: "ERROR.MUST_MATCH_PATTERN" },
            ]),
            validatorSpec(Validators.pattern, [/a[bB]c/, "ERROR.CUSTOM"], [
                { value: null,      expectedError: null },
                { value: "aDc",     expectedError: "ERROR.CUSTOM" },
            ]),
        ];
        for (const spec of SPECS) {
            describe(spec.name, () => {
                for (const testCase of spec.testCases) {
                    it(`${JSON.stringify(testCase.value)} should ${testCase.expectedError ? `fail with ${testCase.expectedError}` : `pass`}`, () => {
                        // Arrange
                        // Act
                        const error = spec.validator(testCase.value);
                        // Assert
                        if (testCase.expectedError) {
                            expect(error && error.error).toEqual(testCase.expectedError);
                        } else {
                            expect(error).toBeNull();
                        }
                    });
                }
            });
        }
    });
});