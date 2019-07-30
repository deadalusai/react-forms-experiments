import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import { Form, FormComponentProps, injectStoreBackedForm } from "forms";
import * as Validators from "forms/validators";
import { keysOf } from "forms/core";
import { InputContainer, TextInput, SelectInput, MultiSelectInput, RadioInput, CheckboxInput } from "forms/controls";

const FORM_NAME = "my-form";

enum FooType { foo1, foo2, foo3 };
enum BarType { bar1 = "first", bar2 = "second", bar3 = "third" };
enum BazType { baz1 = "aaa", baz2 = "bbb", baz3 = "ccc" }

interface MyForm {
    text1: string;
    text2: string;
    checkbox1: boolean;
    checkbox2: BazType | null;
    select1: FooType | null;
    select2: FooType[];
    radio1: BarType | null;
}

const BAZ_OPTIONS = [
    { label: "Baz one", value: BazType.baz1 },
    { label: "Baz two", value: BazType.baz2 },
    { label: "Baz three", value: BazType.baz3 },
];

const FOO_OPTIONS = [
    { label: "Foo one", value: FooType.foo1 },
    { label: "Foo two", value: FooType.foo2 },
    { label: "Foo three", value: FooType.foo3 },
];

const BAR_OPTIONS = [
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
    checkbox2: Validators.required(),
    select1: Validators.combine(
        Validators.required(),
        Validators.greaterThan(1),
        value => (value == 3) ? { error: "ERROR.THREE_NOT_ALLOWED", params: { value } } : null,
    ),
    select2: Validators.combine(
        value => value.length === 0 ? { error: "ERROR.REQUIRED" } : null,
        value => value.length > 2 ? { error: "ERROR.SELECT_AT_MOST_TWO_OPTIONS" } : null,
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
        const { form, formUpdate } = this.props;
        return (
            <section>
                <form onSubmit={(e) => { e.preventDefault(); this.submit(form); }}>
                    <InputContainer
                        label="Text input 1"
                        field={form.fields.text1}>
                        <TextInput
                            field={form.fields.text1}
                            fieldChange={formUpdate} />
                    </InputContainer>

                    <InputContainer
                        label="Text input 2"
                        field={form.fields.text2}>
                        <TextInput
                            field={form.fields.text2}
                            fieldChange={formUpdate} />
                    </InputContainer>
                    
                    <InputContainer
                        label="Checkbox input"
                        field={form.fields.checkbox1}>
                        <CheckboxInput
                            label="Checkbox-sepecific label"
                            field={form.fields.checkbox1}
                            fieldChange={formUpdate} />
                    </InputContainer>
                    
                    <InputContainer
                        label="Mutually-exclusive checkbox group"
                        field={form.fields.checkbox2}>
                        {BAZ_OPTIONS.map((option) => (
                            <CheckboxInput
                                key={option.value}
                                label={option.label}
                                values={{ checked: option.value, unchecked: null }}
                                field={form.fields.checkbox2}
                                fieldChange={formUpdate} />
                        ))}
                    </InputContainer>
                    
                    <InputContainer
                        label="Select input"
                        field={form.fields.select1}>
                        <SelectInput
                            field={form.fields.select1}
                            fieldChange={formUpdate}
                            options={[
                                { label: "-- Please select --", value: null },
                                ...FOO_OPTIONS,
                            ]} />
                    </InputContainer>
                    
                    <InputContainer
                        label="Multi-select input"
                        field={form.fields.select1}>
                        <MultiSelectInput
                            field={form.fields.select2}
                            fieldChange={formUpdate}
                            options={BAZ_OPTIONS} />
                    </InputContainer>
                    
                    <InputContainer
                        label="Radio group"
                        field={form.fields.radio1}>
                        {BAR_OPTIONS.map((option) => (
                            <RadioInput
                                key={option.value}
                                label={option.label}
                                value={option.value}
                                field={form.fields.radio1}
                                fieldChange={formUpdate} />
                        ))}
                    </InputContainer>
                    
                    <div>
                        <button type="submit">Submit</button>
                        <button type="button" onClick={() => this.reset(form)}>Reset</button>
                    </div>
                </form>
                <section>
                    {keysOf(form.fields).map(name => {
                        const { meta } = form.fields[name];
                        return (
                            <button key={name} type="button" onClick={() => formUpdate({ name, disabled: !meta.disabled })}>
                                {meta.disabled ? "Enable" : "Disable"} {name}
                            </button>
                        );
                    })}
                    <button key={name} type="button" onClick={() => formUpdate({ disabled: !form.meta.disabled })}>
                        {form.meta.disabled ? "Enable" : "Disable"} all fields
                    </button>
                </section>
                <pre>
                    form: {JSON.stringify(form, null, 4)}
                </pre>
            </section>
        );
    }

    public submit(form: Form<MyForm>) {
        if (!form.meta.valid) {
            this.props.formUpdate({ touched: true });
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
    injectStoreBackedForm<MyForm, OwnProps>({
        name: FORM_NAME,
        validator: formValidator,
        initial: {
            text1: "",
            text2: "",
            checkbox1: false,
            checkbox2: null,
            select1: null,
            select2: [],
            radio1: null,
        }
    }),
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (_state) => ({}),
        {}
    )
);

export default wrap(MyFormView);
