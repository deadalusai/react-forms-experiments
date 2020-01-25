import * as React from "react";
import { connect } from "react-redux";

import { Form } from "../core";
import * as FormsStore from "./store";
import { FormOptions, FormComponentProps, FormConfigProps, FormComponentBase } from "../component";

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
        class StoreFormComponent extends FormComponentBase<TForm, TOwnProps, IStoreProps & IActionProps, {}> {
            public options = options;
            public component = WrappedComponent;
            // NOTE: We keep a local variable with the most current form state to allow chained
            // set/get/set calls to stack rather than always replacing the state each time.
            private current: Form<TForm> | null = null;
            // This variable holds the initial state of the form to support the first render
            // which fires *before* componentDidMount
            private initial = this.options.initial && this.formInit(this.options.initial) || null;

            public componentDidMount() {
                if (this.initial) {
                    const shouldInit = !this.props.form || this.props.formForceInitOnMount;
                    if (shouldInit) {
                        // Push the initial form state back to the store (will trigger re-render)
                        this.set(this.initial);
                    }
                    this.initial = null;
                }
            }

            public componentDidUpdate() {
                this.current = null;
            }

            public get(): Form<TForm> {
                // NOTE: this may return `null` if the consumer opts not to provide intial
                // form state, but is typed as non-null as this is the primary use-case.
                // Those consumers must null-check the form prop before rendering and call formInit manually.
                return this.current || this.props.form || this.initial!;
            }

            public set(form: Form<TForm>): void {
                this.current = form;
                this.props.setForm(form);
            }
        }
        const connector = connect<IStoreProps, IActionProps, TOwnProps & FormConfigProps, any>(
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
        return connector(StoreFormComponent as any);
    };
}