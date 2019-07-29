import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import { Form, FieldUpdate, FormComponentProps, withStoreBackedForm } from "forms";
import * as Validators from "forms/validators";
import { keysOf } from "forms/core";
import { TextInput, SelectInput, Option } from "components/forms";
// import SubFormView, { SubForm } from "./subform";

const FORM_NAME = "my-form";
interface MyForm {
    field1: string;
    field2: string;
    field3: number | null;
    // field4: SubForm;
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

    public render() {
        const { form } = this.props;
        const onFieldChange = (change: FieldUpdate) => this.props.formUpdateField(change);
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
                    {/* <SubFormView
                        value={form.fields.field4.value}
                        valueChange={value => onFieldChange({ name: "field4", value, touched: true })} /> */}
                    <div>
                        <button type="submit">Submit</button>
                        <button type="button" onClick={() => this.reset(form)}>Reset</button>
                    </div>
                </form>
                <section>
                    {keysOf(form.fields).map(name => {
                        const { meta } = form.fields[name];
                        return (
                            <button key={name} type="button" onClick={() => this.props.formUpdateField({ name, disabled: !meta.disabled })}>
                                {meta.disabled ? "Enable" : "Disable"} {name}
                            </button>
                        );
                    })}
                    <button key={name} type="button" onClick={() => this.props.formUpdateAllFields({ disabled: !form.meta.disabled })}>
                        {form.meta.disabled ? "Enable" : "Disable"} all fields
                    </button>
                </section>
                <pre>
                    initial: {JSON.stringify(form.initial, null, 4)}
                </pre>
                <pre>
                    data: {JSON.stringify(form.current, null, 4)}
                </pre>
                <pre>
                    meta: {JSON.stringify({ meta: form.meta, fields: form.fields }, null, 4)}
                </pre>
            </section>
        );
    }

    public submit(form: Form<MyForm>) {
        if (!form.meta.valid) {
            this.props.formUpdateAllFields({ touched: true });
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
    withStoreBackedForm<MyForm>({
        name: FORM_NAME,
        validator: formValidator,
        initial: {
            field1: "",
            field2: "",
            field3: null,
            // field4: {
            //     sub1: "",
            //     sub2: "",
            // }
        }
    }),
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (_state) => ({}),
        {}
    )
);

export default wrap(MyFormView);
