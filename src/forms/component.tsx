import * as React from "react";

import { Form, FormErrors, FormUpdateErrorsEvent, FormUpdate, FieldUpdate, formInit, formUpdateAll, formUpdateField, formUpdateErrors } from "./core";
import { FormValidator } from './validators';

export interface FormOptions<TForm> {
    /** A validation function for the form */
    validator?: FormValidator;
    /** The initial state of the form. To set the initial state dynamically, use `formInit` */
    initial?: TForm;
}

/** The public higher-order component form props */
export interface FormConfigProps {
    /** The name of the form, global to the app */
    formName: string;
    /**
     * If set, forces the form component to be always re-initialize when mounted.
     * NOTE: Only applicable to store-backed forms.
     */
    formForceInitOnMount?: boolean;
}

/** The internal interface provided by the higher-order component factory */
export interface FormComponentProps<TForm = any> {
    form: Form<TForm>;
    formName: string;
    formForceInitOnMount: boolean,
    formInit: (initial: TForm) => void;
    formUpdate: (update: FormUpdate | FieldUpdate<any, TForm>) => void;
    formSetErrors: (errors: FormErrors<TForm>) => void;
}

export abstract class FormComponentBase<TForm, TOwnProps, TWrapperProps, TState = {}> extends React.Component<TOwnProps & TWrapperProps & FormConfigProps, TState> {

    public abstract options: FormOptions<TForm>;
    public abstract component: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>;

    public abstract get(): Form<TForm>;
    public abstract set(form: Form<TForm>): void;

    public formInit(initial: TForm): Form<TForm> {
        let form = formInit<TForm>(initial);
        if (this.options.validator) {
            const errors = this.options.validator(form.current);
            const event: FormUpdateErrorsEvent = { type: "INIT" };
            form = formUpdateErrors(form, errors, event);
        }
        return form;
    }

    public formUpdate(update: FormUpdate | FieldUpdate<any, TForm>): Form<TForm> {
        let form = this.get();
        if (!form) {
            throw new Error("Called formUpdate before formInit");
        }
        if ("name" in update) {
            // Field update
            form = formUpdateField(form, update);
            // Apply validation only on events which change a value in the form
            if ("value" in update && this.options.validator) {
                const errors = this.options.validator(form.current);
                const event: FormUpdateErrorsEvent = { type: "CHANGE", fieldName: update.name as string };
                form = formUpdateErrors(form, errors, event);
            }
        }
        else {
            // Form-wide meta update
            form = formUpdateAll(form, update);
        }
        return form;
    }

    public formSetErrors(errors: FormErrors<TForm>): Form<TForm> {
        let form = this.get();
        if (!form) {
            throw new Error("Called formSetErrors before formInit");
        }
        const event: FormUpdateErrorsEvent = { type: "SETERRORS" };
        return formUpdateErrors(form, errors, event);
    }

    public render(): React.ReactNode {
        const formProps: FormComponentProps<TForm> = {
            form: this.get(),
            formName: this.props.formName,
            formForceInitOnMount: this.props.formForceInitOnMount as boolean || false,
            formInit: (init) => this.set(this.formInit(init)),
            formUpdate: (update) => this.set(this.formUpdate(update)),
            formSetErrors: (errors) => this.set(this.formSetErrors(errors)),
        };
        const Component = this.component;
        return <Component {...this.props} {...formProps} />;
    }
}

/**
 * Higher-order component which provides a form state-backed FormComponentProps implementation
 *
 * @param options Configuration options for the form.
 */
export function injectStateBackedForm<TForm = any, TOwnProps = {}>(options: FormOptions<TForm>) {
    return (WrappedComponent: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>) => {
        interface IState {
            form: Form<TForm> | null;
        }
        class StateFormComponent extends FormComponentBase<TForm, TOwnProps, {}, IState> {
            public options = options;
            public component = WrappedComponent;
            public state = {
                form: this.options.initial && this.formInit(this.options.initial) || null
            };
            // NOTE: We keep a local variable with the most current form state to allow chained
            // set/get/set calls to stack rather than always replacing the state each time.
            private current: Form<TForm> | null = null;

            public get(): Form<TForm> {
                // NOTE: this method may return `null` if the consumer opts not to provide intial
                // form state, but is typed as non-null as this is the primary use-case.
                // Those consumers must null-check the form prop before rendering and call formInit manually.
                return this.current || this.state.form!;
            }

            public set(form: Form<TForm>): void {
                this.current = form;
                this.setState({ form }, () => this.current = null);
            }
        }
        return StateFormComponent;
    };
}

