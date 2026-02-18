import { useUrgencies as useUrgenciesHook } from "@/hooks/urgencies/use-urgencies";

export function useUrgencies() {
  return useUrgenciesHook({
    includeInactive: true,
    limit: 20,
  });
}
