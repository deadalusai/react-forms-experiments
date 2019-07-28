import * as React from "react";
import { connect } from "react-redux";

import * as FormsStore from "forms/store";
import { Form, FieldUpdate, createForm, FormValidator, updateFormField, updateFormErrors, touchFormFields } from "forms/core";

interface StoreProps<TForm = any> {
    form: Form<TForm> | null;
}

export interface FormComponentProps<TForm = any> {
    form: Form<TForm> | null;
    formInit: (initial: TForm) => void;
    formTouch: () => void;
    formUpdateField: (update: FieldUpdate<TForm>) => void;
}

export interface FormOptions {
    /** The name of the form, global to the app */
    name: string;
    /** A validation function for the form */
    validator?: FormValidator;
}

export function withForm<TOwnProps = {}, TForm = any>(options: FormOptions) {
    return (WrappedComponent: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>) => {
        // High-order component options
        const formName = options.name;
        const formValidator = options.validator;
        // The public interface of the wrapped component.
        let form: Form<TForm> | null = null;
        let formInit: (initial: TForm) => void;
        let formTouch: () => void;
        let formUpdateField: (update: FieldUpdate<TForm>) => void;
        // Connect the component to the store (this initializes the public interface)
        const wrap = connect<StoreProps<TForm>, any, TOwnProps, any>(
            (rootState) => {
                form = rootState["forms"][formName] || null;
                return { form };
            },
            (dispatch) => {
                formInit = (initial) => {
                    form = createForm<TForm>(formName, initial, formValidator);
                    dispatch(FormsStore.actions.initForm(form));
                };
                formTouch = () => {
                    if (!form) {
                        return;
                    }
                    form = touchFormFields(form);
                    dispatch(FormsStore.actions.updateForm(form));
                };
                formUpdateField = (update) => {
                    if (!form) {
                        return;
                    }
                    form = updateFormField<TForm>(form, update);
                    // Apply validation?
                    if (formValidator && "value" in update) {
                        const errors = formValidator(form.current);
                        form = updateFormErrors(form, errors);
                    }
                    dispatch(FormsStore.actions.updateForm(form));
                };
            }
        );
        // Forward the props props to the wrapped component type, merging in our public interface
        const FormComponent = (props: TOwnProps) => {
            const formProps: FormComponentProps<TForm> = {
                form,
                formInit,
                formTouch,
                formUpdateField,
            };
            return <WrappedComponent {...props} {...formProps} />;
        };
        return wrap(FormComponent); 
    };
}