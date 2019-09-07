import * as React from "react";

import { Form, FormErrors, FormUpdateErrorsEvent, FormUpdate, FieldUpdate, formInit, formUpdateAll, formUpdateField, formUpdateErrors } from "./core";
import { FormValidator } from './validators';

export interface FormOptions<TForm> {
    /** The name of the form, global to the app */
    name: string;
    /** A validation function for the form */
    validator?: FormValidator;
    /** The initial state of the form. To set the initial state dynamically, use `formInit` */
    initial?: TForm;
}

export interface FormComponentProps<TForm = any> {
    form: Form<TForm>;
    formInit: (initial: TForm) => void;
    formUpdate: (update: FormUpdate | FieldUpdate<any, TForm>) => void;
    formSetErrors: (errors: FormErrors<TForm>) => void;
}

export abstract class FormComponentBase<TForm, TOwnProps, TWrapperProps, TState = {}> extends React.Component<TOwnProps & TWrapperProps, TState> {
    
    public abstract options: FormOptions<TForm>;
    public abstract component: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>;

    public abstract get(): Form<TForm>;
    public abstract set(form: Form<TForm>): void;

    public formInit(initial: TForm): Form<TForm> {
        let form = formInit<TForm>(this.options.name, initial);
        const errors = this.options.validator && this.options.validator(form.current) || {};
        const event: FormUpdateErrorsEvent = { type: "INIT" };
        return formUpdateErrors(form, errors, event);
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
            if ("value" in update) {
                const errors = this.options.validator && this.options.validator(form.current) || {};
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
            form: Form<TForm>;
        }
        class FormComponent extends FormComponentBase<TForm, TOwnProps, {}, IState> {
            public options = options;
            public component = WrappedComponent;

            constructor(props: any) {
                super(props);
                if (this.options.initial) {
                    const form = this.formInit(this.options.initial);
                    this.state = { form };
                }
            }

            public get(): Form<TForm> {
                return this.state.form;
            }

            public set(form: Form<TForm>): void {
                this.setState({ form });
            }
        }
        return FormComponent;
    };
}

