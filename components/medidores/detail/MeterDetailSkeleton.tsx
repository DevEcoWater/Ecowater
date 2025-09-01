import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Table } from "lucide-react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Area - Left Side */}
          <div className="col-span-8 space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart/Table Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="graph">
                  <TabsList className="mb-4">
                    <TabsTrigger
                      value="graph"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 size={16} />
                      Gráfico
                    </TabsTrigger>
                    <TabsTrigger
                      value="table"
                      className="flex items-center gap-2"
                    >
                      <Table size={16} />
                      Tabla
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="graph" className="mt-0">
                    <div className="h-[400px] space-y-4">
                      {/* Time period buttons */}
                      <div className="flex gap-2 justify-center">
                        {["1 día", "1 semana", "1 mes", "6 meses"].map(
                          (period) => (
                            <Skeleton key={period} className="h-8 w-20" />
                          )
                        )}
                      </div>
                      {/* Chart area */}
                      <div className="h-[320px] bg-muted/20 rounded-lg flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                      {/* Chart legend */}
                      <div className="flex justify-center">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-3 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="table" className="mt-0">
                    <div className="space-y-4">
                      {/* Table header */}
                      <div className="grid grid-cols-4 gap-4 pb-2 border-b">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <Skeleton key={index} className="h-4 w-full" />
                        ))}
                      </div>
                      {/* Table rows */}
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4">
                          {Array.from({ length: 4 }).map((_, colIndex) => (
                            <Skeleton key={colIndex} className="h-4 w-full" />
                          ))}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="col-span-4 space-y-6">
            {/* Device Status */}
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status indicators */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile view skeleton */}
      <div className="md:hidden space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
