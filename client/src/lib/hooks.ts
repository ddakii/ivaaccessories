import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Settings } from "./types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: Settings }>("/api/settings");
      return res.data;
    },
    staleTime: 60_000,
  });
}
