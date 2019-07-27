import * as React from "react";

import { ErrorType, Field, touchField } from "forms";

export interface ErrorMessageProps {
    error: ErrorType;
}
export function ErrorMessage({ error }: ErrorMessageProps) {
    return <span className="form-field-error">{error.error}</span>
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
                onChange={e => fieldChange(touchField(field, e.target.value))} />
            {field.value &&
                <button onClick={() => fieldChange(touchField(field, null))}>Clear</button>}
            {field.meta.touched && field.meta.error &&
                <ErrorMessage error={field.meta.error} />}
        </label>
    );
}

// We need to smuggle the option value through the string prop on the DOM.
// Complex types can provide an id property.
export type SelectOptionValue = string | number | { id: string } | null;

function stringValue(value: SelectOptionValue): string {
    if (value === null) {
        return "__NULL__";
    }
    if (typeof value === "object") {
        return value.id;
    }
    return value.toString();
}

export interface SelectInputProps {
    label?: React.ReactNode;
    field: Field<SelectOptionValue>;
    fieldChange: (value: Field<SelectOptionValue>) => void;
    children: (React.ReactElement<OptionProps> | React.ReactElement<OptionProps>[])[];
}
export function SelectInput({ label, field, fieldChange, children }: SelectInputProps) {
    function mapToTypedValue(selectedValue: string) {
        for (const child of children) {
            const options = (child instanceof Array) ? child : [child];
            for (const option of options) {
                if (selectedValue === stringValue(option.props.value)) {
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
                value={stringValue(field.value)}
                onChange={e => fieldChange(touchField(field, mapToTypedValue(e.target.value)))}>
                {children}
            </select>
            {field.value &&
                <button onClick={() => fieldChange(touchField(field, null))}>Clear</button>}
            {field.meta.touched && field.meta.error &&
                <ErrorMessage error={field.meta.error} />}
        </label>
    )
}

export interface OptionProps {
    label: React.ReactNode;
    value: SelectOptionValue;
}
export function Option({ label, value }: OptionProps) {
    return <option value={stringValue(value)}>{label}</option>;
}