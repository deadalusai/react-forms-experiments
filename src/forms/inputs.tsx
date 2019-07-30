import * as React from "react";

import { FieldError, Field, FieldUpdate } from "forms/core";

//
// Utility components and functions
//

export interface ErrorMessageProps {
    error: FieldError;
}
export function ErrorMessage({ error }: ErrorMessageProps) {
    return <span className="error">{error.error}</span>
}

// This type can be used when we need to round-trip a value through a DOM prop.
// Complex types can provide an id property.
export type RoundTripValue = { id: string } | string | number | null | undefined;

function stringValue(value: RoundTripValue): string {
    if (value === null) {
        return "__NULL__";
    }
    if (value === undefined) {
        return "__UNDEFINED__";
    }
    if (typeof value === "object") {
        return value.id;
    }
    return value.toString();
}

const classString: (...parts: (string | null | undefined | false)[]) => string =
    function () {
        let str = "";
        for (let i = 0; i < arguments.length; i++) {
            if (arguments[i]) {
                str += arguments[i] + " ";
            }
        }
        return str;
    };

//
// Input container
//

export interface InputContainerProps {
    className?: string;
    label: React.ReactNode;
    field: Field;
    children: any;
}
export function InputContainer({ className, label, field, children }: InputContainerProps) {
    const { touched, visited, error } = field.meta;
    className = classString(
        "input-container",
        field.meta.disabled && "input-container--disabled",
        field.meta.focused && "input-container--focused",
        field.meta.touched && "input-container--touched",
        field.meta.dirty ? "input-container--dirty" : "input-container--pristine",
        className
    );
    return (
        <div className={className}>
            <label className="input-container--label" htmlFor={field.name}>
                {label || field.name}
            </label>
            {children}
            {(touched || visited) && error && <ErrorMessage error={error} />}
        </div>
    );
}

//
// Text Input
//

export interface TextInputProps {
    className?: string;
    field: Field<string | null>;
    fieldChange: (value: FieldUpdate<any, string | null>) => void;
}
export function TextInput({ className, field, fieldChange }: TextInputProps) {
    return (
        <input
            className={classString("input--text", className)}
            name={name}
            type="text"
            disabled={field.meta.disabled}
            value={field.value === null ? "" : field.value}
            onFocus={() => fieldChange({ name: field.name, focused: true })}
            onBlur={() => fieldChange({ name: field.name, visited: true, focused: false, })}
            onChange={e => fieldChange({ name: field.name, value: e.target.value, touched: true })} />
    );
}

//
// Select
//

export interface SelectInputProps {
    className?: string;
    field: Field<RoundTripValue>;
    fieldChange: (value: FieldUpdate<any, RoundTripValue>) => void;
    children: (React.ReactElement<SelectOptionProps> | React.ReactElement<SelectOptionProps>[])[];
}
export function SelectInput({ className, field, fieldChange, children }: SelectInputProps) {
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
        <select
            className={classString("input--select", className)}
            name={field.name}
            value={stringValue(field.value)}
            disabled={field.meta.disabled}
            onFocus={() => fieldChange({ name: field.name, focused: true })}
            onBlur={() => fieldChange({ name: field.name, visited: true, focused: false })}
            onChange={e => fieldChange({ name: field.name, value: mapToTypedValue(e.target.value), touched: true })}>
            {children}
        </select>
    );
}

export interface SelectOptionProps {
    className?: string;
    label: React.ReactNode;
    value: RoundTripValue;
}
export function SelectOption({ className, label, value }: SelectOptionProps) {
    return <option className={className} value={stringValue(value)}>{label}</option>;
}

//
// Radio
//

export interface RadioInputProps {
    className?: string,
    label?: React.ReactNode;
    value: any;
    field: Field<any>;
    fieldChange: (value: FieldUpdate<any, any>) => void;
}
export function RadioInput({ className, label, value, field, fieldChange }: RadioInputProps) {
    return (
        <label className="radio-item">
            <input
                className={classString("input--radio", className)}
                type="radio"
                name={field.name}
                disabled={field.meta.disabled}
                checked={value === field.value}
                onFocus={() => fieldChange({ name: field.name, focused: true })}
                onBlur={() => fieldChange({ name: field.name, visited: true, focused: false })}
                onChange={() => fieldChange({ name: field.name, value, touched: true })} />
            {label && <span>{label}</span>}
        </label>
    );
}

//
// Checkbox
//

export interface CheckboxInputProps {
    className?: string;
    label?: React.ReactNode;
    values?: { checked: any, unchecked: any };
    field: Field;
    fieldChange: (value: FieldUpdate) => void;
}
export function CheckboxInput({ className, label, values, field, fieldChange }: CheckboxInputProps) {
    // If no "checked/unchecked" values are provided fall back to a true/false flipflop
    if (!values) {
        values = { checked: true, unchecked: false };
    }
    const checked = field.value === values.checked;
    return (
        <label className="checkbox-item">
            <input
                className={classString("input--checkbox", className)}
                type="checkbox"
                name={field.name}
                disabled={field.meta.disabled}
                checked={checked}
                onFocus={() => fieldChange({ name: field.name, focused: true })}
                onBlur={() => fieldChange({ name: field.name, visited: true, focused: false })}
                onChange={() => fieldChange({ name: field.name, value: checked ? values!.unchecked : values!.checked, touched: true })} />
            {label && <span>{label}</span>}
        </label>
    );
}