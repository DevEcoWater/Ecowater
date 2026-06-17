"use client";

import { useRouter } from "next/navigation";
import { CirclePlus, RefreshCw, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { useUsers } from "@/hooks/users/use-users";
import { useUserFilters } from "@/hooks/users/use-users-filters";
import { FilterTabs } from "./filter-tabs";
import { UserTable } from "./user-table";
import { UserSummaryCards } from "./user-summary-cards";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ROLE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "admin", label: "Admin" },
  { value: "lector", label: "Lector" },
];

const Users = () => {
  const router = useRouter();
  const {
    data,
    isLoading,
    error,
    filterState,
    setFilterState,
    roleFilter,
    setRoleFilter,
    counts,
    setSearchQuery,
    resetFilters,
    page,
    setPage,
    totalPages,
    total,
  } = useUsers();

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { inputValue, setInputValue, handleSearch, handleFilterChange } =
    useUserFilters({
      onSearch: setSearchQuery,
      onFilterChange: setFilterState,
    });

  const handleClearAll = () => {
    resetFilters();
    setInputValue("");
  };

  return (
    <section className="w-full h-full py-6 space-y-6">
      {/* KPI summary cards */}
      <UserSummaryCards counts={counts} total={total} isLoading={isLoading} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: search + clear */}
        <div id="tour-users-search" className="flex items-center gap-2">
          <div className="flex w-full sm:w-[320px]">
            <Input
              placeholder="Buscar por nombre o apellido..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="rounded-r-none focus:outline-none"
            />
            <Button onClick={handleSearch} className="rounded-l-none h-10" type="submit">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleClearAll} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>

        {/* Right: role filter group + CTA */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-md border overflow-hidden">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRoleFilter(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  roleFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            id="tour-users-create"
            onClick={() => router.push("/dashboard/usuarios/nuevo")}
            className="w-full sm:w-auto"
          >
            <CirclePlus className="mr-2 h-4 w-4" />
            Crear usuario
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div id="tour-users-filter-tabs">
        <FilterTabs
          onFilterChange={(value) => {
            if (filterState !== value) handleFilterChange(value);
          }}
          defaultValue={filterState}
          total={total}
          counts={counts}
        />
      </div>

      {/* Table / card list */}
      <div id="tour-users-table">
        <UserTable data={data || []} isLoading={isLoading} error={error} />
      </div>

      {/* Pagination */}
      {!isLoading && data && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => goToPage(page - 1)}
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

export default Users;
