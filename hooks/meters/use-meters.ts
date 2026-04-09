"use client";

import { useState } from "react";
import { Meter, User } from "@prisma/client";
import { TCounts } from "@/types/users/user-types";
import { useMetersQuery } from "./use-meter-query";
import { MeterStatusCounts, MeterType } from "@/types/meters/meter-types";

export interface UseMetersOptions {
  initialFilter?: string;
  initialPage?: number;
  initialLimit?: number;
  typeFilter?: MeterType;
}
export interface UseMetersReturn {
  data: Meter[] | null;
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  filterState: string;
  setFilterState: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  totalPages: number;
  total: number;
  counts: MeterStatusCounts;
}

export const useMeters = (options?: UseMetersOptions): UseMetersReturn => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState(
    options?.initialFilter || "total"
  );

  const [page, setPage] = useState(options?.initialPage || 1);
  const [limit, setLimit] = useState(options?.initialLimit || 10);

  const {
    data: queryData,
    isLoading,
    error,
  } = useMetersQuery(page, limit, searchQuery, filterState, options?.typeFilter);

  const resetFilters = () => {
    setFilterState("total");
    setSearchQuery("");
    setPage(1);
  };

  const handleSetFilterState = (filter: string) => {
    setFilterState(filter);
    setPage(1);
  };

  const handleSetSearchQuery = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  return {
    data: queryData?.data || null,
    isLoading,
    error: error as Error | null,
    filterState,
    setFilterState: handleSetFilterState,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    resetFilters,
    page,
    setPage,
    limit,
    setLimit,
    totalPages: queryData?.pagination.totalPages || 1,
    total: queryData?.pagination.total || 0,
    counts: queryData?.counts,
  };
};
