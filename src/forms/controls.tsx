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

function getOptionValue(options: SelectInputOption[], optionId: string): string {
    const index = parseInt(optionId, 10);
    const option = options[index]
    return option ? option.value : null;
}

function getOptionId(options: SelectInputOption[], optionValue: any): string {
    const index = options.findIndex(o => o.value === optionValue);
    return index.toString();
}

export interface SelectInputOption {
    label: React.ReactNode;
    value: any;
}

export interface SelectInputProps {
    className?: string;
    field: Field;
    fieldChange: (value: FieldUpdate) => void;
    options: SelectInputOption[];
}
export function SelectInput({ className, field, fieldChange, options }: SelectInputProps) {
    return (
        <select
            className={classString("input--select", className)}
            name={field.name}
            value={getOptionId(options, field.value)}
            disabled={field.meta.disabled}
            onFocus={() => fieldChange({ name: field.name, focused: true })}
            onBlur={() => fieldChange({ name: field.name, visited: true, focused: false })}
            onChange={e => fieldChange({ name: field.name, value: getOptionValue(options, e.target.value), touched: true })}>
            {options.map((option, id) => (
                <option key={id} className={className} value={getOptionId(options, option.value)}>{option.label}</option>
            ))}
        </select>
    );
}

//
// Multi-select
//

function getSelectedValues(options: SelectInputOption[], selectedOptions: HTMLCollectionOf<HTMLOptionElement>): any[] {
    const values = [];
    for (let i = 0; i < selectedOptions.length; i++) {
        const item = selectedOptions.item(i);
        if (item) {
            values.push(getOptionValue(options, item.value));
        }
    }
    return values;
}

export interface MultiSelectInputProps {
    className?: string;
    field: Field<any[]>;
    fieldChange: (value: FieldUpdate<any, any[]>) => void;
    options: SelectInputOption[];
}
export function MultiSelectInput({ className, field, fieldChange, options }: MultiSelectInputProps) {
    return (
        <select
            className={classString("input--multi-select", className)}
            name={field.name}
            value={field.value.map(v => getOptionId(options, v))}
            disabled={field.meta.disabled}
            multiple={true}
            onFocus={() => fieldChange({ name: field.name, focused: true })}
            onBlur={() => fieldChange({ name: field.name, visited: true, focused: false })}
            onChange={e => fieldChange({ name: field.name, value: getSelectedValues(options, e.target.selectedOptions), touched: true })}>
            {options.map((option, id) => (
                <option key={id} className={className} value={getOptionId(options, option.value)}>{option.label}</option>
            ))}
        </select>
    );
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