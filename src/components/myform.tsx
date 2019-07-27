import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import * as FormStore from "store/forms";
import { Form, Field, FormValidators, combineValidators, validators } from "store/forms";
import { TextInput, SelectInput, Option } from "./forms";

const FORM_NAME = "my-form";
interface MyForm {
    field1: string | null;
    field2: string | null;
    field3: number | null;
}

const formValidators: FormValidators<MyForm> = {
    field1: combineValidators(
        validators.required(),
        validators.pattern(/hello/i, "ERROR.MUST_BE_HELLO"),
    ),
    field2: combineValidators(
        validators.required(),
    ),
    field3: combineValidators(
        validators.required(),
        validators.greaterThan(1),
        value => (value == 3) ? { error: "ERROR.NOT_ALLOWED", params: { value } } : null,
    ),
};

export interface StateProps {
    form: Form<MyForm> | undefined;
}
export interface ActionProps {
    initForm: typeof FormStore.actions.initForm;
    updateForm: typeof FormStore.actions.updateForm;
    touchForm: typeof FormStore.actions.touchForm;
}
export interface OwnProps {}

export type MyFormViewProps = StateProps & ActionProps & OwnProps;

export class MyFormView extends React.Component<MyFormViewProps> {

    public componentWillMount() {
        const data: MyForm = {
            field1: null,
            field2: null,
            field3: null,
        };
        this.props.initForm(FORM_NAME, data, formValidators);
    }

    public render() {
        const { form } = this.props;
        if (!form) {
            return null
        }
        const onFieldChange = (field: Field) => this.props.updateForm(form.name, field, formValidators);
        const initial = form.initial;
        const data = {
            field1: form.fields.field1.value,
            field2: form.fields.field2.value,
            field3: form.fields.field3.value,
        };
        const meta = {
            form: form.meta,
            field1: form.fields.field1.meta,
            field2: form.fields.field2.meta,
            field3: form.fields.field3.meta,
        };
        const options = [
            { label: "Option one", value: 1 },
            { label: "Option two", value: 2 },
            { label: "Option three", value: 3 },
        ];
        return (
            <section>
                <div>
                    <TextInput label="Field one" field={form.fields.field1} fieldChange={onFieldChange} />
                </div>
                <div>
                    <TextInput label="Field two" field={form.fields.field2} fieldChange={onFieldChange} />
                </div>
                <div>
                    <SelectInput label="Field three" field={form.fields.field3} fieldChange={onFieldChange}>
                        <Option label="NO SELECTION" value={null} />
                        {options.map((o, i) => <Option key={i} {...o} />)}
                    </SelectInput>
                </div>
                <div>
                    <button onClick={() => this.submit(form)}>Submit</button>
                    <button onClick={() => this.reset(form)}>Reset</button>
                </div>
                <pre>
                    initial: {JSON.stringify(initial, null, 4)}
                </pre>
                <pre>
                    data: {JSON.stringify(data, null, 4)}
                </pre>
                <pre>
                    meta: {JSON.stringify(meta, null, 4)}
                </pre>
            </section>
        );
    }

    public submit(form: Form<MyForm>) {
        this.props.touchForm(form.name);
        if (form.meta.valid) {
            // TODO: submit
        }
    }

    public reset(form: Form<MyForm>) {
        // Re-initialise the form
        this.props.initForm(form.name, form.initial, formValidators);
    }
}

const wrap = compose(
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (state) => ({
            form: FormStore.selectors.getForm<MyForm>(state.forms, FORM_NAME),
        }),
        { 
            initForm: FormStore.actions.initForm,
            updateForm: FormStore.actions.updateForm,
            touchForm: FormStore.actions.touchForm,
        }
    )
);

export default wrap(MyFormView);
