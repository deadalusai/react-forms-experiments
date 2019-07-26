import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import * as FormStore from "store/forms";
import { Form, Field, FormValidators } from "store/forms";

const FORM_NAME = "my-form";
interface MyForm {
    field1: string;
    field2: string;
    field3: number;
}

const formValidators: FormValidators<MyForm> = {
    field1: value => (/hello/i.test(value)) ? { errorId: "ERROR.NOT_ALLOWED", errorParams: { value } } : null,
    field3: value => (value == 2) ? { errorId: "ERROR.NOT_ALLOWED", errorParams: { value } } : null,
};

export interface StateProps {
    form: Form<MyForm> | undefined;
}
export interface ActionProps {
    initForm: typeof FormStore.actions.initForm;
    updateForm: typeof FormStore.actions.updateForm;
}
export interface OwnProps {}

export type FormViewProps = StateProps & ActionProps & OwnProps;

export class FormView extends React.Component<FormViewProps> {

    public componentWillMount() {
        const data: MyForm = {
            field1: "hello",
            field2: "world",
            field3: 2,
        };
        this.props.initForm(FORM_NAME, data, formValidators);
    }

    public render() {
        const { form } = this.props;
        if (!form) {
            return null
        }
        const update = (field: Field<any>) => this.props.updateForm(form, field, formValidators);
        const data = {
            field1: form.fields.field1.value,
            field2: form.fields.field2.value,
            field3: form.fields.field3.value,
        };
        const meta = {
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
                    <TextInput label="Field one" field={form.fields.field1} onChange={update} />
                </div>
                <div>
                    <TextInput label="Field two" field={form.fields.field2} onChange={update} />
                </div>
                <div>
                    <DropDownInput label="Field three" field={form.fields.field3} onChange={update}>
                        <Option label="NO SELECTION" />
                        {options.map(o => <Option key={o.value} label={o.label} value={o.value} />)}
                    </DropDownInput>
                </div>
                <pre>
                    data: {JSON.stringify(data, null, 4)}
                </pre>
                <pre>
                    meta: {JSON.stringify(meta, null, 4)}
                </pre>
            </section>
        );
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
        }
    )
);

export default wrap(FormView);

interface TextInputProps {
    label?: React.ReactNode;
    field: Field<string>;
    onChange: (value: Field<string>) => void;
}
function TextInput({ label, field, onChange }: TextInputProps) {
    return (
        <label className="form-field">
            <div>
                {label || field.name}
            </div>
            <input type="text" value={field.value} onChange={e => onChange({ ...field, value: e.target.value })} />
            {field.meta.errorId && <span className="form-field-error">{field.meta.errorId}</span>}
        </label>
    );
}

interface DropDownInputProps {
    label?: React.ReactNode;
    field: Field<string | number | undefined>;
    onChange: (value: Field<string | number | undefined>) => void;
    children: (React.ReactElement<OptionProps> | React.ReactElement<OptionProps>[])[];
}
function DropDownInput({ label, field, onChange, children }: DropDownInputProps) {
    function toValue(stringValue: string) {
        for (const child of children) {
            const options = (child instanceof Array) ? child : [child];
            for (const option of options) {
                if (option.props.value !== undefined &&
                    option.props.value.toString() === stringValue) {
                    return option.props.value;
                }
            }
        }
        return undefined;
    }
    return (
        <label className="form-field">
            <div>
                {label || field.name}
            </div>
            <select value={field.value} onChange={e => onChange({ ...field, value: toValue(e.target.value) })}>
                {children}
            </select>
            {field.meta.errorId && <span className="form-field-error">{field.meta.errorId}</span>}
        </label>
    )
}

interface OptionProps {
    label?: React.ReactNode;
    value?: string | number | undefined;
}
function Option({ label, value }: OptionProps) {
    return <option value={value}>{label || value}</option>;
}