import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import { Form, FieldUpdate, FormComponentProps, withStoreBackedForm } from "forms";
import { TextInput, SelectInput, Option } from "components/forms";
import * as Validators from "forms/validators";

const FORM_NAME = "my-form";
interface MyForm {
    field1: string;
    field2: string;
    field3: number | null;
}

// Building a form validation routine using validator composition
const fieldValidator = Validators.createFormValidator<MyForm>({
    field1: Validators.combine(
        Validators.required(),
        Validators.pattern(/hello/i, "ERROR.MUST_CONTAIN_HELLO"),
    ),
    field2: Validators.combine(
        Validators.required(),
    ),
    field3: Validators.combine(
        Validators.required(),
        Validators.greaterThan(1),
        value => (value == 3) ? { error: "ERROR.THREE_NOT_ALLOWED", params: { value } } : null,
    ),
});

// Building a form validation routine manually
const formValidator = (form: MyForm) => {
    const errors = fieldValidator(form);
    // Cross-field validation example
    if (!errors.field2 && form.field1 != form.field2) {
        errors.field2 = { error: "ERROR.FIELD1_FIELD2_MUST_MATCH" };
    }
    return errors;
};

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
                <form onSubmit={(e) => { e.preventDefault(); this.submit(form); }}>
                    <div>
                        <TextInput
                            label="Field one"
                            field={form.fields.field1}
                            fieldChange={onFieldChange} />
                    </div>
                    <div>
                        <TextInput
                            label="Field two"
                            field={form.fields.field2}
                            fieldChange={onFieldChange} />
                    </div>
                    <div>
                        <SelectInput
                            label="Field three"
                            field={form.fields.field3}
                            fieldChange={onFieldChange}>
                            <Option label="NO SELECTION" value={null} />
                            {options.map((o, i) => <Option key={i} {...o} />)}
                        </SelectInput>
                    </div>
                    <div>
                        <button type="submit">Submit</button>
                        <button type="button" onClick={() => this.reset(form)}>Reset</button>
                    </div>
                </form>
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
        if (!form.meta.valid) {
            this.props.formTouch();
            return;
        }
        const json = JSON.stringify(form.current, null, 4);
        alert(json);
    }

    public reset(form: Form<MyForm>) {
        // Re-initialise the form
        this.props.formInit(form.initial);
    }
}

const wrap = compose<React.ComponentClass<OwnProps>>(
    withStoreBackedForm({
        name: FORM_NAME,
        validator: formValidator,
    }),
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (_state) => ({}),
        {}
    )
);

export default wrap(MyFormView);
