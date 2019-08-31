import { Form, FieldUpdate, FormErrors, FormUpdateErrorsEvent, FieldError, FormUpdate } from "./core";
import { keysOf, formInit, formUpdateField, formUpdateErrors, formUpdateAll } from "./core";

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
                type: "CHANGE",
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
                describe(`${spec.source} events`, () => {
                    it("should set the field value", () => {
                        // Arrange
                        const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                        const fieldUpdate: FieldUpdate<string, TestFormData> = {
                            name: "strField",
                            type: spec.source,
                            value: "foo",
                        };
                        // Act
                        const form = formUpdateField(oldForm, fieldUpdate);
                        // Assert
                        expect(form.fields.strField.value).toEqual("foo");
                        expect(form.current.strField).toEqual("foo");
                        expect(form.initial.strField).toEqual(INITIAL_FORM_DATA.strField);
                    });
        
                    it("should set the field as dirty", () => {
                        // Arrange
                        const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                        const fieldUpdate: FieldUpdate<string, TestFormData> = {
                            name: "strField",
                            type: spec.source,
                            value: "foo",
                        };
                        // Act
                        const form = formUpdateField(oldForm, fieldUpdate);
                        // Assert
                        expect(form.fields.strField.meta.dirty).toEqual(true);
                        expect(form.meta.dirty).toEqual(true);
                    });
                });
            }
        });

        describe("CHANGE event", () => {

            it("should set the field as touched", () => {
                // Arrange
                const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                const fieldUpdate: FieldUpdate<string, TestFormData> = {
                    name: "strField",
                    type: "CHANGE",
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
                    type: "FOCUS",
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
                    type: "BLUR",
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
                    type: "BLUR",
                };
                // Act
                const form = formUpdateField(focusedForm, fieldUpdate);
                // Assert
                expect(form.fields.strField.meta.focused).toEqual(false);
                expect(form.meta.focused).toEqual(null);
            });
        });
    });

    describe("formUpdateErrors", () => {
        const TEST_ERROR: FieldError = {
            error: "ERROR.EXAMPLE",
            params: { id: 1 },
        };
        const ERRORED_FORM: Form<TestFormData> = {
            ...formInit(FORM_NAME, INITIAL_FORM_DATA),
            fields: {
                strField: {
                    name: "strField",
                    value: "foo",
                    meta: {
                        dirty: true,
                        focused: false,
                        touched: true,
                        visited: true,
                        valid: false,
                        error: {
                            error: "ERROR.TO_BE_CLEARED",
                            params: undefined,
                            sticky: false,
                        }
                    },
                },
                numField: {
                    name: "numField",
                    value: 100,
                    meta: {
                        dirty: true,
                        focused: false,
                        touched: true,
                        visited: true,
                        valid: false,
                        error: {
                            error: "ERROR.TO_BE_CLEARED",
                            params: undefined,
                            sticky: true,
                        }
                    },
                },
                boolField: {
                    name: "boolField",
                    value: true,
                    meta: {
                        dirty: true,
                        focused: false,
                        touched: true,
                        visited: true,
                        valid: false,
                        error: {
                            error: "ERROR.TO_BE_RETAINED_AS_STICKY",
                            params: undefined,
                            sticky: false,
                        }
                    },
                },
            },
            meta: {
                dirty: true,
                valid: false,
                touched: true,
                visited: true,
                focused: null,
            },
        };
        const EVENT_SPECS = [
            { type: "INIT" as "INIT" },
            { type: "CHANGE" as "CHANGE" },
            { type: "SETERRORS" as "SETERRORS" },
        ];
        for (const spec of EVENT_SPECS) {
            it(`update errors on the form for ${spec.type} events`, () => {
                // Arrange
                const errors: FormErrors<TestFormData> = {
                    strField: TEST_ERROR,
                };
                const event: FormUpdateErrorsEvent = {
                    type: spec.type,
                };
                // Act
                const form = formUpdateErrors(ERRORED_FORM, errors, event)
                // Assert
                // The field being updated should receive the new error
                expect(form.fields.strField.meta.valid).toEqual(false);
                expect(form.fields.strField.meta.error).toEqual({
                    error: TEST_ERROR.error,
                    params: TEST_ERROR.params,
                    sticky: spec.type === "SETERRORS",
                });
                if (spec.type === "SETERRORS") {
                    // Other fields should not be modified during SETERRORS events
                    expect(form.fields.numField.meta.valid).toEqual(false);
                    expect(form.fields.numField.meta.error).toBe(form.fields.numField.meta.error);
                    expect(form.fields.boolField.meta.valid).toEqual(false);
                    expect(form.fields.boolField.meta.error).toBe(form.fields.boolField.meta.error);
                }
                else {
                    // The sticky field not being updated should retain its error
                    expect(form.fields.numField.meta.valid).toEqual(false);
                    expect(form.fields.numField.meta.error).toEqual(form.fields.numField.meta.error);
                    // The non-sticky field not being updated should have its error cleared
                    expect(form.fields.boolField.meta.valid).toEqual(true);
                    expect(form.fields.boolField.meta.error).toEqual(null);
                }
            });
        }

        const FIELD_SPECS = [
            { fieldName: "strField" as keyof TestFormData },
            { fieldName: "numField" as keyof TestFormData },
            { fieldName: "boolField" as keyof TestFormData },
        ];
        for (const spec of FIELD_SPECS) {
            const isSticky = ERRORED_FORM.fields[spec.fieldName].meta.error!.sticky!;
            it(`should clear ${isSticky ? "sticky" : "non-sticky"} errors on CHANGE events (${spec.fieldName})`, () => {
                // Arrange
                const errors: FormErrors<TestFormData> = {};
                const event: FormUpdateErrorsEvent = {
                    type: "CHANGE",
                    fieldName: spec.fieldName,
                };
                // Act
                const form = formUpdateErrors(ERRORED_FORM, errors, event)
                // Assert
                // The field being updated should receive the new error
                expect(form.fields[spec.fieldName].meta.valid).toEqual(true);
                expect(form.fields[spec.fieldName].meta.error).toEqual(null);
            });
        }
    });

    describe("formUpdateAll", () => {

        it("should set visited on all fields", () => {
            // Arrange
            const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
            const formUpdate: FormUpdate = {
                visited: true,
            };
            // Act
            const form = formUpdateAll(oldForm, formUpdate);
            // Assert
            expect(form.fields.strField.meta.visited).toEqual(true);
            expect(form.fields.numField.meta.visited).toEqual(true);
            expect(form.fields.boolField.meta.visited).toEqual(true);
            expect(form.meta.visited).toEqual(true);
        });

        it("should set touched on all fields", () => {
            // Arrange
            const oldForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
            const formUpdate: FormUpdate = {
                touched: true,
            };
            // Act
            const form = formUpdateAll(oldForm, formUpdate);
            // Assert
            expect(form.fields.strField.meta.touched).toEqual(true);
            expect(form.fields.numField.meta.touched).toEqual(true);
            expect(form.fields.boolField.meta.touched).toEqual(true);
            expect(form.meta.touched).toEqual(true);
        });
    });
});