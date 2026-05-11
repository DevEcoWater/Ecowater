import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useToggleCanWriteMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (canWrite: boolean) => {
      const res = await fetch(`/api/user/${userId}/can-write`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canWrite }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "Error al actualizar permiso de escritura");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
}
