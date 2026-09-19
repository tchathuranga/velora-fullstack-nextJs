"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { VariationAttribute, VariationCombination } from "@/types";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { generateId } from "@/lib/utils";

function cartesian(attributes: VariationAttribute[]): Record<string, string>[] {
  return attributes.reduce<Record<string, string>[]>(
    (acc, attr) =>
      acc.flatMap((combo) => attr.options.map((option) => ({ ...combo, [attr.name]: option }))),
    [{}],
  );
}

export function VariationImageBuilder({
  attributes,
  basePrice,
  onCancel,
  onSave,
}: {
  attributes: VariationAttribute[];
  basePrice: number;
  onCancel: () => void;
  onSave: (images: Record<string, string>, combinations: VariationCombination[]) => void;
}) {
  const [selectedAttrIndex, setSelectedAttrIndex] = useState(0);
  const [images, setImages] = useState<Record<string, string>>({});

  const combos = useMemo(() => cartesian(attributes), [attributes]);
  const [combinations, setCombinations] = useState<VariationCombination[]>(() =>
    combos.map((values) => ({ id: generateId("var"), values, quantity: 0, price: basePrice })),
  );

  const updateCombination = (id: string, field: "quantity" | "price", value: number) => {
    setCombinations((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const activeAttribute = attributes[selectedAttrIndex];
  const variationColumns = attributes.map((a) => a.name);

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-slate-900">Variation images</h2>

      {attributes.length > 1 && (
        <div className="mt-4 max-w-xs">
          <Select
            label="Use attributes"
            value={selectedAttrIndex}
            onChange={(e) => setSelectedAttrIndex(Number(e.target.value))}
          >
            {attributes.map((attr, i) => (
              <option key={attr.name} value={i}>
                {attr.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        {activeAttribute?.options.map((option) => (
          <div key={option}>
            <p className="mb-1.5 text-sm font-medium text-slate-700">{option}</p>
            <ImageDropzone
              label="Add a image"
              onFileSelect={(file) =>
                setImages((prev) => ({ ...prev, [option]: file ? URL.createObjectURL(file) : "" }))
              }
              className={clsx(images[option] && "border-solid border-[var(--color-primary)]")}
            />
          </div>
        ))}
      </div>

      <h3 className="mt-8 mb-3 text-base font-semibold text-slate-900">Variation combination</h3>
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <tr>
              {variationColumns.map((col, i) => (
                <th key={col} className="px-4 py-2">
                  Variation {i + 1} <span className="normal-case text-[var(--color-muted)]">({col})</span>
                </th>
              ))}
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {combinations.map((combo) => (
              <tr key={combo.id}>
                {attributes.map((attr) => (
                  <td key={attr.name} className="px-4 py-2 text-slate-700">
                    {combo.values[attr.name]}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    min={0}
                    value={combo.quantity}
                    onChange={(e) => updateCombination(combo.id, "quantity", Number(e.target.value))}
                    className="w-24"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    min={0}
                    value={combo.price}
                    onChange={(e) => updateCombination(combo.id, "price", Number(e.target.value))}
                    className="w-28"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Back
        </Button>
        <Button type="button" onClick={() => onSave(images, combinations)}>
          Save and Continue
        </Button>
      </div>
    </div>
  );
}
