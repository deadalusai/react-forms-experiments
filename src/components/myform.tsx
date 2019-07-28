import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import { Form, FieldUpdate, createFormValidator, combineValidators, validators, FormComponentProps, withForm } from "forms";
import { TextInput, SelectInput, Option } from "components/forms";

const FORM_NAME = "my-form";
interface MyForm {
    field1: string;
    field2: string;
    field3: number | null;
}

const formValidator = createFormValidator<MyForm>({
    field1: combineValidators(
        validators.required(),
        validators.pattern(/hello/i, "ERROR.MUST_CONTAIN_HELLO"),
    ),
    field2: combineValidators(
        validators.required(),
    ),
    field3: combineValidators(
        validators.required(),
        validators.greaterThan(1),
        value => (value == 3) ? { error: "ERROR.THREE_NOT_ALLOWED", params: { value } } : null,
    ),
});

export interface StateProps {}
export interface ActionProps {}
export interface OwnProps {}

export type MyFormViewProps = StateProps & ActionProps & OwnProps;

export class MyFormView extends React.Component<MyFormViewProps & FormComponentProps<MyForm>> {

    public componentWillMount() {
        const data: MyForm = {
            field1: "",
            field2: "",
            field3: null,
        };
        this.props.formInit(data);
    }

    public render() {
        const { form } = this.props;
        if (!form) {
            return null
        }
        const onFieldChange = (change: FieldUpdate) => this.props.formUpdateField(change);
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
                    <TextInput label="Field one" field={form.fields.field1} onFieldChange={onFieldChange} />
                </div>
                <div>
                    <TextInput label="Field two" field={form.fields.field2} onFieldChange={onFieldChange} />
                </div>
                <div>
                    <SelectInput label="Field three" field={form.fields.field3} onFieldChange={onFieldChange}>
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
        this.props.formTouch();
        if (form.meta.valid) {
            // TODO: submit
        }
    }

    public reset(form: Form<MyForm>) {
        // Re-initialise the form
        this.props.formInit(form.initial);
    }
}

const wrap = compose<React.ComponentClass<OwnProps>>(
    withForm({
        name: FORM_NAME,
        validator: formValidator,
    }),
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (_state) => ({}),
        {}
    )
);

export default wrap(MyFormView);
