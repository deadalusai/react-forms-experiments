import * as React from "react";

import { ErrorType, Field } from "store/forms";

export interface ErrorMessageProps {
    error: ErrorType;
}
export function ErrorMessage({ error }: ErrorMessageProps) {
    return <span className="form-field-error">{error.error}</span>
}

function updateField(field: Field, value: any): Field {
    return { ...field, value, meta: { ...field.meta, touched: true } };
}

export interface TextInputProps {
    label?: React.ReactNode;
    field: Field<string | null>;
    fieldChange: (value: Field<string | null>) => void;
}
export function TextInput({ label, field, fieldChange }: TextInputProps) {
    return (
        <label className="form-field">
            <div>
                {label || field.name}
            </div>
            <input
                type="text"
                value={field.value === null ? "" : field.value}
                onChange={e => fieldChange(updateField(field, e.target.value))} />
            {field.meta.touched && field.meta.error && <ErrorMessage error={field.meta.error} />}
        </label>
    );
}

export interface SelectInputProps {
    label?: React.ReactNode;
    field: Field<string | number | null>;
    fieldChange: (value: Field<string | number | null>) => void;
    children: (React.ReactElement<OptionProps> | React.ReactElement<OptionProps>[])[];
}
export function SelectInput({ label, field, fieldChange, children }: SelectInputProps) {
    function mapToTypedValue(selectedValue: string) {
        for (const child of children) {
            const options = (child instanceof Array) ? child : [child];
            for (const option of options) {
                const optionValue = option.props.value === null ? "__NULL__" : option.props.value.toString();
                if (optionValue === selectedValue) {
                    return option.props.value;
                }
            }
        }
        return null;
    }
    return (
        <label className="form-field">
            <div>
                {label || field.name}
            </div>
            <select
                value={field.value === null ? "__NULL__" : field.value.toString()}
                onChange={e => fieldChange(updateField(field, mapToTypedValue(e.target.value)))}>
                {children}
            </select>
            {field.meta.touched && field.meta.error && <ErrorMessage error={field.meta.error} />}
        </label>
    )
}

export interface OptionProps {
    label: React.ReactNode;
    value: string | number | null;
}
export function Option({ label, value }: OptionProps) {
    return <option value={value === null ? "__NULL__" : value.toString()}>{label}</option>;
}