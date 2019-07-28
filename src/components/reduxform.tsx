import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { Field, reduxForm, InjectedFormProps, FormErrors, WrappedFieldProps, formValueSelector, FormState } from 'redux-form'

import { RootState } from "store";
import { FormError } from "forms";
import { ErrorMessage, WarningMessage } from "components/forms";
import { object } from "prop-types";

const FORM_NAME = "redux-form";
interface TestFormData {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
}

const INITIAL_VALUES: TestFormData = {
    firstName: "Joe",
    lastName: "Bloggs",
    email: "joe@bloggs.com",
};

const VALIDATE_FORM = (values: TestFormData) => {
    const errors: FormErrors<TestFormData, FormError> = {};
    if (!values.firstName) {
        errors.firstName = { error: "ERROR.REQUIRED" };
    } else if (values.firstName.length > 15) {
        errors.firstName = { error: "ERROR.FIRSTNAME_TOO_LONG", params: { max: 15 } };
    }
    if (!values.lastName) {
        errors.lastName = { error: "ERROR.REQUIRED" };
    } else if (values.lastName.length > 15) {
        errors.lastName = { error: "ERROR.LASTNAME_TOO_LONG", params: { max: 15 } };
    }
    if (!values.email) {
        errors.email = { error: "ERROR.REQUIRED" };
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
        errors.email = { error: "ERROR.INVALID_EMAIL_ADDRESS" }
    }
    return errors;
};

export interface StateProps {
    formValue: TestFormData,
    formState: FormState,
}
export interface ActionProps { }
export interface OwnProps { }

export type ReduxFormViewProps = StateProps & ActionProps & OwnProps & InjectedFormProps<TestFormData, {}, FormError>;

export class ReduxFormView extends React.Component<ReduxFormViewProps> {

    public componentWillMount() {
    }

    public render() {
        const initial = this.props.initialValues;
        return (
            <form onSubmit={this.props.handleSubmit((data) => this.submit(data))}>
                <div>
                    <label htmlFor="firstName">First Name</label>
                    <Field name="firstName" component={TextInput} type="text" />
                </div>
                <div>
                    <label htmlFor="lastName">Last Name</label>
                    <Field name="lastName" component={TextInput} type="text" />
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <Field name="email" component={TextInput} type="email" />
                </div>
                <button type="submit">Submit</button>
                <pre>
                    initial: {JSON.stringify(initial, null, 4)}
                </pre>
                <pre>
                    data: {JSON.stringify(this.props.formValue, null, 4)}
                </pre>
                <pre>
                    state: {JSON.stringify(this.props.formState, null, 4)}
                </pre>
            </form>
        );
    }

    public submit(data: TestFormData) {
        console.log(data);
    }
}

const wrap = compose<React.ComponentClass<OwnProps>>(
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (state) => ({
            initialValues: INITIAL_VALUES,
            formValue: formValueSelector(FORM_NAME)(state.form, ...Object.keys(INITIAL_VALUES)),
            formState: state.form[FORM_NAME],
        }),
        {

        }
    ),
    reduxForm({
        form: FORM_NAME,
        validate: VALIDATE_FORM,
    }),
);

export default wrap(ReduxFormView);

interface TextInputProps extends WrappedFieldProps {
    // Hack - these fields are taken from the <Field /> declaration
    label: string;
    type: "input" | "email";
}
function TextInput(props: TextInputProps) {
    const { input, meta } = props;
    const { touched, error, warning } = meta; 
    return (
        <label className="form-field">
            <div>
                {props.label}
            </div>
            <input type={props.type || "text"} {...input} />
            {input.value &&
                <button onClick={() => input.onChange("")}>Clear</button>}
            {touched && error &&
                <ErrorMessage error={error} />}
            {touched && warning &&
                <WarningMessage error={warning} />}
        </label>
    );
}