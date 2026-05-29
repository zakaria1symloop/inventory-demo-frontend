'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * A <select> with a "+" affordance: lets users create the missing
 * entity inline without leaving the parent form.
 *
 * The inline create form renders **in-flow** (pushes content below it
 * downward), not as an absolute-positioned popover, so it never gets
 * clipped by parent overflow:hidden / overflow:auto containers
 * (modals, scroll panels, drawers).
 *
 * Use it for "category, brand, supplier, unit, client category" inside
 * Add Product (and any analogue) — saves a trip to a separate page.
 *
 * Usage:
 *   <SelectWithCreate
 *     label="Category"
 *     value={form.category_id}
 *     onChange={(v) => setForm({ ...form, category_id: v })}
 *     options={categories.map(c => ({ value: String(c.id), label: c.name }))}
 *     placeholder="Pick a category"
 *     required
 *     createTitle="New category"
 *     fields={[{ key: 'name', label: 'Name', required: true }]}
 *     onCreate={async (payload) => {
 *       const res = await categoriesApi.create(payload);
 *       return { value: String(res.data.id), label: res.data.name };
 *     }}
 *     onCreated={() => queryClient.invalidateQueries({ queryKey: ['categories-list'] })}
 *   />
 */

export interface SelectWithCreateField {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'number';
  /** A small hint below the input. Optional. */
  hint?: string;
}

export interface SelectWithCreateOption {
  value: string;
  label: string;
}

export interface SelectWithCreateProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectWithCreateOption[];
  placeholder?: string;
  required?: boolean;
  /** Show "+ New" button. Default true. */
  canCreate?: boolean;
  createTitle?: string;
  /** Fields the inline create form should render. Defaults to a single 'name' field. */
  fields?: SelectWithCreateField[];
  /** Called when user submits the inline form. Return the new option (value+label) — it gets auto-selected. */
  onCreate?: (payload: Record<string, string>) => Promise<SelectWithCreateOption>;
  /** Called after onCreate resolves successfully — typically to invalidate parent query caches. */
  onCreated?: () => void;
  /** Localized "Create" button label. Defaults to "Create". */
  createLabel?: string;
  /** Localized "Cancel" button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Optional right-aligned slot in the trigger row, e.g. badge. */
  extra?: ReactNode;
  /** Mark the field as having an error (red border). */
  error?: string;
}

const DEFAULT_FIELDS: SelectWithCreateField[] = [
  { key: 'name', label: 'Name', required: true },
];

export default function SelectWithCreate({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  canCreate = true,
  createTitle,
  fields = DEFAULT_FIELDS,
  onCreate,
  onCreated,
  createLabel = 'Create',
  cancelLabel = 'Cancel',
  extra,
  error,
}: SelectWithCreateProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, '']))
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Close inline form on Escape. No outside-click handler — the form is
  // in-flow, so clicks elsewhere are normal page interactions.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Autofocus on open + reset draft
  useEffect(() => {
    if (open) {
      setDraft(Object.fromEntries(fields.map((f) => [f.key, ''])));
      setLocalError(null);
      setTimeout(() => firstInputRef.current?.focus(), 30);
    }
  }, [open, fields]);

  const handleSubmit = async () => {
    if (!onCreate) return;
    for (const f of fields) {
      if (f.required && !draft[f.key]?.trim()) {
        setLocalError(`${f.label} is required`);
        return;
      }
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      const created = await onCreate(draft);
      onCreated?.();
      onChange(created.value);
      setOpen(false);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } }; message?: string })
          .response?.data?.message ??
        (e as { message?: string }).message ??
        'Failed to create';
      setLocalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
          {label}{' '}
          {required && <span className="text-red-500">*</span>}
        </label>
        {extra}
      </div>
      <div className="flex items-stretch gap-1.5">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`select flex-1 text-[14px] py-2 ${error ? 'border-red-400 ring-1 ring-red-100' : ''}`}
        >
          <option value="">{placeholder ?? '—'}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {canCreate && onCreate && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            title={createTitle ?? createLabel}
            className={`inline-flex items-center justify-center w-8 px-0 border rounded transition-colors flex-shrink-0 ${
              open
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-expanded={open}
          >
            {open ? <XMarkIcon className="w-4 h-4" strokeWidth={2} /> : <PlusIcon className="w-4 h-4" strokeWidth={2} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}

      {/* Inline create form — in-flow, no absolute positioning */}
      {open && (
        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50/70 dark:bg-gray-900/40 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              {createTitle ?? createLabel}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fields.map((f, i) => (
              <div key={f.key} className={fields.length === 1 ? 'sm:col-span-2' : ''}>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                  {f.label}
                  {f.required && <span className="text-red-500 ms-0.5">*</span>}
                </label>
                <input
                  ref={i === 0 ? firstInputRef : undefined}
                  type={f.type ?? 'text'}
                  value={draft[f.key] ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !submitting) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="input w-full text-[13px] py-1.5"
                />
                {f.hint && (
                  <p className="mt-0.5 text-[10.5px] text-gray-500 dark:text-gray-400">
                    {f.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
          {localError && (
            <p className="mt-2 text-[11px] text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
              {localError}
            </p>
          )}
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary text-[12px] py-1.5 px-3"
            >
              {submitting ? '...' : createLabel}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="btn btn-secondary text-[12px] py-1.5 px-3"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
