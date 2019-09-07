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
        class FormComponent extends FormComponentBase<TForm, TOwnProps, IStoreProps & IActionProps, {}> {
            public options = options;
            public component = WrappedComponent;

            private initial: Form<TForm> | null = null;

            constructor(props: TOwnProps & IStoreProps & IActionProps) {
                super(props);
                if (this.options.initial) {
                    this.initial = this.formInit(this.options.initial);
                }
            }

            public componentDidMount() {
                // Push the initialized form state back to the store (will trigger re-render)
                if (this.initial) {
                    this.set(this.initial);
                    this.initial = null;
                }
            }

            public get(): Form<TForm> {
                return this.props.form || this.initial!;
            }
            
            public set(form: Form<TForm>): void {
                this.props.formUpdate(form);
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