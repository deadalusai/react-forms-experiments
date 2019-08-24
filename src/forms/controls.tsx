import * as React from "react";

import { Field, FieldUpdate, FieldError } from "forms/core";

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
    className = classString(
        "input-container",
        field.meta.focused && "input-container--focused",
        field.meta.touched && "input-container--touched",
        field.meta.visited && "input-container--visited",
        field.meta.valid ? "input-container--valid" : "input-container--invalid",
        field.meta.dirty ? "input-container--dirty" : "input-container--pristine",
        className
    );
    const { visited, error } = field.meta;
    return (
        <div className={className}>
            <label className="input-container--label" htmlFor={field.name}>
                {label || field.name}
            </label>
            {children}
            {visited && error && <ErrorMessage error={error} />}
        </div>
    );
}

//
// Text Input
//

export interface TextInputProps {
    className?: string;
    disabled?: boolean;
    field: Field<string>;
    fieldUpdate: (update: FieldUpdate<string>) => void;
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}
export function TextInput({ className, disabled, field, fieldUpdate, onChange, onFocus, onBlur }: TextInputProps) {
    return (
        <input
            className={classString("input--text", className)}
            name={name}
            type="text"
            disabled={disabled}
            value={field.value}
            onFocus={() => {
                fieldUpdate({ name: field.name, source: "FOCUS" });
                onFocus && onFocus();
            }}
            onBlur={() => {
                fieldUpdate({ name: field.name, source: "BLUR" });
                onBlur && onBlur();
            }}
            onChange={e => {
                fieldUpdate({ name: field.name, source: "CHANGE", value: e.target.value });
                onChange && onChange(e.target.value);
            }} />
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
    disabled?: boolean;
    field: Field;
    fieldUpdate: (update: FieldUpdate) => void;
    onChange?: (value: any) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    options: SelectInputOption[];
}
export function SelectInput({ className, disabled, field, fieldUpdate, onFocus, onBlur, onChange, options }: SelectInputProps) {
    return (
        <select
            className={classString("input--select", className)}
            name={field.name}
            value={getOptionId(options, field.value)}
            disabled={disabled}
            onFocus={() => {
                fieldUpdate({ name: field.name, source: "FOCUS" });
                onFocus && onFocus();
            }}
            onBlur={() => {
                fieldUpdate({ name: field.name, source: "BLUR" });
                onBlur && onBlur();
            }}
            onChange={e => {
                const value = getOptionValue(options, e.target.value);
                fieldUpdate({ name: field.name, source: "CHANGE", value });
                onChange && onChange(value);
            }}>
            {options.map((option, id) => (
                <option key={id} className={className} value={getOptionId(options, option.value)}>
                    {option.label}
                </option>
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
    disabled?: boolean;
    field: Field<any[]>;
    fieldUpdate: (update: FieldUpdate<any[]>) => void;
    onChange?: (value: any[]) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    options: SelectInputOption[];
}
export function MultiSelectInput({ className, disabled, field, fieldUpdate, onFocus, onBlur, onChange, options }: MultiSelectInputProps) {
    return (
        <select
            className={classString("input--multi-select", className)}
            name={field.name}
            value={field.value.map(v => getOptionId(options, v))}
            disabled={disabled}
            multiple={true}
            onFocus={() => {
                fieldUpdate({ name: field.name, source: "FOCUS" });
                onFocus && onFocus();
            }}
            onBlur={() => {
                fieldUpdate({ name: field.name, source: "BLUR" });
                onBlur && onBlur();
            }}
            onChange={e => {
                const value = getSelectedValues(options, e.target.selectedOptions);
                fieldUpdate({ name: field.name, source: "CHANGE", value });
                onChange && onChange(value);
            }}>
            {options.map((option, id) => (
                <option key={id} className={className} value={getOptionId(options, option.value)}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

//
// Radio
//

export interface RadioInputProps {
    className?: string,
    disabled?: boolean;
    label?: React.ReactNode;
    value: any;
    field: Field;
    fieldUpdate: (update: FieldUpdate) => void;
    onChange?: (value: any) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}
export function RadioInput({ className, disabled, label, value, field, fieldUpdate, onFocus, onBlur, onChange }: RadioInputProps) {
    return (
        <label className="radio-item">
            <input
                className={classString("input--radio", className)}
                type="radio"
                name={field.name}
                disabled={disabled}
                checked={value === field.value}
                onFocus={() => {
                    fieldUpdate({ name: field.name, source: "FOCUS" });
                    onFocus && onFocus();
                }}
                onBlur={() => {
                    fieldUpdate({ name: field.name, source: "BLUR" });
                    onBlur && onBlur();
                }}
                onChange={() => {
                    fieldUpdate({ name: field.name, source: "CHANGE", value });
                    onChange && onChange(value);
                }} />
            {label && <span>{label}</span>}
        </label>
    );
}

//
// Checkbox
//

export interface CheckboxInputProps {
    className?: string;
    disabled?: boolean;
    label?: React.ReactNode;
    values?: { checked: any, unchecked: any };
    field: Field;
    fieldUpdate: (update: FieldUpdate) => void;
    onChange?: (value: any) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}
export function CheckboxInput({ className, disabled, label, values, field, fieldUpdate, onFocus, onBlur, onChange }: CheckboxInputProps) {
    // If no "checked/unchecked" values are provided fall back to a true/false flipflop
    const { checked: checkedValue, unchecked: uncheckedValue } = values || { checked: true, unchecked: false };
    const isChecked = field.value === checkedValue;
    return (
        <label className="checkbox-item">
            <input
                className={classString("input--checkbox", className)}
                type="checkbox"
                name={field.name}
                disabled={disabled}
                checked={isChecked}
                onFocus={() => {
                    fieldUpdate({ name: field.name, source: "FOCUS" });
                    onFocus && onFocus();
                }}
                onBlur={() => {
                    fieldUpdate({ name: field.name, source: "BLUR" });
                    onBlur && onBlur();
                }}
                onChange={() => {
                    const value = isChecked ? uncheckedValue : checkedValue;
                    fieldUpdate({ name: field.name, source: "CHANGE", value });
                    onChange && onChange(value);
                }} />
            {label && <span>{label}</span>}
        </label>
    );
}