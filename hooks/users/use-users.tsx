"use client";

import { useState } from "react";
import { useUsersQuery } from "./use-user-query";
import { User } from "@prisma/client";
import { TCounts } from "@/types/users/user-types";

export interface UseUsersOptions {
  initialFilter?: string;
  initialPage?: number;
  initialLimit?: number;
}
export interface UseUsersReturn {
  data: User[] | null;
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
  counts: TCounts;
}

export const useUsers = (options?: UseUsersOptions): UseUsersReturn => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState(
    options?.initialFilter || "total"
  );

  console.log("filterState", filterState);

  const [page, setPage] = useState(options?.initialPage || 1);
  const [limit, setLimit] = useState(options?.initialLimit || 10);

  const {
    data: queryData,
    isLoading,
    error,
  } = useUsersQuery(page, limit, searchQuery, filterState);

  const resetFilters = () => {
    setFilterState("total");
    setSearchQuery("");
    setPage(1);
  };

  return {
    data: queryData?.data || null,
    isLoading,
    error: error as Error | null,
    filterState,
    setFilterState,
    searchQuery,
    setSearchQuery,
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
