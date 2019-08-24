import * as React from "react";
import { connect } from "react-redux";

import { Form } from "../core";
import * as FormsStore from "./store";
import { FormOptions, FormComponentProps, FormComponentBase } from "../component";

/**
 * Higher-order component which provides a redux-backed FormComponentProps implementation
 *
 * @param options Configuration options for the form.
 */
export function injectStoreBackedForm<TForm = any, TOwnProps = {}>(options: FormOptions<TForm>) {
    return (WrappedComponent: React.ComponentClass<TOwnProps & FormComponentProps<TForm>>) => {
        interface IStoreProps {
            form: Form<TForm>;
        }
        interface IActionProps {
            formUpdate: typeof FormsStore.actions.setForm;
        }
        class FormComponent extends FormComponentBase<TForm, IStoreProps & IActionProps & TOwnProps> {
            public options = options;

            public get(): Form<TForm> {
                return this.props.form;
            }
            
            public set(form: Form<TForm>): void {
                this.props.formUpdate(form);
            }

            public render(): React.ReactNode {
                let form = this.get();
                // Hack: Initialise the form store for the first time (triggers a re-render)
                if (options.initial && !form) {
                    form = this.formInit(options.initial);
                    this.set(form);
                }
                const formProps: FormComponentProps<TForm> = {
                    form,
                    formInit: (init) => this.set(this.formInit(init)),
                    formUpdate: (form) => this.set(this.formUpdate(form)),
                    formSetErrors: (errors) => this.set(this.formSetErrors(errors)),
                };
                return (
                    <WrappedComponent
                        {...this.props}
                        {...formProps} />
                );
            }
        }
        const connector = connect<IStoreProps, IActionProps, TOwnProps, any>(
            (rootState) => {
                const form = rootState["forms"][options.name];
                return { form };
            },
            {
                formUpdate: FormsStore.actions.setForm,
            }
        );
        return connector(FormComponent as any);
    };
}