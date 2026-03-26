import { useQuery } from "@tanstack/react-query";

export interface FeaturePacks {
  valve_control: boolean;
  advanced_export: boolean;
  urgencies: boolean;
}

export function useFeaturePacks() {
  return useQuery<FeaturePacks>({
    queryKey: ["featurePacks"],
    queryFn: async () => {
      const res = await fetch("/api/cooperative/packs");
      if (!res.ok) {
        return { valve_control: false, advanced_export: false, urgencies: false };
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes — packs change rarely
    gcTime: 10 * 60 * 1000,
  });
}
