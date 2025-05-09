"use client";

import { useRouter } from "next/navigation";
import { CirclePlus, Search, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useUsers } from "@/hooks/users/use-users";
import { useUserFilters } from "@/hooks/users/use-users-filters";
import { FilterTabs } from "./filter-tabs";
import { UserTable as UserTableComponent } from "./user-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Users = () => {
  const router = useRouter();
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
  } = useUsers();

  const { inputValue, setInputValue, handleSearch, handleFilterChange } =
    useUserFilters({
      onSearch: setSearchQuery,
      onFilterChange: setFilterState,
    });

  const handleRedirect = () => {
    router.push("/dashboard/usuarios/crear");
  };

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-4 md:gap-6 md:flex-col w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex w-full md:w-[350px]">
                <Input
                  placeholder="Filtrar por email..."
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="rounded-r-none focus:outline-none"
                />
                <Button
                  onClick={handleSearch}
                  className="rounded-l-none h-10"
                  type="submit"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={resetFilters} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>

            <Button onClick={handleRedirect} className="w-full md:w-[150px]">
              Crear usuario
              <CirclePlus className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Second row: Filter Tabs */}
          <div className="flex items-center justify-center w-full mb-4">
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
        </div>
      </div>
      <div>
        <UserTableComponent
          data={data || []}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Add pagination */}
      {!isLoading && data && totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={
                    page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
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
                      onClick={() => setPage(pageNum)}
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
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
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
    </div>
  );
};

export default Users;
