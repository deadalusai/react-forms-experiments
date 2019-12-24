import * as React from "react";
import { connect } from "react-redux";

import { Form } from "../core";
import * as FormsStore from "./store";
import { FormOptions, FormComponentProps, FormNameProps, FormComponentBase } from "../component";

function noFormName(): never {
    throw new Error("Store-backed form has no name");
}

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
            setForm: (form: Form<TForm>) => void;
        }
        class FormComponent extends FormComponentBase<TForm, TOwnProps, IStoreProps & IActionProps, {}> {
            public options = options;
            public component = WrappedComponent;

            private initial: Form<TForm> | null = null;

            constructor(props: TOwnProps & IStoreProps & IActionProps & FormNameProps) {
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
                // NOTE: this may return `null` if the consumer opts not to provide intial
                // form state, but is typed as non-null as this is the primary use-case.
                // Those consumers must null-check the form prop before rendering and call formInit manually.
                return this.props.form || this.initial!;
            }

            public set(form: Form<TForm>): void {
                this.props.setForm(form);
            }
        }
        const connector = connect<IStoreProps, IActionProps, TOwnProps & FormNameProps, any>(
            (rootState, ownProps) => {
                const formName = ownProps.formName || noFormName();
                const form = rootState["forms"][formName];
                return { form };
            },
            (dispatch, ownProps) => {
                const setForm = (form: Form<TForm>) => {
                    const formName = ownProps.formName || noFormName();
                    dispatch(FormsStore.actions.setForm(formName, form))
                };
                return { setForm };
            }
        );
        return connector(FormComponent as any);
    };
}