import * as React from "react";
import { connect } from "react-redux";

import * as FormsStore from "forms/store";
import { Form, FieldUpdate, createForm, FormValidator, updateFormField, updateFormErrors, touchFormFields } from "forms/core";

interface StoreProps<TForm = any> {
    form: Form<TForm> | undefined;
}

export interface FormComponentProps<TForm = any> {
    form: Form<TForm> | undefined;
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

function lift<TForm, TOwnProps>(
    WrappedComponent: React.ComponentClass<TOwnProps>,
    useState: () => [Form<TForm> | undefined, (newState: Form<TForm>) => void],
    options: FormOptions,
) {
    const FormComponent = (props: TOwnProps) => {
        let [form, setState] = useState();
        // The public interface of the wrapped component.
        const formProps: FormComponentProps<TForm> = {
            form,
            formInit: (initial) => {
                form = createForm<TForm>(options.name, initial, options.validator);
                setState(form);
            },
            formTouch: () => {
                if (!form) {
                    return;
                }
                form = touchFormFields(form);
                setState(form);
            },
            formUpdateField: (update) => {
                if (!form) {
                    return;
                }
                form = updateFormField<TForm>(form, update);
                // Apply validation?
                if (options.validator && "value" in update) {
                    const errors = options.validator(form.current);
                    form = updateFormErrors(form, errors);
                }
                setState(form);
            },
        };
        return <WrappedComponent {...props} {...formProps} />;
    };
    return FormComponent;
}

/**
 * Higher-order component which provides a form state-backed FormComponentProps implementation
 * 
 * @param options Configuration options for the form.
 */
export function withStateBackedForm<TOwnProps = {}, TForm = any>(options: FormOptions) {
    return (WrappedComponent: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>) => {
        return lift(WrappedComponent, React.useState, options);
    };
}

/**
 * Higher-order component which provides a redux-backed FormComponentProps implementation
 * 
 * @param options Configuration options for the form.
 */
export function withStoreBackedForm<TOwnProps = {}, TForm = any>(options: FormOptions) {
    return (WrappedComponent: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>) => {
        // Mock the `useState` API to be backed by the redux store
        let state: Form<TForm> | undefined = undefined;
        let setState: (newState: Form<TForm>) => void;
        const connector = connect<StoreProps<TForm>, any, TOwnProps, any>(
            (rootState) => {
                state = rootState["forms"][options.name];
                return { form: state };
            },
            (dispatch) => {
                setState = (newState) => {
                    dispatch(FormsStore.actions.updateForm(newState));
                };
            }
        );
        return connector(lift(WrappedComponent, () => [state, setState], options));
    };
}