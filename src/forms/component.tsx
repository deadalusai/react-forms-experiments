import * as React from "react";
import { connect } from "react-redux";

import * as FormsStore from "forms/store";
import { Form, FormUpdate, FieldUpdate, formInit, formUpdate, formUpdateFields, formUpdateErrors, formCompleteAsyncError } from "forms/core";
import { FormValidator } from 'forms';
import { formApplyValidator, registerValidationListener, unregisterValidationListener } from './validators';

export interface FormComponentProps<TForm = any> {
    form: Form<TForm>;
    formInit: (initial: TForm) => void;
    formUpdate: (update: FormUpdate | FieldUpdate<TForm>) => void;
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
    class FormComponent extends React.Component<TOwnProps> {

        public componentWillMount() {
            registerValidationListener(options.name, (fieldName, error) => {
                let form = this.get();
                form = formCompleteAsyncError(form, fieldName as keyof TForm, error);
                this.store(form);
            });
            if (options.initial) {
                this.formInit(options.initial);
            }
        }

        public componentWillUnmount() {
            unregisterValidationListener(options.name);
        }

        public componentWillReceiveProps() {
            const state = useState()[0];
            this.form = state!;
        }

        public formInit(initial: TForm) {
            let form = formInit<TForm>(options.name, initial);
            if (options.validator) {
                form = formUpdateErrors(form, formApplyValidator(form, options.validator));
            }
            this.store(form);
        }

        public formUpdate(update: FormUpdate | FieldUpdate<TForm>) {
            let form = this.get();
            if (!form) {
                throw new Error("Called formUpdate before formInit");
            }
            if ("name" in update) {
                // Field update
                form = formUpdateFields(form, [update]);
                // Apply validation only when the form is being updated with new data.
                if ("value" in update) {
                    if (options.validator) {
                        form = formUpdateErrors(form, formApplyValidator(form, options.validator));
                    }
                }
            }
            else {
                // Form-wide meta update
                form = formUpdate(form, update);
            }
            this.store(form);
        }

        private form: Form<TForm> = null as any;

        public get(): Form<TForm> {
            return this.form;
        }

        public store(form: Form<TForm>) {
            const setState = useState()[1];
            this.form = form;
            setState(form);
        }

        public render() {
            const formProps: FormComponentProps<TForm> = {
                form: this.get(),
                formInit: this.formInit.bind(this),
                formUpdate: this.formUpdate.bind(this),
            };
            return (
                <ComponentClass
                    {...this.props}
                    {...formProps} />
            );
        }
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
        const lifted = lift(WrappedComponent, () => [state, setState], options);
        // HACK: Not sure why this type is not assignable as-is
        return connector(lifted as any);
    };
}
