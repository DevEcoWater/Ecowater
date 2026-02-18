"use client";

import { useState, useCallback } from "react";

interface UseUserFiltersOptions {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
}

export const useUserFilters = ({
  onSearch,
  onFilterChange,
}: UseUserFiltersOptions) => {
  const [inputValue, setInputValue] = useState("");

  const handleSearch = useCallback(() => {
    onSearch(inputValue);
  }, [inputValue, onSearch]);

  const handleReset = useCallback(() => {
    setInputValue("");
    onSearch("");
  }, [onSearch]);

  const handleFilterChange = useCallback(
    (value: string) => {
      onFilterChange(value);
    },
    [onFilterChange]
  );

  return {
    inputValue,
    setInputValue,
    handleSearch,
    handleReset,
    handleFilterChange,
  };
};
