"use client";

import { useRouter } from "next/navigation";
import { CirclePlus, Search, RefreshCw, Cpu, Wrench } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useUserFilters } from "@/hooks/users/use-users-filters";
import { FilterTabs } from "./filter-tabs";
import { MeterTable as MeterTableComponent } from "./meter-table";
import { MeterSummaryCards } from "./meter-summary-cards";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useMeters } from "@/hooks/meters/use-meters";
import { useState } from "react";
import { MeterType } from "@/types/meters/meter-types";

const TYPE_OPTIONS: { label: string; value: MeterType | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Inteligentes", value: "SMART" },
  { label: "Mecánicos", value: "MECHANICAL" },
];

const Meters = () => {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<MeterType | "ALL">("ALL");

  const {
    data,
    isLoading,
    error,
    filterState,
    setFilterState,
    counts,
    setSearchQuery,
    resetFilters,
    page,
    setPage,
    totalPages,
    total,
  } = useMeters({ typeFilter: typeFilter === "ALL" ? undefined : typeFilter });

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { inputValue, setInputValue, handleSearch, handleFilterChange } =
    useUserFilters({
      onSearch: setSearchQuery,
      onFilterChange: setFilterState,
    });

  const handleResetFilters = () => {
    resetFilters();
    setTypeFilter("ALL");
    setInputValue("");
  };

  return (
    <section className="w-full h-full py-6 space-y-6">
      {/* KPI summary cards */}
      <MeterSummaryCards />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: search + clear */}
        <div id="tour-meters-search" className="flex items-center gap-2">
          <div className="flex w-full sm:w-[320px]">
            <Input
              placeholder="Código o nombre del cliente"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="rounded-r-none focus:outline-none"
            />
            <Button onClick={handleSearch} className="rounded-l-none h-10" type="submit">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleResetFilters} variant="outline" size="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>

        {/* Right: type filter group + CTA */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-md border overflow-hidden">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTypeFilter(opt.value); setPage(1); }}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm transition-colors ${
                  typeFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.value === "SMART" && <Cpu className="h-3 w-3" />}
                {opt.value === "MECHANICAL" && <Wrench className="h-3 w-3" />}
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => router.push("/dashboard/medidores/mecanicos/nuevo")}
          >
            <CirclePlus className="h-4 w-4 mr-2" />
            Nuevo medidor mecánico
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div id="tour-meters-filter-tabs">
        <FilterTabs
          onFilterChange={(value) => {
            if (filterState !== value) {
              handleFilterChange(value);
            }
          }}
          defaultValue={filterState}
          total={total}
          counts={counts}
        />
      </div>

      {/* Table / card list */}
      <div id="tour-meters-table">
        <MeterTableComponent
          data={data || []}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Pagination */}
      {!isLoading && data && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  className={
                    page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => goToPage(pageNum)}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
};

export default Meters;
