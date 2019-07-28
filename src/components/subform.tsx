import * as React from "react";
import { compose } from "redux";

import { FormComponentProps, withStateBackedForm, FieldUpdate } from "forms";
import * as Validators from "forms/validators";
import { TextInput } from "./forms";

export interface SubForm { 
    sub1: string;
    sub2: string;
}

const formValidator = Validators.createFormValidator<SubForm>({
    sub1: Validators.required(),
    sub2: Validators.required(),
});

export interface SubFormProps {
    value: SubForm;
    valueChange: (value: SubForm) => void;
}

//
// TODO: Abstract this into a "subform" higher-order component
//

export class SubFormView extends React.Component<SubFormProps & FormComponentProps<SubForm>> {
    
    componentDidMount() {
        this.props.formInit(this.props.value);
    }

    componentDidUpdate(prevProps: Readonly<SubFormProps>) {
        if (prevProps.value !== this.props.value) {
            this.props.formInit(this.props.value);
        }
    }

    public render() {
        const { form } = this.props;
        if (!form) {
            return null;
        }
        const onFieldChange = (update: FieldUpdate) => {
            const form = this.props.formUpdateField(update);
            if ("value" in update) {
                this.props.valueChange(form.current);
            }
        };
        return <section>
            <div>
                <TextInput
                    label="Sub one"
                    field={form.fields.sub1}
                    fieldChange={onFieldChange} />
            </div>
            <div>
                <TextInput
                    label="Sub two"
                    field={form.fields.sub2}
                    fieldChange={onFieldChange} />
            </div>
        </section>
    }
}

const wrap = compose<React.ComponentClass<SubFormProps>>(
    withStateBackedForm<SubForm>({
        name: "subform",
        validator: formValidator
    })
);

export default wrap(SubFormView);