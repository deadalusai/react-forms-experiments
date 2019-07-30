import * as React from "react";

import { FieldError, Field, FieldUpdate, FieldMeta } from "forms";

//
// Utility components and functions
//

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

function fieldClassName(meta: FieldMeta) {
    return "form-field" +
        (meta.disabled ? " form-field--disabled" : "") +
        (meta.focused ? " form-field--focused" : "") +
        (meta.touched ? " form-field--touched" : "") +
        (meta.dirty ? " form-field--dirty" : " form-field--pristine");
}

// This type can be used when we need to round-trip a value through a DOM prop.
// Complex types can provide an id property.
export type RoundTripValue = string | number | { id: string } | null;

function stringValue(value: RoundTripValue): string {
    if (value === null) {
        return "__NULL__";
    }
    if (typeof value === "object") {
        return value.id;
    }
    return value.toString();
}

//
// Text Input
//

export interface TextInputProps {
    label?: React.ReactNode;
    field: Field<string | null>;
    fieldChange: (value: FieldUpdate<any, string | null>) => void;
}
export function TextInput({ label, field, fieldChange }: TextInputProps) {
    const { touched, visited, error, disabled } = field.meta;
    const { name } = field;
    return (
        <div className={fieldClassName(field.meta)}>
            <label className="form-field--label" htmlFor={field.name}>
                {label || field.name}
            </label>
            <input
                name={field.name}
                type="text"
                disabled={disabled}
                value={field.value === null ? "" : field.value}
                onFocus={() => fieldChange({ name, focused: true })}
                onBlur={() => fieldChange({ name, visited: true, focused: false, })}
                onChange={e => fieldChange({ name, value: e.target.value, touched: true })} />
            {(touched || visited) && error && <ErrorMessage error={error} />}
        </div>
    );
}

//
// Select
//

export interface SelectInputProps {
    label?: React.ReactNode;
    field: Field<RoundTripValue>;
    fieldChange: (value: FieldUpdate<any, RoundTripValue>) => void;
    children: (React.ReactElement<SelectOptionProps> | React.ReactElement<SelectOptionProps>[])[];
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
    const { touched, visited, error, disabled } = field.meta;
    const { name } = field;
    return (
        <div className={fieldClassName(field.meta)}>
            <label className="form-field--label" htmlFor={field.name}>
                {label || field.name}
            </label>
            <select
                name={field.name}
                value={stringValue(field.value)}
                disabled={disabled}
                onFocus={() => fieldChange({ name, focused: true })}
                onBlur={() => fieldChange({ name, visited: true, focused: false })}
                onChange={e => fieldChange({ name, value: mapToTypedValue(e.target.value), touched: true })}>
                {children}
            </select>
            {(touched || visited) && error && <ErrorMessage error={error} />}
        </div>
    );
}

export interface SelectOptionProps {
    label: React.ReactNode;
    value: RoundTripValue;
}
export function SelectOption({ label, value }: SelectOptionProps) {
    return <option value={stringValue(value)}>{label}</option>;
}

//
// Radio
//

export interface RadioInputGroupProps {
    label?: React.ReactNode;
    field: Field<RoundTripValue>;
    children: React.ReactElement<SelectOptionProps>[];
}
export function RadioInputGroup({ label, field, children }: RadioInputGroupProps) {
    const { touched, visited, error } = field.meta;
    return (
        <div className={fieldClassName(field.meta)}>
            <label className="form-field--label" htmlFor={field.name}>
                {label || field.name}
            </label>
            <div className="radio-group">
                {children}
            </div>
            {(touched || visited) && error && <ErrorMessage error={error} />}
        </div>
    );
}

export interface RadioInputProps {
    label?: React.ReactNode;
    value: any;
    field: Field<any>;
    fieldChange: (value: FieldUpdate<any, any>) => void;
}
export function RadioInput({ label, value, field, fieldChange }: RadioInputProps) {
    return (
        <label className="radio-item">
            <input
                type="radio"
                name={field.name}
                disabled={field.meta.disabled}
                checked={value === field.value}
                onFocus={() => fieldChange({ name: field.name, focused: true })}
                onBlur={() => fieldChange({ name: field.name, visited: true, focused: false })}
                onChange={() => fieldChange({ name: field.name, value, touched: true })} />
            <span>
                {label || field.name}
            </span>
        </label>
    );
}

//
// Checkbox
//