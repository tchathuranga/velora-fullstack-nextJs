"use client";

import { Plus, X } from "lucide-react";
import { SpecEntry } from "@/types";
import { Input } from "@/components/ui/Input";

export function CustomSpecsEditor({
  specs,
  onChange,
}: {
  specs: SpecEntry[];
  onChange: (specs: SpecEntry[]) => void;
}) {
  const update = (index: number, field: keyof SpecEntry, value: string) => {
    onChange(specs.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const remove = (index: number) => onChange(specs.filter((_, i) => i !== index));
  const add = () => onChange([...specs, { label: "", value: "" }]);

  return (
    <div>
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        <Plus size={16} /> Add your own specifications
      </button>

      {specs.length > 0 && (
        <div className="mt-3 space-y-2">
          {specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                aria-label="Specification name"
                placeholder="Add specification"
                value={spec.label}
                onChange={(e) => update(i, "label", e.target.value)}
              />
              <Input
                aria-label="Specification description"
                placeholder="description"
                value={spec.value}
                onChange={(e) => update(i, "value", e.target.value)}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove specification"
                className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[var(--color-danger)]"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
