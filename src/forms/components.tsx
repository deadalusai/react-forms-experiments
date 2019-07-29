import * as React from "react";
import { connect } from "react-redux";

import * as FormsStore from "forms/store";
import { Form, FormUpdate, FieldUpdate, FormValidator, formInit, formUpdateField, formUpdateAllFields, formUpdateErrors } from "forms/core";

interface StoreProps<TForm = any> {
    form: Form<TForm>;
}

export interface FormComponentProps<TForm = any> {
    form: Form<TForm>;
    formInit: (initial: TForm) => Form<TForm>;
    formUpdateField: (update: FieldUpdate<TForm>) => Form<TForm>;
    formUpdateAllFields: (update: FormUpdate) => Form<TForm>;
    
}

export interface FormOptions<TForm> {
    /** The name of the form, global to the app */
    name: string;
    /** A validation function for the form */
    validator?: FormValidator;
    /** The initial state of the form. To set the initial state dynamically, use `formInit` */
    initial?: TForm;
}

function lift<TForm, TOwnProps>(
    ComponentClass: React.ComponentClass<TOwnProps>,
    useState: () => [Form<TForm> | undefined, (newState: Form<TForm>) => void],
    options: FormOptions<TForm>,
) {
    const FormComponent = (props: TOwnProps) => {
        let [form, setState] = useState();
        // First time load - build the initial form state
        if (!form && options.initial) {
            form = formInit<TForm>(options.name, options.initial, options.validator);
        }
        // Our interface with the wrapped component
        const formProps: FormComponentProps<TForm> = {
            form: form!,
            formInit: (initial) => {
                form = formInit<TForm>(options.name, initial, options.validator);
                setState(form);
                return form;
            },
            formUpdateField: (update) => {
                if (!form) {
                    throw new Error("Called formUpdateField before formInit");
                }
                form = formUpdateField<TForm>(form, update);
                // Apply validation only when the form is being updated with new data.
                if (options.validator && "value" in update) {
                    const errors = options.validator(form.current);
                    form = formUpdateErrors(form, errors);
                }
                setState(form);
                return form;
            },
            formUpdateAllFields: (update) => {
                if (!form) {
                    throw new Error("Called formTouch before formInit");
                }
                form = formUpdateAllFields(form, update);
                setState(form);
                return form;
            },
        };
        return <ComponentClass {...props} {...formProps} />;
    };
    return FormComponent;
}

/**
 * Higher-order component which provides a form state-backed FormComponentProps implementation
 * 
 * @param options Configuration options for the form.
 */
export function withStateBackedForm<TOwnProps = {}, TForm = any>(options: FormOptions<TForm>) {
    return (WrappedComponent: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>) => {
        return lift(WrappedComponent, React.useState, options);
    };
}

/**
 * Higher-order component which provides a redux-backed FormComponentProps implementation
 * 
 * @param options Configuration options for the form.
 */
export function withStoreBackedForm<TOwnProps = {}, TForm = any>(options: FormOptions<TForm>) {
    return (WrappedComponent: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>) => {
        // Mock the `useState` API to be backed by the redux store
        let state: Form<TForm>;
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