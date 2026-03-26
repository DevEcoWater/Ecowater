"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HardHat,
  Search,
  Layers,
  ChevronRight,
  UserCheck,
  Users,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useOperariosQuery } from "@/hooks/operarios/use-operarios";

export default function OperariosTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");

  // Fetch all for stats (limit 100), and paginated for table
  const { data: allData } = useOperariosQuery(1, "");
  const { data, isLoading } = useOperariosQuery(page, search);

  const operarios = data?.data ?? [];
  const allOperarios = allData?.data ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const totalOperarios = allData?.pagination.total ?? 0;

  const activeCount = allOperarios.filter((o) => o.status === "ACTIVE").length;
  const zonesCount = allOperarios.reduce(
    (sum, o) => sum + (o.assignedZones?.length ?? 0),
    0
  );

  const statsLoading = !allData;

  return (
    <section className="w-full py-6 space-y-6">

      {/* Mini stats */}
      <div id="tour-operarios-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              {statsLoading ? (
                <Skeleton className="h-7 w-10 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{totalOperarios}</p>
              )}
              <p className="text-xs text-muted-foreground">Total operarios</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-green-100">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              {statsLoading ? (
                <Skeleton className="h-7 w-10 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{activeCount}</p>
              )}
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-100">
              <Map className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              {statsLoading ? (
                <Skeleton className="h-7 w-10 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{zonesCount}</p>
              )}
              <p className="text-xs text-muted-foreground">Zonas cubiertas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + new button */}
      <div className="flex items-center justify-between gap-4">
        <div id="tour-operarios-search" className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nombre o email"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(inputValue);
                setPage(1);
              }
            }}
            className="w-72 rounded-r-none"
          />
          <Button
            className="rounded-l-none"
            onClick={() => {
              setSearch(inputValue);
              setPage(1);
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div id="tour-operarios-create">
          <Button onClick={() => router.push("/dashboard/operarios/nuevo")}>
            <HardHat className="h-4 w-4 mr-2" />
            Nuevo operario
          </Button>
        </div>
      </div>

      {/* Table */}
      <div id="tour-operarios-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Zonas</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && operarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay operarios registrados
                </TableCell>
              </TableRow>
            )}
            {operarios.map((op) => (
              <TableRow
                key={op.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/dashboard/operarios/${op.id}`)}
              >
                <TableCell className="font-medium">
                  {op.firstName} {op.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {op.email}
                </TableCell>
                <TableCell>
                  <Badge variant={op.status === "ACTIVE" ? "default" : "secondary"}>
                    {op.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{op.assignedZones.length}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setPage(i + 1)}
                    isActive={page === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
}
