"use client";

import { useState, useMemo } from "react";
import type { User, UserCounts } from "@/types/users/user-types";
import { useUsersQuery } from "./use-user-query";

export interface UseUsersOptions {
  initialFilter?: string;
  initialPage?: number;
  initialLimit?: number;
}

export interface UseUsersReturn {
  data: User[] | null;
  isLoading: boolean;
  error: Error | null;
  setActiveFilter: (filter: string) => void;
  activeFilter: string;
  counts: UserCounts;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  totalPages: number;
  total: number;
}

export const useUsers = (options?: UseUsersOptions): UseUsersReturn => {
  const [activeFilter, setActiveFilter] = useState(
    options?.initialFilter || "total"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(options?.initialPage || 1);
  const [limit, setLimit] = useState(options?.initialLimit || 10);

  // Use the React Query hook to fetch data
  const { data: queryData, isLoading, error } = useUsersQuery(page, limit);

  // Calculate counts for filters
  const counts = useMemo(() => {
    if (!queryData?.data) {
      return { total: 0, activos: 0, inactivos: 0 };
    }

    const totalCount = queryData.pagination.total;
    const activosCount = queryData.data.filter(
      (user) => user.status === "ACTIVE"
    ).length;
    const inactivosCount = queryData.data.filter(
      (user) => user.status === "INACTIVE"
    ).length;

    return {
      total: totalCount,
      activos: activosCount,
      inactivos: inactivosCount,
    };
  }, [queryData]);

  // Apply filters to the data
  const filteredData = useMemo(() => {
    if (!queryData?.data) return null;

    let filtered = queryData.data;

    // Apply status filter
    if (activeFilter === "activos") {
      filtered = filtered.filter((user) => user.status === "ACTIVE");
    } else if (activeFilter === "inactivos") {
      filtered = filtered.filter((user) => user.status === "INACTIVE");
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [queryData?.data, activeFilter, searchQuery]);

  const resetFilters = () => {
    setActiveFilter("total");
    setSearchQuery("");
    setPage(1);
  };

  return {
    data: filteredData,
    isLoading,
    error: error as Error | null,
    setActiveFilter,
    activeFilter,
    counts,
    searchQuery,
    setSearchQuery,
    resetFilters,
    page,
    setPage,
    limit,
    setLimit,
    totalPages: queryData?.pagination.totalPages || 1,
    total: queryData?.pagination.total || 0,
  };
};
