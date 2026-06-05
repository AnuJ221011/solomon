"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronDown, Loader2 } from "lucide-react";
import { useProducts, type ProductFilters } from "@/lib/hooks/useProducts";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Textiles", "Home Décor", "Jewellery", "Accessories",
  "Stationery", "Apparel", "Food & Wellness", "Art & Craft",
];
const ZONES = [
  { value: "EUROPE", label: "Europe" },
  { value: "NORTH_AMERICA", label: "North America" },
  { value: "OCEANIA", label: "Oceania" },
  { value: "SOUTH_ASIA", label: "South Asia" },
  { value: "SOUTHEAST_ASIA", label: "Southeast Asia" },
  { value: "MIDDLE_EAST", label: "Middle East" },
];
const LEVELS = [
  { value: "L5_LEGEND", label: "Legend" },
  { value: "L4_ELITE", label: "Elite" },
  { value: "L3_TRUSTED", label: "Trusted" },
  { value: "L2_RISING", label: "Rising" },
  { value: "L1_SPROUT", label: "Sprout" },
];
const SORT_OPTIONS = [
  { value: "rank",              label: "Best match"    },
  { value: "createdAt_desc",    label: "Newest first"  },
  { value: "wholesalePriceInr_asc",  label: "Price: low → high" },
  { value: "wholesalePriceInr_desc", label: "Price: high → low" },
];

interface Props {
  initialFilters?: Record<string, string>;
}

export function ShopContent({ initialFilters = {} }: Props) {
  const router = useRouter();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState<ProductFilters>({
    search:    initialFilters.search    ?? "",
    category:  initialFilters.category  ?? "",
    zone:      initialFilters.zone      ?? "",
    sortBy:    (initialFilters.sortBy   ?? "rank") as ProductFilters["sortBy"],
    sortOrder: (initialFilters.sortOrder ?? "desc") as ProductFilters["sortOrder"],
    page:      Number(initialFilters.page ?? 1),
    limit:     24,
  });

  const { data, isLoading, isFetching } = useProducts(filters);

  const update = useCallback((patch: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  }, []);

  const clearAll = () => {
    setFilters({ search: "", category: "", zone: "", sortBy: "rank", sortOrder: "desc", page: 1, limit: 24 });
  };

  const activeFilterCount = [
    filters.search, filters.category, filters.zone,
  ].filter(Boolean).length;

  const [sortValue, setSortValue] = useState("rank");
  const applySort = (val: string) => {
    setSortValue(val);
    if (val === "rank") update({ sortBy: "rank", sortOrder: "desc" });
    else {
      const [field, dir] = val.split("_");
      update({ sortBy: field as any, sortOrder: dir as any });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6056]" />
          <input
            type="text"
            placeholder="Search products, brands…"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-9 pr-4 h-10 rounded-lg border border-[#E8E0D8] bg-white text-sm text-[#1A1A1A] placeholder:text-[#6B6056] focus:outline-none focus:border-[#C8956C] transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6056] hover:text-[#1A1A1A]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative hidden sm:block">
          <select
            value={sortValue}
            onChange={(e) => applySort(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-lg border border-[#E8E0D8] bg-white text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C8956C] appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6056] pointer-events-none" />
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFilterOpen((v) => !v)}
          className={cn(
            "lg:hidden flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium transition-colors",
            activeFilterCount > 0
              ? "border-[#C8956C] bg-[#F5EDE6] text-[#C8956C]"
              : "border-[#E8E0D8] bg-white text-[#6B6056]"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-[#C8956C] text-white text-[10px] font-semibold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button onClick={clearAll} className="text-sm text-[#C8956C] hover:text-[#B07D57] font-medium whitespace-nowrap">
            Clear all
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {(filters.category || filters.zone) && (
        <div className="flex flex-wrap gap-2 mb-5">
          {filters.category && (
            <FilterPill label={filters.category} onRemove={() => update({ category: "" })} />
          )}
          {filters.zone && (
            <FilterPill
              label={ZONES.find((z) => z.value === filters.zone)?.label ?? filters.zone}
              onRemove={() => update({ zone: "" })}
            />
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside
          className={cn(
            "w-56 shrink-0 space-y-7",
            "hidden lg:block",
            mobileFilterOpen && "fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:static lg:bg-transparent lg:p-0 lg:overflow-visible block"
          )}
        >
          {/* Mobile header */}
          {mobileFilterOpen && (
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="font-heading text-xl font-semibold">Filters</h2>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="h-5 w-5 text-[#6B6056]" />
              </button>
            </div>
          )}

          {/* Categories */}
          <FilterGroup title="Category">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => update({ category: filters.category === cat ? "" : cat })}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    filters.category === cat
                      ? "bg-[#C8956C] border-[#C8956C] text-white"
                      : "bg-[#FAFAF8] border-[#E8E0D8] text-[#6B6056] hover:border-[#C8956C] hover:text-[#C8956C]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </FilterGroup>

          {/* Shipping zone */}
          <FilterGroup title="Ships to">
            <div className="space-y-2">
              {ZONES.map((z) => (
                <label key={z.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="zone"
                    checked={filters.zone === z.value}
                    onChange={() => update({ zone: filters.zone === z.value ? "" : z.value })}
                    className="accent-[#C8956C]"
                  />
                  <span className="text-sm text-[#1A1A1A] group-hover:text-[#C8956C] transition-colors">
                    {z.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterGroup>

          {/* Price range */}
          <FilterGroup title="Wholesale price (₹)">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                min={0}
                value={filters.minPrice ?? ""}
                onChange={(e) => update({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full h-8 px-2 rounded-md border border-[#E8E0D8] text-xs focus:outline-none focus:border-[#C8956C]"
              />
              <span className="text-[#6B6056] text-xs shrink-0">–</span>
              <input
                type="number"
                placeholder="Max"
                min={0}
                value={filters.maxPrice ?? ""}
                onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full h-8 px-2 rounded-md border border-[#E8E0D8] text-xs focus:outline-none focus:border-[#C8956C]"
              />
            </div>
          </FilterGroup>

          {mobileFilterOpen && (
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full h-10 rounded-lg bg-[#C8956C] text-white text-sm font-medium lg:hidden"
            >
              Show {data?.total ?? 0} results
            </button>
          )}
        </aside>

        {/* ── Product grid ─────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#6B6056]">
              {isLoading ? (
                <span className="inline-block w-24 h-4 bg-[#F5EDE6] rounded animate-pulse" />
              ) : (
                <>{data?.total ?? 0} products</>
              )}
            </p>
            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-[#C8956C]" />
            )}
          </div>

          {isLoading ? (
            <ProductSkeleton />
          ) : data?.products.length === 0 ? (
            <EmptyState onClear={clearAll} hasFilters={activeFilterCount > 0} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {data?.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <Pagination
                  page={filters.page ?? 1}
                  totalPages={data.totalPages}
                  onChange={(p) => setFilters((f) => ({ ...f, page: p }))}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ──────────────────────────────────────────── */

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EDE6] border border-[#E8C4A2] text-xs font-medium text-[#92400E]">
      {label}
      <button onClick={onRemove} className="hover:text-[#C8956C] transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#E8E0D8] overflow-hidden bg-white">
          <div className="aspect-square bg-[#F5EDE6] animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-[#F5EDE6] rounded animate-pulse w-3/4" />
            <div className="h-4 bg-[#F5EDE6] rounded animate-pulse" />
            <div className="h-3 bg-[#F5EDE6] rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">🔍</span>
      <h3 className="font-heading text-xl font-semibold text-[#1A1A1A] mb-2">
        No products found
      </h3>
      <p className="text-sm text-[#6B6056] mb-6 max-w-xs">
        {hasFilters
          ? "Try adjusting your filters or search term."
          : "Products are coming soon."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="text-sm font-medium text-[#C8956C] hover:text-[#B07D57] underline underline-offset-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function Pagination({
  page, totalPages, onChange,
}: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (i === 0) return 1;
    if (i === 6) return totalPages;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <PaginationBtn disabled={page === 1} onClick={() => onChange(page - 1)}>
        ←
      </PaginationBtn>
      {pages.map((p, i) => (
        <PaginationBtn key={i} active={p === page} onClick={() => onChange(p)}>
          {p}
        </PaginationBtn>
      ))}
      <PaginationBtn disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        →
      </PaginationBtn>
    </div>
  );
}

function PaginationBtn({
  children, active, disabled, onClick,
}: {
  children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 w-9 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-[#C8956C] text-white"
          : "bg-white border border-[#E8E0D8] text-[#6B6056] hover:border-[#C8956C] hover:text-[#C8956C]",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}
