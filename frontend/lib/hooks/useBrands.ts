"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { BrandProfile } from "@/lib/types";

export interface BrandFilters {
  search?: string;
  category?: string;
  level?: string;
  page?: number;
  limit?: number;
}

export function useBrands(filters: BrandFilters = {}) {
  return useQuery({
    queryKey: ["brands", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.set(k, String(v));
      });
      const { data } = await api.get(`/brands?${params}`);
      return data.data as { brands: BrandProfile[]; total: number; totalPages: number };
    },
    placeholderData: (prev) => prev,
  });
}

export function useBrand(slug: string) {
  return useQuery<BrandProfile & { products: any[] }>({
    queryKey: ["brand", slug],
    queryFn: async () => {
      const { data } = await api.get(`/brands/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}
