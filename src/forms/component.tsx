import * as React from "react";
import { connect } from "react-redux";

import * as FormsStore from "forms/store";
import { Form, FormUpdate, FieldUpdate, FormValidator, formInit, formUpdate, formUpdateFields, formUpdateErrors } from "forms/core";

export interface FormComponentProps<TForm = any> {
    form: Form<TForm>;
    formInit: (initial: TForm) => Form<TForm>;
    formUpdate: (update: FormUpdate | FieldUpdate<TForm>) => Form<TForm>;
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
            form = formInit<TForm>(options.name, options.initial);
            if (options.validator) {
                form = formUpdateErrors(form, options.validator(form.current));
            }
        }
        // Our interface with the wrapped component
        const formProps: FormComponentProps<TForm> = {
            form: form!,
            formInit: (initial) => {
                form = formInit<TForm>(options.name, initial);
                if (options.validator) {
                    form = formUpdateErrors(form, options.validator(form.current));
                }
                setState(form);
                return form;
            },
            formUpdate: (update) => {
                if (!form) {
                    throw new Error("Called formUpdate before formInit");
                }
                if ("name" in update) {
                    // Field update
                    form = formUpdateFields(form, [update]);
                    // Apply validation only when the form is being updated with new data.
                    if ("value" in update && options.validator) {
                        form = formUpdateErrors(form, options.validator(form.current));
                    }
                }
                else {
                    // Form-wide meta update
                    form = formUpdate(form, update);
                }
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
export function injectStateBackedForm<TForm = any, TOwnProps = {}>(options: FormOptions<TForm>) {
    return (WrappedComponent: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>) => {
        return lift(WrappedComponent, React.useState, options);
    };
}

/**
 * Higher-order component which provides a redux-backed FormComponentProps implementation
 *
 * @param options Configuration options for the form.
 */
export function injectStoreBackedForm<TForm = any, TOwnProps = {}>(options: FormOptions<TForm>) {
    return (WrappedComponent: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>) => {
        // Mock the `useState` API to be backed by the redux store
        let state: Form<TForm>;
        let setState: (newState: Form<TForm>) => void;
        interface StoreProps {
            form: Form<TForm>;
        }
        const connector = connect<StoreProps, any, TOwnProps, any>(
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
