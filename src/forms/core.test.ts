import { Form, FieldUpdate, keysOf, formInit, formUpdateField } from "./core";

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

    describe("formUpdateField", () => {

        it("should do nothing if the field is not in the form", () => {
            // Arrange
            const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
            const fieldUpdate: FieldUpdate<string, TestFormData> = {
                name: "badField" as any,
                value: "foo",
                source: "CHANGE",
            };
            // Act
            const form = formUpdateField(oldForm, fieldUpdate);
            // Assert
            expect(form).toBe(oldForm);
        });

        describe("value event", () => {
            const SPECS = [
                { source: "CHANGE" as "CHANGE" },
                { source: "BLUR" as "BLUR" },
                { source: "FOCUS" as "FOCUS" },
            ];
            for (const spec of SPECS) {
                it(`should set the field value during ${spec.source}`, () => {
                    // Arrange
                    const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                    const fieldUpdate: FieldUpdate<string, TestFormData> = {
                        name: "strField",
                        source: spec.source,
                        value: "foo",
                    };
                    // Act
                    const form = formUpdateField(oldForm, fieldUpdate);
                    // Assert
                    expect(form.fields.strField.value).toEqual("foo");
                    expect(form.current.strField).toEqual("foo");
                    expect(form.initial.strField).toEqual(INITIAL_FORM_DATA.strField);
                });
    
                it(`should set the field as dirty during ${spec.source}`, () => {
                    // Arrange
                    const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                    const fieldUpdate: FieldUpdate<string, TestFormData> = {
                        name: "strField",
                        source: spec.source,
                        value: "foo",
                    };
                    // Act
                    const form = formUpdateField(oldForm, fieldUpdate);
                    // Assert
                    expect(form.fields.strField.meta.dirty).toEqual(true);
                    expect(form.meta.dirty).toEqual(true);
                });
            }
        });

        describe("CHANGE event", () => {

            it("should set the field as touched", () => {
                // Arrange
                const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                const fieldUpdate: FieldUpdate<string, TestFormData> = {
                    name: "strField",
                    source: "CHANGE",
                };
                // Act
                const form = formUpdateField(oldForm, fieldUpdate);
                // Assert
                expect(form.fields.strField.meta.touched).toEqual(true);
                expect(form.meta.touched).toEqual(true);
            });
        });

        describe("FOCUS event", () => {

            it("should set the field as focused", () => {
                // Arrange
                const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                const fieldUpdate: FieldUpdate<string, TestFormData> = {
                    name: "strField",
                    source: "FOCUS",
                };
                // Act
                const form = formUpdateField(oldForm, fieldUpdate);
                // Assert
                expect(form.fields.strField.meta.focused).toEqual(true);
                expect(form.meta.focused).toEqual("strField");
            });
        });

        describe("BLUR event", () => {
    
            it("should set the field as visited", () => {
                // Arrange
                const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                const fieldUpdate: FieldUpdate<string, TestFormData> = {
                    name: "strField",
                    source: "BLUR",
                };
                // Act
                const form = formUpdateField(oldForm, fieldUpdate);
                // Assert
                expect(form.fields.strField.meta.visited).toEqual(true);
                expect(form.meta.visited).toEqual(true);
            });
    
            it("should clear the focused state", () => {
                // Arrange
                const initialForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                const focusedForm: Form<TestFormData> = {
                    ...initialForm,
                    fields: {
                        ...initialForm.fields,
                        strField: {
                            ...initialForm.fields.strField,
                            meta: {
                                ...initialForm.fields.strField.meta,
                                focused: true
                            },
                        },
                    },
                    meta: {
                        ...initialForm.meta,
                        focused: "strField",
                    },
                };
                const fieldUpdate: FieldUpdate<string, TestFormData> = {
                    name: "strField",
                    source: "BLUR",
                };
                // Act
                const form = formUpdateField(focusedForm, fieldUpdate);
                // Assert
                expect(form.fields.strField.meta.focused).toEqual(false);
                expect(form.meta.focused).toEqual(null);
            });
        });
    });
});