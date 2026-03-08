"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Status } from "@prisma/client";

type NormalizedReading = {
  id: string;
  meter_id: string;
  timestamp: string;
  status: Status;
};

export const useMeterReadings = (
  id: string,
  period?: string,
  startDate?: string,
  endDate?: string,
  initialPage = 1,
  initialLimit = 10
) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [period, startDate, endDate]);

  const buildUrl = () => {
    const base = `/api/meter/${id}/readings?page=${page}&limit=${limit}`;
    if (startDate && endDate) return `${base}&startDate=${startDate}&endDate=${endDate}`;
    return period ? `${base}&period=${period}` : base;
  };

  const query = useQuery<
    {
      data: NormalizedReading[];
      pagination: { total: number; totalPages: number; page: number; limit: number };
    },
    Error
  >({
    queryKey: ["meter-readings", id, period, startDate, endDate, page, limit],
    queryFn: async () => {
      if (!id) throw new Error("Meter ID is required");
      const response = await fetch(buildUrl());
      if (!response.ok) throw new Error("Failed to fetch meter readings");
      return response.json();
    },
    enabled: !!id,
  });

  return {
    data: query.data?.data || [],
    isLoading: query.isLoading,
    page,
    setPage,
    limit,
    setLimit,
    totalPages: query.data?.pagination.totalPages || 1,
    total: query.data?.pagination.total || 0,
  };
};
