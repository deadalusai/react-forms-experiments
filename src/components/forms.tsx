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
    return <button type="button" onClick={onClick} tabIndex={-1} className="clear-button">Clear</button>;
}

export interface TextInputProps {
    label?: React.ReactNode;
    field: Field<string | null>;
    fieldChange: (value: FieldUpdate<any, string | null>) => void;
}
export function TextInput({ label, field, fieldChange }: TextInputProps) {
    const { touched, visited, focused, error } = field.meta;
    const { name } = field;
    return (
        <div className="form-field">
            <label htmlFor={field.name}>
                {label || field.name} {focused ? "(focused)" : null}
            </label>
            <input
                name={field.name}
                type="text"
                value={field.value === null ? "" : field.value}
                onFocus={() => fieldChange({ name, focused: true })}
                onBlur={() => fieldChange({ name, visited: true, focused: false, })}
                onChange={e => fieldChange({ name, value: e.target.value, touched: true })} />
            {field.value && <ClearButton onClick={() => fieldChange({ name, value: "", touched: true })} />}
            {(touched || visited) && error && <ErrorMessage error={error} />}
        </div>
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
    fieldChange: (value: FieldUpdate<any, SelectOptionValue>) => void;
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
    const { touched, visited, focused, error } = field.meta;
    const { name } = field;
    return (
        <div className="form-field">
            <label htmlFor={field.name}>
                {label || field.name} {focused ? "(focused)" : null}    
            </label>
            <select
                name={field.name}
                value={stringValue(field.value)}
                onFocus={() => fieldChange({ name, focused: true })}
                onBlur={() => fieldChange({ name, visited: true, focused: false })}
                onChange={e => fieldChange({ name, value: mapToTypedValue(e.target.value), touched: true })}>
                {children}
            </select>
            {field.value && <ClearButton onClick={() => fieldChange({ name, value: null, touched: true })} />}
            {(touched || visited) && error && <ErrorMessage error={error} />}
        </div>
    );
}

export interface OptionProps {
    label: React.ReactNode;
    value: SelectOptionValue;
}
export function Option({ label, value }: OptionProps) {
    return <option value={stringValue(value)}>{label}</option>;
}