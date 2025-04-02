"use client";
import { useRouter } from "next/navigation";
import { CirclePlus, Search, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useUsers } from "@/hooks/usuarios/use-users";
import { useUserFilters } from "@/hooks/usuarios/use-users-filters";
import { FilterTabs } from "./filter-tabs";
import { UserTable } from "./user-table";

const Users = () => {
  const router = useRouter();
  const {
    data,
    isLoading,
    error,
    setActiveFilter,
    activeFilter,
    counts,
    setSearchQuery,
    resetFilters,
  } = useUsers();

  const {
    inputValue,
    setInputValue,
    handleSearch,
    handleReset,
    handleFilterChange,
  } = useUserFilters({
    onSearch: setSearchQuery,
    onFilterChange: setActiveFilter,
    initialFilter: activeFilter,
  });

  const handleRedirect = () => {
    router.push("/dashboard/usuarios/registro");
  };

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center max-w-md">
          <Input
            placeholder="Filtrar por email..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="w-[250px] focus:outline-none"
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={handleReset} variant="outline" className="ml-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>

        <FilterTabs
          onFilterChange={handleFilterChange}
          defaultValue={activeFilter}
          counts={counts}
        />

        <Button onClick={handleRedirect} className="w-[150px]">
          Crear usuario
          <CirclePlus className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4">
        <UserTable data={data || []} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
};

export default Users;
