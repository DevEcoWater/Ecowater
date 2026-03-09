"use client";

import { useState } from "react";
import { TCounts } from "@/types/users/user-types";
import { useUsersQuery } from "./use-user-query";
import { User } from "@prisma/client";

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
  totalPages: number;
  total: number;
  counts: TCounts;
}

export const useUsers = (): UseUsersReturn => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("total");
  const [page, setPage] = useState(1);

  const { data: queryData, isLoading, error } = useUsersQuery(page, 10, searchQuery, filterState);

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
    totalPages: queryData?.pagination.totalPages || 1,
    total: queryData?.pagination.total || 0,
    counts: queryData?.counts ?? { actives: 0, inactives: 0, pendings: 0, blockeds: 0 },
  };
};
