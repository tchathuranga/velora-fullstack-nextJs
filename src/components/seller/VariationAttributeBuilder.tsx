"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { VariationAttribute } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function VariationAttributeBuilder({
  initial,
  onCancel,
  onContinue,
}: {
  initial: VariationAttribute[];
  onCancel: () => void;
  onContinue: (attributes: VariationAttribute[]) => void;
}) {
  const [groups, setGroups] = useState<VariationAttribute[]>(
    initial.length > 0 ? initial : [{ name: "", options: [] }],
  );
  const [optionDrafts, setOptionDrafts] = useState<string[]>(groups.map(() => ""));

  const updateGroupName = (index: number, name: string) => {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, name } : g)));
  };

  const addOption = (index: number) => {
    const value = optionDrafts[index]?.trim();
    if (!value) return;
    setGroups((prev) =>
      prev.map((g, i) => (i === index && !g.options.includes(value) ? { ...g, options: [...g.options, value] } : g)),
    );
    setOptionDrafts((prev) => prev.map((d, i) => (i === index ? "" : d)));
  };

  const removeOption = (groupIndex: number, option: string) => {
    setGroups((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, options: g.options.filter((o) => o !== option) } : g)),
    );
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, { name: "", options: [] }]);
    setOptionDrafts((prev) => [...prev, ""]);
  };

  const removeGroup = (index: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== index));
    setOptionDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const canContinue = groups.some((g) => g.name.trim() && g.options.length > 0);

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-slate-900">Create your variations</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Select an attribute and then select the options of the products you sell.
      </p>

      <div className="mt-6 space-y-6">
        {groups.map((group, index) => (
          <div key={index} className="rounded-xl border border-[var(--color-border)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-3">
                <Input
                  label="Add attributes"
                  placeholder="Ex: Color"
                  value={group.name}
                  onChange={(e) => updateGroupName(index, e.target.value)}
                />
                <div className="flex items-end gap-2">
                  <Input
                    label="Option"
                    placeholder="Ex: Black"
                    value={optionDrafts[index] ?? ""}
                    onChange={(e) =>
                      setOptionDrafts((prev) => prev.map((d, i) => (i === index ? e.target.value : d)))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption(index);
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => addOption(index)}>
                    Add
                  </Button>
                </div>
                {group.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => (
                      <span
                        key={option}
                        className="flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]"
                      >
                        {option}
                        <button type="button" onClick={() => removeOption(index, option)} aria-label={`Remove ${option}`}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {group.name && group.options.length > 0 && (
                  <p className="text-sm text-slate-600">
                    <strong>Attribute:</strong> {group.name} &nbsp; <strong>Options:</strong> {group.options.join(", ")}
                  </p>
                )}
              </div>
              {groups.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGroup(index)}
                  aria-label="Remove attribute"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[var(--color-danger)]"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addGroup}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          <Plus size={16} /> Add another attribute
        </button>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canContinue}
          onClick={() => onContinue(groups.filter((g) => g.name.trim() && g.options.length > 0))}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
