"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Product, ApiResponse } from "@/lib/types";

export interface ProductFilters {
  search?: string;
  category?: string;
  zone?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

interface ProductsData {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery<ProductsData>({
    queryKey: ["products", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.set(k, String(v));
      });
      const { data } = await api.get(`/products?${params}`);
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}
