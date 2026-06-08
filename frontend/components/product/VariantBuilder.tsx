"use client";

import { useState, useCallback } from "react";
import { Plus, X, RefreshCw, Trash2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AttributeType {
  name: string;   // e.g. "Color"
  values: string[]; // e.g. ["Red", "Blue", "Black"]
}

export interface VariantRow {
  id: string;            // temp client-side ID
  attributes: { name: string; value: string }[];
  sku: string;
  priceInr: string;
  compareAtPriceInr: string;
  stock: string;
  status: "ACTIVE" | "INACTIVE";
}

interface Props {
  basePriceInr?: string;
  onChange: (variants: VariantRow[]) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateCombinations = (attributes: AttributeType[]): { name: string; value: string }[][] => {
  if (attributes.length === 0) return [];
  const filtered = attributes.filter((a) => a.name && a.values.length > 0);
  if (filtered.length === 0) return [];

  return filtered.reduce<{ name: string; value: string }[][]>(
    (combos, attr) =>
      combos.flatMap((combo) =>
        attr.values.map((val) => [...combo, { name: attr.name, value: val }])
      ),
    [[]]
  );
};

const makeSkuSlug = (attrs: { name: string; value: string }[]) =>
  attrs.map((a) => a.value.toUpperCase().replace(/\s+/g, "-").slice(0, 6)).join("-");

let _id = 0;
const uid = () => `v-${++_id}`;

// ── Component ─────────────────────────────────────────────────────────────────

export function VariantBuilder({ basePriceInr = "", onChange }: Props) {
  const [attributes, setAttributes] = useState<AttributeType[]>([
    { name: "Color", values: [] },
  ]);
  const [newValues, setNewValues] = useState<Record<number, string>>({});
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [generated, setGenerated] = useState(false);

  // ── Attribute management ──────────────────────────────────────────────────

  const addAttributeType = () => {
    setAttributes((prev) => [...prev, { name: "", values: [] }]);
    setGenerated(false);
  };

  const removeAttributeType = (i: number) => {
    setAttributes((prev) => prev.filter((_, idx) => idx !== i));
    setGenerated(false);
  };

  const updateAttributeName = (i: number, name: string) => {
    setAttributes((prev) => prev.map((a, idx) => (idx === i ? { ...a, name } : a)));
    setGenerated(false);
  };

  const addValue = (i: number) => {
    const val = (newValues[i] ?? "").trim();
    if (!val) return;
    setAttributes((prev) =>
      prev.map((a, idx) =>
        idx === i && !a.values.includes(val) ? { ...a, values: [...a.values, val] } : a
      )
    );
    setNewValues((prev) => ({ ...prev, [i]: "" }));
    setGenerated(false);
  };

  const removeValue = (attrIdx: number, val: string) => {
    setAttributes((prev) =>
      prev.map((a, idx) =>
        idx === attrIdx ? { ...a, values: a.values.filter((v) => v !== val) } : a
      )
    );
    setGenerated(false);
  };

  // ── Combination generation ────────────────────────────────────────────────

  const generate = () => {
    const combos = generateCombinations(attributes);
    const rows: VariantRow[] = combos.map((combo) => ({
      id: uid(),
      attributes: combo,
      sku: makeSkuSlug(combo),
      priceInr: basePriceInr,
      compareAtPriceInr: "",
      stock: "0",
      status: "ACTIVE",
    }));
    setVariants(rows);
    setGenerated(true);
    onChange(rows);
  };

  // ── Variant table edits ───────────────────────────────────────────────────

  const updateVariant = useCallback((id: string, field: keyof VariantRow, value: string) => {
    setVariants((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, [field]: value } : v));
      onChange(next);
      return next;
    });
  }, [onChange]);

  const removeVariant = (id: string) => {
    setVariants((prev) => {
      const next = prev.filter((v) => v.id !== id);
      onChange(next);
      return next;
    });
  };

  const canGenerate = attributes.some((a) => a.name && a.values.length > 0);
  const totalCombinations = generated ? variants.length
    : generateCombinations(attributes).length;

  return (
    <div className="space-y-6">

      {/* ── Attribute types ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1A1A1A]">Variant attributes</p>
          <button
            type="button"
            onClick={addAttributeType}
            disabled={attributes.length >= 3}
            className="flex items-center gap-1.5 text-xs font-medium text-[#C8956C] hover:text-[#B07D57] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add attribute (max 3)
          </button>
        </div>

        {attributes.map((attr, i) => (
          <div key={i} className="p-4 rounded-xl border border-[#E8E0D8] bg-[#FAFAF8] space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={attr.name}
                onChange={(e) => updateAttributeName(i, e.target.value)}
                placeholder="Attribute name (e.g. Color, Size)"
                className="flex-1 h-9 px-3 rounded-lg border border-[#E8E0D8] text-sm bg-white focus:outline-none focus:border-[#C8956C]"
              />
              {attributes.length > 1 && (
                <button type="button" onClick={() => removeAttributeType(i)}
                  className="h-9 w-9 flex items-center justify-center text-[#6B6056] hover:text-[#C0392B] border border-[#E8E0D8] rounded-lg hover:border-[#C0392B] transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Existing values */}
            <div className="flex flex-wrap gap-2">
              {attr.values.map((val) => (
                <span key={val}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E8E0D8] text-sm font-medium text-[#1A1A1A]">
                  {val}
                  <button type="button" onClick={() => removeValue(i, val)}
                    className="text-[#6B6056] hover:text-[#C0392B]">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add value input */}
            <div className="flex gap-2">
              <input
                value={newValues[i] ?? ""}
                onChange={(e) => setNewValues((p) => ({ ...p, [i]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue(i); } }}
                placeholder={`Add ${attr.name || "value"} (press Enter)`}
                className="flex-1 h-9 px-3 rounded-lg border border-[#E8E0D8] text-sm bg-white focus:outline-none focus:border-[#C8956C]"
              />
              <button type="button" onClick={() => addValue(i)}
                className="h-9 px-3 rounded-lg border border-[#E8E0D8] text-sm text-[#6B6056] hover:bg-[#F5EDE6] hover:border-[#C8956C] transition-colors">
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Generate button ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate}
          className="flex items-center gap-2 h-10 px-5 rounded-lg bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className="h-4 w-4" />
          {generated ? "Regenerate combinations" : "Generate combinations"}
        </button>
        {canGenerate && (
          <span className="text-sm text-[#6B6056]">
            {totalCombinations} combination{totalCombinations !== 1 ? "s" : ""} will be created
          </span>
        )}
      </div>

      {/* ── Variant matrix table ─────────────────────────────────────── */}
      {variants.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#E8E0D8]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E8E0D8]">
                {/* Dynamic attribute columns */}
                {attributes.filter(a => a.name && a.values.length > 0).map((a) => (
                  <th key={a.name} className="px-3 py-2.5 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                    {a.name}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">SKU *</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Price ₹ *</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Was ₹</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Stock *</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E0D8]">
              {variants.map((row) => (
                <tr key={row.id} className={`${row.status === "INACTIVE" ? "opacity-50" : ""} hover:bg-[#FAFAF8] transition-colors`}>
                  {/* Attribute value cells */}
                  {row.attributes.map((attr) => (
                    <td key={attr.name} className="px-3 py-2">
                      <span className="font-medium text-[#1A1A1A]">{attr.value}</span>
                    </td>
                  ))}

                  {/* SKU */}
                  <td className="px-3 py-2">
                    <input value={row.sku}
                      onChange={(e) => updateVariant(row.id, "sku", e.target.value)}
                      className="w-32 h-8 px-2 rounded-lg border border-[#E8E0D8] text-xs font-mono focus:outline-none focus:border-[#C8956C] bg-white" />
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2">
                    <input type="number" value={row.priceInr} min={0}
                      onChange={(e) => updateVariant(row.id, "priceInr", e.target.value)}
                      className="w-24 h-8 px-2 rounded-lg border border-[#E8E0D8] text-xs focus:outline-none focus:border-[#C8956C] bg-white" />
                  </td>

                  {/* Compare at price */}
                  <td className="px-3 py-2">
                    <input type="number" value={row.compareAtPriceInr} min={0} placeholder="–"
                      onChange={(e) => updateVariant(row.id, "compareAtPriceInr", e.target.value)}
                      className="w-24 h-8 px-2 rounded-lg border border-[#E8E0D8] text-xs focus:outline-none focus:border-[#C8956C] bg-white" />
                  </td>

                  {/* Stock */}
                  <td className="px-3 py-2">
                    <input type="number" value={row.stock} min={0}
                      onChange={(e) => updateVariant(row.id, "stock", e.target.value)}
                      className="w-20 h-8 px-2 rounded-lg border border-[#E8E0D8] text-xs focus:outline-none focus:border-[#C8956C] bg-white" />
                  </td>

                  {/* Status toggle */}
                  <td className="px-3 py-2">
                    <button type="button"
                      onClick={() => updateVariant(row.id, "status", row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        row.status === "ACTIVE"
                          ? "bg-[#E8F5EE] text-[#2D6A4F] hover:bg-[#D0EDD8]"
                          : "bg-[#F5EDE6] text-[#6B6056] hover:bg-[#EAD9CC]"
                      }`}>
                      {row.status}
                    </button>
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => removeVariant(row.id)}
                      className="h-7 w-7 flex items-center justify-center text-[#6B6056] hover:text-[#C0392B] transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 bg-[#FAFAF8] border-t border-[#E8E0D8] flex items-center justify-between">
            <p className="text-xs text-[#6B6056]">
              {variants.filter(v => v.status === "ACTIVE").length} active variant{variants.filter(v => v.status === "ACTIVE").length !== 1 ? "s" : ""}
              {variants.filter(v => v.status === "INACTIVE").length > 0 && ` · ${variants.filter(v => v.status === "INACTIVE").length} inactive`}
            </p>
            <p className="text-xs text-[#6B6056]">* Required fields</p>
          </div>
        </div>
      )}
    </div>
  );
}
