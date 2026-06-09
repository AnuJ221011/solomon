"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VariantAttributeItem {
  name: string;
  value: string;
}

export interface ProductVariantData {
  id: string;
  sku: string;
  priceInr: number;
  stock: number;
  imageUrl?: string | null;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  attributes: VariantAttributeItem[];
}

interface Props {
  variants: ProductVariantData[];
  selected: ProductVariantData | null;
  onSelect: (variant: ProductVariantData) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Groups variant attributes into { attributeName → Set of values }
 * e.g. { "Color": ["Red","Blue"], "Size": ["S","M","L"] }
 */
const groupAttributes = (variants: ProductVariantData[]) => {
  const map = new Map<string, string[]>();
  for (const variant of variants) {
    for (const attr of variant.attributes) {
      if (!map.has(attr.name)) map.set(attr.name, []);
      const arr = map.get(attr.name)!;
      if (!arr.includes(attr.value)) arr.push(attr.value);
    }
  }
  return map;
};

/**
 * Finds the variant matching the given attribute selection.
 * Partial matches return null (user still needs to pick more options).
 */
const findVariant = (
  variants: ProductVariantData[],
  selection: Record<string, string>
): ProductVariantData | null => {
  const selKeys = Object.keys(selection);
  return (
    variants.find((v) =>
      selKeys.every((key) =>
        v.attributes.some((a) => a.name === key && a.value === selection[key])
      )
    ) ?? null
  );
};

// ── Colour swatch helpers ─────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  red: "#E53E3E", blue: "#3182CE", green: "#38A169", black: "#1A1A1A",
  white: "#FFFFFF", yellow: "#D69E2E", purple: "#805AD5", pink: "#D53F8C",
  orange: "#DD6B20", grey: "#718096", gray: "#718096", brown: "#975A16",
  navy: "#2C3E7A", beige: "#C8A882", cream: "#FFF8E7", gold: "#C5A028",
  silver: "#A0AEC0", teal: "#319795", indigo: "#553C9A", coral: "#E07A5F",
  ivory: "#FFFFF0", khaki: "#C3B091", maroon: "#800000", olive: "#808000",
};

const getSwatchColor = (value: string) =>
  COLOR_MAP[value.toLowerCase().trim()] ?? null;

// ── Component ─────────────────────────────────────────────────────────────────

export function VariantSelector({ variants, selected, onSelect }: Props) {
  const grouped = useMemo(() => groupAttributes(variants), [variants]);

  // Derive current selection from the selected variant's attributes
  const currentSelection: Record<string, string> = useMemo(() => {
    if (!selected) return {};
    return Object.fromEntries(selected.attributes.map((a) => [a.name, a.value]));
  }, [selected]);

  const handlePick = (attrName: string, attrValue: string) => {
    const newSelection = { ...currentSelection, [attrName]: attrValue };
    const match = findVariant(variants, newSelection);
    if (match) onSelect(match);
    // If no match yet (partial selection), do nothing — user needs to pick more options
  };

  const isValueAvailable = (attrName: string, attrValue: string) => {
    // A value is available if at least one non-inactive variant has it
    return variants.some(
      (v) =>
        v.status !== "INACTIVE" &&
        v.attributes.some((a) => a.name === attrName && a.value === attrValue)
    );
  };

  const isValueInStock = (attrName: string, attrValue: string) => {
    return variants.some(
      (v) =>
        v.status === "ACTIVE" &&
        v.stock > 0 &&
        v.attributes.some((a) => a.name === attrName && a.value === attrValue)
    );
  };

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([attrName, values]) => {
        const isColor = attrName.toLowerCase() === "color" || attrName.toLowerCase() === "colour";

        return (
          <div key={attrName}>
            {/* Attribute label + selected value */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-[#1A1A1A]">{attrName}</span>
              {currentSelection[attrName] && (
                <span className="text-sm text-[#444748]">{currentSelection[attrName]}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const isSelected = currentSelection[attrName] === value;
                const available = isValueAvailable(attrName, value);
                const inStock = isValueInStock(attrName, value);
                const swatchColor = isColor ? getSwatchColor(value) : null;

                if (isColor && swatchColor) {
                  // ── Color swatch ──────────────────────────────────
                  return (
                    <button
                      key={value}
                      type="button"
                      title={value}
                      disabled={!available}
                      onClick={() => handlePick(attrName, value)}
                      className={cn(
                        "relative h-8 w-8 rounded-full border-2 transition-all",
                        isSelected
                          ? "border-[#1A1A1A] scale-110"
                          : "border-transparent hover:border-[#444748] hover:scale-105",
                        !available && "opacity-30 cursor-not-allowed",
                        !inStock && available && "opacity-60"
                      )}
                      style={{ backgroundColor: swatchColor }}
                    >
                      {swatchColor === "#FFFFFF" && (
                        <span className="absolute inset-0 rounded border border-[#E5E1D8]" />
                      )}
                      {/* Strikethrough overlay for out-of-stock */}
                      {!inStock && available && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="block h-px w-6 bg-[#1A1A1A]/50 rotate-45" />
                        </span>
                      )}
                    </button>
                  );
                }

                // ── Pill / button for non-color attributes ────────
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!available}
                    onClick={() => handlePick(attrName, value)}
                    className={cn(
                      "relative px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                      isSelected
                        ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                        : "border-[#E5E1D8] text-[#1A1A1A] hover:border-[#1A1A1A] bg-white",
                      !available && "opacity-30 cursor-not-allowed",
                      !inStock && available && "opacity-60"
                    )}
                  >
                    {value}
                    {/* Diagonal strikethrough for out-of-stock */}
                    {!inStock && available && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="block h-px w-full bg-[#444748]/40 rotate-45" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Stock indicator for selected variant */}
      {selected && (
        <div className="flex items-center gap-2 text-xs">
          {selected.status === "OUT_OF_STOCK" || selected.stock === 0 ? (
            <span className="text-[#C0392B] font-medium">Out of stock</span>
          ) : selected.stock <= 5 ? (
            <span className="text-[#B45309] font-medium">Only {selected.stock} left</span>
          ) : (
            <span className="text-[#2D6A4F] font-medium">{selected.stock} in stock</span>
          )}
          <span className="text-[#E5E1D8]">·</span>
          <span className="text-[#444748] font-mono">{selected.sku}</span>
        </div>
      )}
    </div>
  );
}