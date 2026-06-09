"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Loader2, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useCategoriesFlat } from "@/lib/hooks/useCategories";
import { cn } from "@/lib/utils";

interface Props {
  selected: string[];          // selected category names
  onChange: (names: string[]) => void;
  max?: number;                // max selections (default 2)
}

export function CategoryCombobox({ selected, onChange, max = 2 }: Props) {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useCategoriesFlat();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post("/categories", { name });
      return data.data;
    },
    onSuccess: (newCat) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toggle(newCat.name);
      setQuery("");
      toast.success(`Category "${newCat.name}" created`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Could not create category"),
  });

  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((n) => n !== name));
    } else if (selected.length < max) {
      onChange([...selected, name]);
    } else {
      toast.error(`Maximum ${max} categories allowed`);
    }
  };

  const trimmed = query.trim();
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(trimmed.toLowerCase())
  );
  const exactMatch = categories.some(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  const showCreate = trimmed.length > 0 && !exactMatch;

  return (
    <div className="space-y-2">
      {/* Selected pills */}
      <div className="flex flex-wrap gap-2">
        {selected.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#1A1A1A] text-white text-sm font-medium"
          >
            {name}
            <button
              type="button"
              onClick={() => onChange(selected.filter((n) => n !== name))}
              className="hover:text-white/70 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {selected.length < max && (
          <span className="text-xs text-[#444748] self-center">
            {max - selected.length} more allowed
          </span>
        )}
      </div>

      {/* Combobox trigger */}
      {selected.length < max && (
        <div ref={containerRef} className="relative">
          <div
            className={cn(
              "flex items-center gap-2 h-10 px-3 rounded-lg border bg-[#F9F7F2] cursor-text transition-colors",
              open ? "border-[#A68B67] bg-white" : "border-[#E5E1D8]"
            )}
            onClick={() => { setOpen(true); inputRef.current?.focus(); }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder={selected.length === 0 ? "Search or create a category…" : "Add another category…"}
              className="flex-1 text-sm bg-transparent text-[#1A1A1A] placeholder:text-[#444748] focus:outline-none"
            />
            {isLoading
              ? <Loader2 className="h-4 w-4 text-[#444748] animate-spin shrink-0" />
              : <ChevronDown className={cn("h-4 w-4 text-[#444748] shrink-0 transition-transform", open && "rotate-180")} />
            }
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white rounded-lg border border-[#E5E1D8] shadow-warm-md overflow-hidden">
              <div className="max-h-52 overflow-y-auto">
                {filtered.length === 0 && !showCreate && (
                  <p className="px-4 py-3 text-sm text-[#444748]">No categories found.</p>
                )}

                {filtered.map((cat) => {
                  const isSelected = selected.includes(cat.name);
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => { toggle(cat.name); setQuery(""); }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left",
                        isSelected
                          ? "bg-[#F5F0E8] text-[#A68B67] font-medium"
                          : "text-[#1A1A1A] hover:bg-[#F9F7F2]"
                      )}
                    >
                      <span>{cat.name}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}

                {/* Inline "Create new category" option */}
                {showCreate && (
                  <button
                    type="button"
                    disabled={createMutation.isPending}
                    onClick={() => createMutation.mutate(trimmed)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#A68B67] font-medium hover:bg-[#F5F0E8] transition-colors border-t border-[#E5E1D8] disabled:opacity-60"
                  >
                    {createMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      : <Plus className="h-4 w-4 shrink-0" />
                    }
                    Create "{trimmed}"
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}