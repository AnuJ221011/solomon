"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

/** Fetches the active category tree (nested). Cached for 10 minutes. */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data.data ?? [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes — categories change rarely
    gcTime:    30 * 60 * 1000,
  });
}

/** Flat list — best for dropdowns and selects. */
export function useCategoriesFlat() {
  return useQuery<Pick<Category, "id" | "name" | "slug" | "parentId" | "sortOrder">[]>({
    queryKey: ["categories", "flat"],
    queryFn: async () => {
      const { data } = await api.get("/categories/flat");
      return data.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
  });
}
