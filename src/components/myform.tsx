import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import { Form, FieldUpdate, FormComponentProps, withStoreBackedForm } from "forms";
import * as Validators from "forms/validators";
import { keysOf } from "forms/core";
import { TextInput, SelectInput, SelectOption, RadioInputGroup, RadioInput, CheckboxInput } from "components/forms";

const FORM_NAME = "my-form";

enum FooType { foo1, foo2, foo3 };
enum BarType { bar1 = "first", bar2 = "second", bar3 = "third" };

interface MyForm {
    text1: string;
    text2: string;
    checkbox1: boolean;
    select1: FooType | null;
    radio1: BarType | null;
}

const SELECT_OPTIONS = [
    { label: "Foo one", value: FooType.foo1 },
    { label: "Foo two", value: FooType.foo2 },
    { label: "Foo three", value: FooType.foo3 },
];

const RADIO_OPTIONS = [
    { label: "Bar one", value: BarType.bar1 },
    { label: "Bar two", value: BarType.bar2 },
    { label: "Bar three", value: BarType.bar3 },
];

// Building a form validation routine using validator composition
const formFieldValidator = Validators.createFormValidator<MyForm>({
    text1: Validators.combine(
        Validators.required(),
        Validators.pattern(/hello/i, "ERROR.MUST_CONTAIN_HELLO"),
    ),
    text2: Validators.combine(
        Validators.required(),
    ),
    checkbox1: Validators.required(),
    select1: Validators.combine(
        Validators.required(),
        Validators.greaterThan(1),
        value => (value == 3) ? { error: "ERROR.THREE_NOT_ALLOWED", params: { value } } : null,
    ),
    radio1: Validators.required(),
});

// Building a form validation routine manually
const formValidator = (form: MyForm) => {
    const errors = formFieldValidator(form);
    // Cross-field validation example
    if (!errors.text2 && form.text1 != form.text2) {
        errors.text2 = { error: "ERROR.FIELD1_FIELD2_MUST_MATCH" };
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
        return (
            <section>
                <form onSubmit={(e) => { e.preventDefault(); this.submit(form); }}>
                    <div>
                        <TextInput
                            label="Text input 1"
                            field={form.fields.text1}
                            fieldChange={onFieldChange} />
                    </div>
                    <div>
                        <TextInput
                            label="Text input 2"
                            field={form.fields.text2}
                            fieldChange={onFieldChange} />
                    </div>
                    <div>
                        <CheckboxInput
                            label="Checkbox input"
                            field={form.fields.checkbox1}
                            fieldChange={onFieldChange} />
                    </div>
                    <div>
                        <SelectInput
                            label="Select input"
                            field={form.fields.select1}
                            fieldChange={onFieldChange}>
                            <SelectOption label="-- Please Select --" value={null} />
                            {SELECT_OPTIONS.map((option) => <SelectOption key={option.value} {...option} />)}
                        </SelectInput>
                    </div>
                    <div>
                        <RadioInputGroup
                            label="Radio group"
                            field={form.fields.radio1}>
                            {RADIO_OPTIONS.map((option) => (
                                <RadioInput
                                    key={option.value}
                                    label={option.label}
                                    value={option.value}
                                    field={form.fields.radio1}
                                    fieldChange={onFieldChange} />
                            ))}
                        </RadioInputGroup>
                    </div>
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
    withStoreBackedForm<OwnProps, MyForm>({
        name: FORM_NAME,
        validator: formValidator,
        initial: {
            text1: "",
            text2: "",
            checkbox1: false,
            select1: null,
            radio1: null,
        }
    }),
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (_state) => ({}),
        {}
    )
);

export default wrap(MyFormView);
