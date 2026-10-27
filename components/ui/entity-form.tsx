"use client";

import { useState } from "react";
import { z } from "zod";
import { LONG_NUMBER_WARNING, looksLikeLongNumber } from "@/lib/guards";
import { Button } from "./button";
import { Field, Input, Select, Textarea } from "./field";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "select" | "textarea" | "checkbox";
  options?: FieldOption[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  half?: boolean;
  // Hide a field based on the current values, such as transfer-only fields.
  when?: (values: FormValues) => boolean;
  inputMode?: "numeric" | "decimal" | "text";
  maxLength?: number;
}

export type FormValues = Record<string, string | boolean>;

function initialValues(fields: FieldDef[], initial: Record<string, unknown>): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const raw = initial[field.name];
    if (field.type === "checkbox") values[field.name] = Boolean(raw);
    else values[field.name] = raw === null || raw === undefined ? "" : String(raw);
  }
  return values;
}

// One zod schema per form, built from the field definitions, so a rule only ever
// has to be stated once. Long digit runs are refused in every free-text field.
function schemaFor(fields: FieldDef[], values: FormValues) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    if (field.when && !field.when(values)) continue;
    if (field.type === "checkbox") {
      shape[field.name] = z.boolean();
      continue;
    }
    if (field.type === "number") {
      let number = z.coerce.number({ message: `${field.label} must be a number.` });
      if (field.min !== undefined) number = number.min(field.min, `${field.label} must be at least ${field.min}.`);
      if (field.max !== undefined) number = number.max(field.max, `${field.label} can be at most ${field.max}.`);
      shape[field.name] = field.required
        ? z.string().min(1, `${field.label} is required.`).pipe(number)
        : z.union([z.literal("").transform(() => null), z.string().pipe(number)]);
      continue;
    }
    let text = z.string().trim();
    if (field.maxLength) text = text.max(field.maxLength, `${field.label} is too long.`);
    const guarded = text.refine((value) => !looksLikeLongNumber(value), { message: LONG_NUMBER_WARNING });
    shape[field.name] = field.required
      ? z.string().trim().min(1, `${field.label} is required.`).pipe(guarded)
      : guarded.transform((value) => (value === "" ? null : value));
  }
  return z.object(shape);
}

export function EntityForm({
  fields,
  initial = {},
  submitLabel = "Save",
  onSubmit,
  secondaryLabel,
  onCancel,
  transform,
}: {
  fields: FieldDef[];
  initial?: Record<string, unknown>;
  submitLabel?: string;
  onSubmit: (values: Record<string, unknown>, mode: "primary" | "secondary") => Promise<unknown>;
  secondaryLabel?: string;
  onCancel?: () => void;
  transform?: (values: Record<string, unknown>) => Record<string, unknown>;
}) {
  const [values, setValues] = useState<FormValues>(() => initialValues(fields, initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function set(name: string, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
  }

  async function submit(mode: "primary" | "secondary") {
    const parsed = schemaFor(fields, values).safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    // Fields hidden by `when` are written as null, so stale values never persist.
    const output: Record<string, unknown> = { ...(parsed.data as Record<string, unknown>) };
    for (const field of fields) {
      if (field.when && !field.when(values)) output[field.name] = null;
    }
    setBusy(true);
    try {
      await onSubmit(transform ? transform(output) : output, mode);
      if (mode === "secondary") {
        setValues((current) => {
          const next = { ...current };
          for (const field of fields) {
            if (["amount", "payee", "notes", "name", "title"].includes(field.name)) next[field.name] = "";
          }
          return next;
        });
      }
    } catch {
      // The mutation has already shown a toast; keep the form so nothing typed is lost.
    }
    setBusy(false);
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit("primary");
      }}
      className="grid grid-cols-2 gap-x-3 gap-y-4"
    >
      {fields.map((field) => {
        if (field.when && !field.when(values)) return null;
        const id = `field-${field.name}`;
        const error = errors[field.name];
        const span = field.half ? "col-span-1" : "col-span-2";
        const common = { id, "aria-invalid": Boolean(error) };

        if (field.type === "checkbox") {
          return (
            <label key={field.name} className={`${span} flex cursor-pointer items-center gap-2.5 text-sm`}>
              <input
                id={id}
                type="checkbox"
                checked={Boolean(values[field.name])}
                onChange={(event) => set(field.name, event.target.checked)}
                className="size-4 cursor-pointer accent-[var(--ink)]"
              />
              {field.label}
            </label>
          );
        }

        const value = values[field.name] as string;
        const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
          set(field.name, event.target.value);

        return (
          <Field key={field.name} label={field.label} hint={field.hint} error={error} htmlFor={id} className={span}>
            {field.type === "select" ? (
              <Select {...common} value={value} onChange={onChange}>
                {!field.required && <option value="">None</option>}
                {field.required && !field.options?.some((o) => o.value === value) && (
                  <option value="">Choose…</option>
                )}
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ) : field.type === "textarea" ? (
              <Textarea {...common} value={value} onChange={onChange} placeholder={field.placeholder} />
            ) : (
              <Input
                {...common}
                type={field.type === "number" ? "text" : (field.type ?? "text")}
                inputMode={field.inputMode ?? (field.type === "number" ? "decimal" : undefined)}
                value={value}
                onChange={onChange}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
              />
            )}
          </Field>
        );
      })}

      <div className="col-span-2 mt-1 flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {secondaryLabel && (
          <Button variant="soft" disabled={busy} onClick={() => void submit("secondary")}>
            {secondaryLabel}
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
