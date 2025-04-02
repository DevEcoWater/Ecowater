"use client";

import { useState } from "react";

export interface UseUserFiltersOptions {
  initialQuery?: string;
  initialFilter?: string;
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
}

export interface UseUserFiltersReturn {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSearch: () => void;
  handleReset: () => void;
  handleFilterChange: (value: string) => void;
}

export const useUserFilters = (
  options?: UseUserFiltersOptions
): UseUserFiltersReturn => {
  const [inputValue, setInputValue] = useState(options?.initialQuery || "");

  const handleSearch = () => {
    options?.onSearch?.(inputValue);
  };

  const handleReset = () => {
    setInputValue("");
    options?.onSearch?.("");
    options?.onFilterChange?.(options?.initialFilter || "total");
  };

  const handleFilterChange = (value: string) => {
    options?.onFilterChange?.(value);
  };

  return {
    inputValue,
    setInputValue,
    handleSearch,
    handleReset,
    handleFilterChange,
  };
};
