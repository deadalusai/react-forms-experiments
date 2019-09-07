import * as React from "react";

import { FormComponentBase, FormOptions, FormComponentProps, injectStateBackedForm } from "./component";
import { Form, FieldUpdate, FormUpdate, FormErrors, FormUpdateErrorsEvent, formInit, formUpdateField, formUpdateErrors, formUpdateAll } from './core';
import { FormValidator } from './validators';

describe("forms component", () => {

    interface ExampleFormData {
        strField: string;
        numField: number;
        boolField: boolean;
    }

    const FORM_NAME = "test-form-name";
    const INITIAL_FORM_DATA: ExampleFormData = Object.freeze({
        strField: "hello, world",
        numField: 1,
        boolField: true,
    });

    // Represents the end-users "form" component, which is wrapped by the FormComponentBase high-order component
    interface ExampleFormComponentProps {
        foo: number;
        bar: string;
    }
    class ExampleFormComponent extends React.Component<ExampleFormComponentProps & FormComponentProps<ExampleFormData>> {
        public render() {
            return <div />;
        }
    }
        
    // Props to be passed *through* to `TestFormComponent`
    const OWN_PROPS: ExampleFormComponentProps = {
        foo: 100,
        bar: "bar",
    };

    describe("FormComponentBase", () => {

        // Mock subclass of FormComponentBase to instrument testing of the abstract base class routines
        class MockFormComponent extends FormComponentBase<ExampleFormData, ExampleFormComponentProps, {}, {}> {
            public formState: Form<ExampleFormData> | null = null;
            public component = ExampleFormComponent;

            constructor(props: any, public options: FormOptions<ExampleFormData>) {
                super(props);
            }

            public get(): Form<ExampleFormData> {
                return this.formState!;
            }

            public set(form: Form<ExampleFormData>): void {
                this.formState = form;
            }
        }

        describe("formInit", () => {

            it("should initialize the form", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                    initial: INITIAL_FORM_DATA,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                // Act
                const form = component.formInit(options.initial);
                // Assert
                expect(form).toBeDefined();
                expect(form.name).toEqual(FORM_NAME);
                expect(form.initial).toEqual(INITIAL_FORM_DATA);
                
                expect(form.fields.strField.value).toEqual(INITIAL_FORM_DATA.strField);
                expect(form.fields.strField.meta.touched).toEqual(false);
                expect(form.fields.strField.meta.visited).toEqual(false);
                expect(form.fields.strField.meta.valid).toEqual(true);
                expect(form.fields.strField.meta.error).toBeNull();
                
                expect(form.fields.boolField.value).toEqual(INITIAL_FORM_DATA.boolField);
                expect(form.fields.boolField.meta.touched).toEqual(false);
                expect(form.fields.boolField.meta.visited).toEqual(false);
                expect(form.fields.boolField.meta.valid).toEqual(true);
                expect(form.fields.boolField.meta.error).toBeNull();
                
                expect(form.fields.numField.value).toEqual(INITIAL_FORM_DATA.numField);
                expect(form.fields.numField.meta.touched).toEqual(false);
                expect(form.fields.numField.meta.visited).toEqual(false);
                expect(form.fields.numField.meta.valid).toEqual(true);
                expect(form.fields.numField.meta.error).toBeNull();
            });

            it("should set form errors if a validator is configured", () => {
                // Arrange
                const validator = (_data: ExampleFormData) => {
                    return {
                        strField: { error: "STRING" },
                        boolField: { error: "BOOLEAN" },
                        numField: { error: "NUMBER" },
                    };
                };
                const options = {
                    name: FORM_NAME,
                    initial: INITIAL_FORM_DATA,
                    validator,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                // Act
                const form = component.formInit(options.initial);
                // Assert
                expect(form).toBeDefined();
                expect(form.fields.strField.meta.error).toEqual({ error: "STRING", params: undefined, sticky: false });
                expect(form.fields.boolField.meta.error).toEqual({ error: "BOOLEAN", params: undefined, sticky: false });
                expect(form.fields.numField.meta.error).toEqual({ error: "NUMBER", params: undefined, sticky: false });
            });

            it("should not set form errors if no validator is configured", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                // Act
                const form = component.formInit(INITIAL_FORM_DATA);
                // Assert
                expect(form).toBeDefined();
                expect(form.fields.strField.meta.error).toBeNull();
                expect(form.fields.boolField.meta.error).toBeNull();
                expect(form.fields.numField.meta.error).toBeNull();
            });
        });

        describe("formUpdate", () => {
            
            let mockValidator: FormValidator;
            let initialFormState: Form<ExampleFormData>;
            beforeEach(() => {
                mockValidator = jest.fn((data: ExampleFormData) => {
                    return {
                        strField: data.strField === "INVALID" ? { error: "INVALID" } : null,
                    };
                });
                initialFormState = formInit(FORM_NAME, INITIAL_FORM_DATA);
            });

            it("should throw if the form is not initialized", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                component.formState = null;
                const update: FieldUpdate<string, ExampleFormData> = {
                    name: "strField",
                    type: "CHANGE",
                    value: "foo",
                };
                // Act, Assert
                expect(() => component.formUpdate(update)).toThrowError("Called formUpdate before formInit");
            });
            
            const FIELD_UPDATE_SPECS = [
                {
                    on: "blur event",
                    update: { name: "strField", type: "BLUR" } as FieldUpdate<any, ExampleFormData>,
                },
                {
                    on: "focus event",
                    update: { name: "strField", type: "FOCUS" } as FieldUpdate<any, ExampleFormData>,
                },
                {
                    on: "change event",
                    update: { name: "strField", type: "CHANGE" } as FieldUpdate<any, ExampleFormData>,
                },
            ];
            for (const spec of FIELD_UPDATE_SPECS) {
                it(`should pass through to updateFormField on ${spec.on}`, () => {
                    // Arrange
                    const options = {
                        name: FORM_NAME,
                    };
                    const component = new MockFormComponent(OWN_PROPS, options);
                    component.formState = initialFormState;
                    // Act
                    const newFormState = component.formUpdate(spec.update);
                    // Assert
                    expect(mockValidator).not.toHaveBeenCalled();
                    expect(newFormState).toEqual(
                        formUpdateField(initialFormState, spec.update)    
                    );
                });
            }

            it("should invoke the validator and pass through to updateFormErrors when given a value", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                    validator: mockValidator,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                component.formState = initialFormState;
                const update: FieldUpdate<string, ExampleFormData> = {
                    name: "strField",
                    type: "CHANGE",
                    value: "INVALID",
                };
                // Act
                const newFormState = component.formUpdate(update);
                // Assert
                expect(mockValidator).toHaveBeenCalledWith({
                    ...initialFormState.current,
                    [update.name]: update.value,
                });
                const expectedErrors: FormErrors<ExampleFormData> = {
                    strField: { error: "INVALID" },
                };
                const expectedEvent: FormUpdateErrorsEvent = {
                    type: "CHANGE",
                    fieldName: "strField",
                };
                expect(newFormState).toEqual(
                    formUpdateErrors(
                        formUpdateField(initialFormState, update),
                        expectedErrors,
                        expectedEvent,
                    )
                );
                expect(newFormState.fields.strField.meta.valid).toEqual(false);
                expect(newFormState.fields.strField.meta.error).toEqual(
                    { error: "INVALID", params: undefined, sticky: false }
                );
            });

            it("should not pass through to updateFormErrors when no validator is declared", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                component.formState = initialFormState;
                const update: FieldUpdate<string, ExampleFormData> = {
                    name: "strField",
                    type: "CHANGE",
                    value: "INVALID",
                };
                // Act
                const newFormState = component.formUpdate(update);
                // Assert
                expect(mockValidator).not.toHaveBeenCalled();
                expect(newFormState).toEqual(
                    formUpdateField(initialFormState, update),
                );
                expect(newFormState.fields.strField.meta.valid).toEqual(true);
                expect(newFormState.fields.strField.meta.error).toBeNull();
            });

            it("should pass throught to formUpdateAll when given a FormUpdate", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                    validator: mockValidator,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                component.formState = initialFormState;
                const update: FormUpdate = {
                    touched: true,
                    visited: true,
                };
                // Act
                const newFormState = component.formUpdate(update);
                // Assert
                expect(mockValidator).not.toHaveBeenCalled();
                expect(newFormState).toEqual(
                    formUpdateAll(initialFormState, update)
                );
            });
        });

        describe("formSetErrors", () => {
            
            let initialFormState: Form<ExampleFormData>;
            beforeEach(() => {
                initialFormState = formInit(FORM_NAME, INITIAL_FORM_DATA);
            });

            it("should throw if the form is not initialized", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                component.formState = null;
                const errors: FormErrors<ExampleFormData> = {
                    numField: { error: "ERROR" },
                };
                // Act, Assert
                expect(() => component.formSetErrors(errors)).toThrowError("Called formSetErrors before formInit");
            });

            it("should pass throught to formUpdateAll when given a FormUpdate", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                component.formState = initialFormState;
                const errors: FormErrors<ExampleFormData> = {
                    numField: { error: "ERROR" },
                };
                // Act
                const newFormState = component.formSetErrors(errors);
                // Assert
                const expectedEvent: FormUpdateErrorsEvent = {
                    type: "SETERRORS",
                };
                expect(newFormState).toEqual(
                    formUpdateErrors(
                        initialFormState,
                        errors,
                        expectedEvent
                    )
                );
                expect(newFormState.fields.numField.meta.valid).toEqual(false);
                expect(newFormState.fields.numField.meta.error).toEqual(
                    { error: "ERROR", params: undefined, sticky: true } // Expect sticky to be set
                );
            });
        });

        describe("render", () => {
            
            let initialFormState: Form<ExampleFormData>;
            beforeEach(() => {
                initialFormState = formInit(FORM_NAME, INITIAL_FORM_DATA);
            });

            it("should pass the public API through to the wrapped component", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                };
                const component = new MockFormComponent(OWN_PROPS, options);
                component.formState = initialFormState;
                // Act
                const renderTree = component.render() as React.ReactElement;
                // Assert
                expect(renderTree).toBeDefined();
                // Should render the wrapped component type
                expect(renderTree.type).toEqual(ExampleFormComponent);
                // Should pass through "ownprops"
                expect(renderTree.props.foo).toEqual(OWN_PROPS.foo);
                expect(renderTree.props.bar).toEqual(OWN_PROPS.bar);
                // Should pass through FormComponent internal API
                expect(renderTree.props.form).toEqual(component.formState);
                expect(renderTree.props.formInit).toBeInstanceOf(Function);
                expect(renderTree.props.formUpdate).toBeInstanceOf(Function);
                expect(renderTree.props.formSetErrors).toBeInstanceOf(Function);
            });

            describe("props.formInit", () => {
                it("should set the new state", () => {
                    // Arrange
                    const options = {
                        name: FORM_NAME,
                    };
                    const component = new MockFormComponent(OWN_PROPS, options);
                    const arg = new Object();
                    const newState = new Object();
                    component.formInit = jest.fn().mockReturnValue(newState);
                    // Act
                    const renderTree = component.render() as React.ReactElement;
                    (renderTree.props.formInit as Function).call(null, arg);
                    // Assert
                    expect(component.formInit).toHaveBeenCalledWith(arg);
                    expect(component.formState).toBe(newState);
                });
            });

            describe("props.formUpdate", () => {
                it("should set the new state", () => {
                    // Arrange
                    const options = {
                        name: FORM_NAME,
                    };
                    const component = new MockFormComponent(OWN_PROPS, options);
                    const arg = new Object();
                    const newState = new Object();
                    component.formUpdate = jest.fn().mockReturnValue(newState);
                    // Act
                    const renderTree = component.render() as React.ReactElement;
                    (renderTree.props.formUpdate as Function).call(null, arg);
                    // Assert
                    expect(component.formUpdate).toHaveBeenCalledWith(arg);
                    expect(component.formState).toBe(newState);
                });
            });

            describe("props.formSetErrors", () => {
                it("should set the new state", () => {
                    // Arrange
                    const options = {
                        name: FORM_NAME,
                    };
                    const component = new MockFormComponent(OWN_PROPS, options);
                    const arg = new Object();
                    const newState = new Object();
                    component.formSetErrors = jest.fn().mockReturnValue(newState);
                    // Act
                    const renderTree = component.render() as React.ReactElement;
                    (renderTree.props.formSetErrors as Function).call(null, arg);
                    // Assert
                    expect(component.formSetErrors).toHaveBeenCalledWith(arg);
                    expect(component.formState).toBe(newState);
                });
            });
        });
    });

    describe("injectStateBackedForm", () => {

        it("should pass through own props", () => {
            // Arrange
            const options = {
                name: FORM_NAME,
                initial: INITIAL_FORM_DATA,
            };
            const factory = injectStateBackedForm<ExampleFormData, ExampleFormComponentProps>(options);
            const Component = factory(ExampleFormComponent);
            // Act
            const instance = new Component(OWN_PROPS);
            const renderTree = instance.render() as React.ReactElement;
            // Assert
            expect(renderTree).toBeDefined();
            expect(renderTree.type).toBe(ExampleFormComponent);
            expect(renderTree.props.foo).toEqual(OWN_PROPS.foo);
            expect(renderTree.props.bar).toEqual(OWN_PROPS.bar);
        });

        it("should not init the form state if an initial state is not provided", () => {
            // Arrange
            const options = {
                name: FORM_NAME,
            };
            const factory = injectStateBackedForm<ExampleFormData, ExampleFormComponentProps>(options);
            const Component = factory(ExampleFormComponent);
            // Act
            const instance = new Component(OWN_PROPS);
            // Assert
            expect(instance.state).not.toBeDefined();
        });

        it("should init the form state if an initial state is provided", () => {
            // Arrange
            const options = {
                name: FORM_NAME,
                initial: INITIAL_FORM_DATA,
            };
            const factory = injectStateBackedForm<ExampleFormData, ExampleFormComponentProps>(options);
            const Component = factory(ExampleFormComponent);
            // Act
            const instance = new Component(OWN_PROPS);
            // Assert
            expect(instance.state).toBeDefined();
            expect(instance.state.form).toBeDefined();
            expect(instance.state.form.current).toEqual(INITIAL_FORM_DATA);
        });

        describe("get", () => {
            it("should retrieve the current state when not initialized", () => {
                // Arrange
                const options = {
                    name: FORM_NAME,
                };
                const factory = injectStateBackedForm<ExampleFormData, ExampleFormComponentProps>(options);
                const Component = factory(ExampleFormComponent);
                // Act
                const instance = new Component(OWN_PROPS);
                // Assert
                expect(instance.get()).toBeUndefined();
            });

            it("should retrieve the current state when initialized", () => {
                // Arrange
                const expectedForm = formInit(FORM_NAME, INITIAL_FORM_DATA);
                const options = {
                    name: FORM_NAME,
                    initial: INITIAL_FORM_DATA,
                };
                const factory = injectStateBackedForm<ExampleFormData, ExampleFormComponentProps>(options);
                const Component = factory(ExampleFormComponent);
                // Act
                const instance = new Component(OWN_PROPS);
                // Assert
                expect(instance.get()).toEqual(expectedForm);
            });
        });

        describe("set", () => {
            it("should update the component state", () => {
                // Arrange
                const formData = formInit(FORM_NAME, INITIAL_FORM_DATA);
                const options = {
                    name: FORM_NAME
                };
                const factory = injectStateBackedForm<ExampleFormData, ExampleFormComponentProps>(options);
                const Component = factory(ExampleFormComponent);
                const instance = new Component(OWN_PROPS);
                // Component is unmounted so we need to mock setState
                instance.setState = jest.fn();
                // Act
                instance.set(formData);
                // Assert
                expect(instance.setState).toHaveBeenCalledWith({ form: formData });
            });
        });
    });
});