import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { delayMs } from "util";
import { RootState } from "store";
import { Form, injectStateBackedForm } from "forms";
import { FormComponentProps, injectStoreBackedForm } from "forms/redux";
import * as Validators from "forms/validators";
import { InputContainer, TextInput, SelectInput, MultiSelectInput, RadioInput, CheckboxInput } from "forms/controls";
import { MyForm, BazType, FooType, BarType, actionCreators as MyFormActions } from "store/myform";
import { FormOptions, FormConfigProps } from "forms/component";

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
    text1: [
        Validators.required(),
        Validators.pattern(/hello/i, "ERROR.MUST_CONTAIN_HELLO"),
    ],
    text2: [
        Validators.required(),
    ],
    checkbox1: Validators.required(),
    checkbox2: Validators.required(),
    checkbox3: Validators.required(),
    select1: [
        Validators.required(),
        Validators.greaterThan(1),
        value => value === 3 ? { error: "ERROR.THREE_NOT_ALLOWED", params: { value } } : null,
    ],
    select2: [
        value => value.length === 0 ? { error: "ERROR.REQUIRED" } : null,
        value => value.length > 2 ? { error: "ERROR.SELECT_AT_MOST_TWO_OPTIONS" } : null,
    ],
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

const validateLengthLessThanAsync = async (value: string, expected: number) => {
    // Fake a delay
    await delayMs(2500);
    return (value.length < expected)
        ? { error: "ERROR.TEXT_LENGTH_LESS_THAN_ASYNC", params: { value, expected } }
        : null;
};

export interface OwnProps {
    arg1: string;
    arg2: number;
}
export interface StateProps {
    submitting: boolean;
}
export interface ActionProps {
    saveChanges: typeof MyFormActions.saveChanges
}

interface ComponentState {
    text1Validating: boolean;
}

export type MyFormViewProps = StateProps & ActionProps & OwnProps & FormComponentProps<MyForm>;

export class MyFormView extends React.Component<MyFormViewProps, ComponentState> {

    public state = { text1Validating: false };

    public render() {
        const { form, formUpdate } = this.props;
        const disabled = this.props.submitting;
        return (
            <section>
                <form onSubmit={(e) => { e.preventDefault(); this.submit(form); }}>
                    <InputContainer
                        label={<>
                            {"Text input 1"}
                            {this.state.text1Validating && " (validating)"}
                        </>}
                        field={form.fields.text1}>
                        <TextInput
                            field={form.fields.text1}
                            fieldUpdate={formUpdate}
                            disabled={disabled}
                            onBlur={() => this.startText1Validation(form)} />
                    </InputContainer>

                    <InputContainer
                        label="Text input 2"
                        field={form.fields.text2}>
                        <TextInput
                            field={form.fields.text2}
                            fieldUpdate={formUpdate}
                            disabled={disabled} />
                    </InputContainer>

                    <InputContainer
                        label="Checkbox input"
                        field={form.fields.checkbox1}>
                        <CheckboxInput
                            label="Checkbox-sepecific label"
                            field={form.fields.checkbox1}
                            fieldUpdate={formUpdate}
                            disabled={disabled} />
                    </InputContainer>

                    <InputContainer
                        label="Checkbox group"
                        field={form.fields.checkbox2}>
                        {BAZ_OPTIONS.map((option) => (
                            <CheckboxInput
                                key={option.value}
                                label={option.label}
                                checkedProvider={() => form.fields.checkbox2.value.some(v => v === option.value)}
                                valueProvider={checked => checked
                                    ? [ ...form.fields.checkbox2.value, option.value ]
                                    : form.fields.checkbox2.value.filter(v => v !== option.value)}
                                field={form.fields.checkbox2}
                                fieldUpdate={formUpdate}
                                disabled={disabled} />
                        ))}
                    </InputContainer>

                    <InputContainer
                        label="Mutually-exclusive checkbox group"
                        field={form.fields.checkbox3}>
                        {BAZ_OPTIONS.map((option) => (
                            <CheckboxInput
                                key={option.value}
                                label={option.label}
                                checkedProvider={() => form.fields.checkbox3.value === option.value}
                                valueProvider={checked => checked ? option.value : null}
                                field={form.fields.checkbox3}
                                fieldUpdate={formUpdate}
                                disabled={disabled} />
                        ))}
                    </InputContainer>

                    <InputContainer
                        label="Select input"
                        field={form.fields.select1}>
                        <SelectInput
                            field={form.fields.select1}
                            fieldUpdate={formUpdate}
                            disabled={disabled}
                            options={[
                                { label: "-- Please select --", value: null },
                                ...FOO_OPTIONS,
                            ]} />
                    </InputContainer>

                    <InputContainer
                        label="Multi-select input"
                        field={form.fields.select2}>
                        <MultiSelectInput
                            field={form.fields.select2}
                            fieldUpdate={formUpdate}
                            disabled={disabled}
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
                                fieldUpdate={formUpdate}
                                disabled={disabled} />
                        ))}
                    </InputContainer>

                    <div>
                        <button
                            type="submit"
                            disabled={this.props.submitting}>
                            Submit
                        </button>
                        <button
                            type="button"
                            disabled={this.props.submitting}
                            onClick={() => this.reset(form)}>
                            Reset
                        </button>
                        <button
                            type="button"
                            disabled={this.props.submitting}
                            onClick={() => this.setFields()}>
                            Set some fields manually
                        </button>
                    </div>
                </form>
                <pre>arg1: {this.props.arg1}</pre>
                <pre>arg2: {this.props.arg2}</pre>
                <pre>formName: {this.props.formName}</pre>
                <pre>form: {JSON.stringify(form, null, 4)}</pre>
            </section>
        );
    }
    
    public setFields(): void {
        this.props.formUpdate({ name: "text1", value: "Hello", type: "CHANGE" });
        this.props.formUpdate({ name: "text2", value: "World", type: "CHANGE" });
    }

    public submit(form: Form<MyForm>) {
        this.props.formUpdate({ visited: true, submitted: true });
        if (!form.meta.valid || this.state.text1Validating) {
            return;
        }
        this.props.saveChanges(this.props.formName, form.current);
    }

    public reset(form: Form<MyForm>) {
        // Re-initialise the form
        this.props.formInit(form.initial);
    }

    public async startText1Validation(form: Form<MyForm>) {
        const { text1 } = form.fields;
        if (!text1.meta.valid) {
            return;
        }
        this.setState({ text1Validating: true });
        const error = await validateLengthLessThanAsync(text1.value, 8);
        this.setState({ text1Validating: false });
        this.props.formSetErrors({ text1: error });
    }
}

const options: FormOptions<MyForm> = {
    validator: formValidator,
    initial: {
        text1: "",
        text2: "",
        checkbox1: false,
        checkbox2: [],
        checkbox3: null,
        select1: null,
        select2: [],
        radio1: null,
    }
};

// Store-backed variant of this form
// NOTE: Need to union in `StoreFormProps` because `compose` loses that context
const wrapStoreForm = compose<React.ComponentClass<OwnProps & FormConfigProps>>(
    injectStoreBackedForm<MyForm, OwnProps>(options),
    connect<StateProps, ActionProps, OwnProps & FormConfigProps, RootState>(
        (_state) => ({
            submitting: _state.myform.submitting,
        }),
        {
            saveChanges: MyFormActions.saveChanges,
        }
    )
);
export const MyFormViewStoreBacked = wrapStoreForm(MyFormView);

// State-backed variant of this form
// NOTE: Need to union in `StoreFormProps` because `compose` loses that context
const wrapStateForm = compose<React.ComponentClass<OwnProps & FormConfigProps>>(
    injectStateBackedForm<MyForm, OwnProps>(options),
    connect<StateProps, ActionProps, OwnProps & FormConfigProps, RootState>(
        (_state) => ({
            submitting: _state.myform.submitting,
        }),
        {
            saveChanges: MyFormActions.saveChanges,
        }
    )
);
export const MyFormViewStateBacked = wrapStateForm(MyFormView);
