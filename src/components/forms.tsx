import * as React from "react";

import { FieldError, Field, FieldUpdate } from "forms";

export interface ErrorMessageProps {
    error: FieldError;
}
export function ErrorMessage({ error }: ErrorMessageProps) {
    return <span className="form-field-error">{error.error}</span>
}

export interface WarningMessageProps {
    error: FieldError;
}
export function WarningMessage({ error }: ErrorMessageProps) {
    return <span className="form-field-warning">{error.error}</span>
}

export interface ClearButtonProps {
    onClick: () => void;
}
export function ClearButton({ onClick }: ClearButtonProps) {
    return <button onClick={onClick} tabIndex={-1} className="clear-button">Clear</button>;
}

export interface TextInputProps {
    label?: React.ReactNode;
    field: Field<string | null>;
    onFieldChange: (value: FieldUpdate<any, string | null>) => void;
}
export function TextInput({ label, field, onFieldChange }: TextInputProps) {
    const { touched, visited, focused, error } = field.meta;
    const { name } = field;
    return (
        <label className="form-field">
            <div>
                {label || field.name} {focused ? "(focused)" : null}
            </div>
            <input
                type="text"
                value={field.value === null ? "" : field.value}
                onFocus={() => onFieldChange({ name, focused: true })}
                onBlur={() => onFieldChange({ name, visited: true, focused: false, })}
                onChange={e => onFieldChange({ name, value: e.target.value, touched: true })} />
            {field.value && <ClearButton onClick={() => onFieldChange({ name, value: "", touched: true })} />}
            {(touched || visited) && error && <ErrorMessage error={error} />}
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
    onFieldChange: (value: FieldUpdate<any, SelectOptionValue>) => void;
    children: (React.ReactElement<OptionProps> | React.ReactElement<OptionProps>[])[];
}
export function SelectInput({ label, field, onFieldChange, children }: SelectInputProps) {
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
    const { touched, visited, focused, error } = field.meta;
    const { name } = field;
    return (
        <label className="form-field">
            <div>
                {label || field.name} {focused ? "(focused)" : null}
            </div>
            <select
                value={stringValue(field.value)}
                onFocus={() => onFieldChange({ name, focused: true })}
                onBlur={() => onFieldChange({ name, visited: true, focused: false })}
                onChange={e => onFieldChange({ name, value: mapToTypedValue(e.target.value), touched: true })}>
                {children}
            </select>
            {field.value && <ClearButton onClick={() => onFieldChange({ name, value: null, touched: true })} />}
            {(touched || visited) && error && <ErrorMessage error={error} />}
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