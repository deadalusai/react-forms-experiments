import { keysOf, formInit } from "./core";

describe("forms core", () => {

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

    describe("formInit", () => {

        it("should initialise a new form", () => {
            // Arrange
            const formData: TestFormData = {
                ...INITIAL_FORM_DATA
            };
            // Act
            const form = formInit(FORM_NAME, formData);
            // Assert
            expect(form).toBeDefined();
            expect(form.name).toEqual(FORM_NAME);
            expect(form.initial).toEqual(formData);
            expect(form.current).toEqual(formData);
            const names = keysOf(form.fields);
            const expectedNames = keysOf(formData);
            expect(names).toEqual(expectedNames);
            // Fields should be set to initial values
            for (const name of expectedNames) {
                const field = form.fields[name];
                const expectedValue = formData[name];
                expect(field.name).toEqual(name);
                expect(field.value).toEqual(expectedValue);
                // Initial field meta
                expect(field.meta).toEqual({
                    valid: true,
                    visited: false,
                    touched: false,
                    focused: false,
                    dirty: false,
                    error: null,
                });
            }
            // Initial form meta
            expect(form.meta).toEqual({
                visited: false,
                valid: true,
                touched: false,
                dirty: false,
                focused: null,
            });
        });
    });
});