import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import * as FormStore from "store/forms";

export interface StateProps {
    form: FormStore.FormData;
}
export interface ActionProps {
    initForm: typeof FormStore.actions.initForm;
    setFormValue: typeof FormStore.actions.setFormValue;
}
export interface OwnProps {}

export type FormViewProps = StateProps & ActionProps & OwnProps;

export class FormView extends React.Component<FormViewProps> {

    public componentWillMount() {
        this.props.initForm("my-form", {
            field1: "hello",
            field2: "world",
        });
    }

    public render() {
        if (!this.props.form) {
            return null
        }
        const data = {
            field1: this.props.form.fields["field1"].value,
            field2: this.props.form.fields["field2"].value,
        };
        return <section>
            <div>
                <TextInput
                    label="Field one"
                    field={this.props.form.fields["field1"]}
                    onChange={value => this.props.setFormValue("my-form", "field1", value)} />
            </div>
            <div>
                <TextInput
                    label="Field two"
                    field={this.props.form.fields["field2"]}
                    onChange={value => this.props.setFormValue("my-form", "field2", value)} />
            </div>
            <pre>
                {JSON.stringify(data, null, 4)}
            </pre>
        </section>;
    }
}

const wrap = compose(
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (state) => ({
            form: state.forms.forms["my-form"],
        }),
        { 
            initForm: FormStore.actions.initForm,
            setFormValue: FormStore.actions.setFormValue,
        }
    )
);

export default wrap(FormView);

interface TextInputProps {
    label?: React.ReactNode;
    field: FormStore.FieldData;
    onChange: (value: any) => void;
}
function TextInput({ label, field, onChange }: TextInputProps) {
    return <label>
        {label || field.name}
        <input type="text" value={field.value} onChange={e => onChange(e.target.value)} />
    </label>;
}