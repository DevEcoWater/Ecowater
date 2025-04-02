"use client";

import { useState, useEffect, useMemo } from "react";
import { User, UserCounts } from "@/types/usuarios/user-types";
import { sampleUsers } from "@/lib/usuarios/constants";

export interface UseUsersOptions {
  initialFilter?: string;
}

export interface UseUsersReturn {
  data: User[] | null;
  isLoading: boolean;
  error: Error | null;
  toggleLoading: () => void;
  setActiveFilter: (filter: string) => void;
  activeFilter: string;
  counts: UserCounts;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useUsers = (options?: UseUsersOptions): UseUsersReturn => {
  const [data, setData] = useState<User[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeFilter, setActiveFilter] = useState(
    options?.initialFilter || "total"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState<UserCounts>({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setData(sampleUsers);
        setIsLoading(false);

        const totalCount = sampleUsers.length;
        const activosCount = sampleUsers.filter(
          (user) => user.status === "ACTIVE"
        ).length;
        const inactivosCount = sampleUsers.filter(
          (user) => user.status === "INACTIVE"
        ).length;

        setCounts({
          total: totalCount,
          activos: activosCount,
          inactivos: inactivosCount,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleLoading = () => {
    setIsLoading((prev) => !prev);
    if (!isLoading) {
      setData(null);
    } else {
      setTimeout(() => {
        setData(sampleUsers);
        setIsLoading(false);

        // Calculate counts after data is loaded
        const totalCount = sampleUsers.length;
        const activosCount = sampleUsers.filter(
          (user) => user.status === "ACTIVE"
        ).length;
        const inactivosCount = sampleUsers.filter(
          (user) => user.status === "INACTIVE"
        ).length;

        setCounts({
          total: totalCount,
          activos: activosCount,
          inactivos: inactivosCount,
        });
      }, 2000);
    }
  };

  const resetFilters = () => {
    setActiveFilter("total");
    setSearchQuery("");
  };

  const filteredData = useMemo(() => {
    if (!data) return null;

    let filtered = data;
    if (activeFilter === "activos") {
      filtered = data.filter((user) => user.status === "ACTIVE");
    } else if (activeFilter === "inactivos") {
      filtered = data.filter((user) => user.status === "INACTIVE");
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [data, activeFilter, searchQuery]);

  return {
    data: filteredData,
    isLoading,
    error,
    toggleLoading,
    setActiveFilter,
    activeFilter,
    counts,
    searchQuery,
    setSearchQuery,
    resetFilters,
  };
};
