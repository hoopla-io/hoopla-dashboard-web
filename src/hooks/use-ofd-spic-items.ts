import { useQuery } from "@tanstack/react-query";

import { drinksApi } from "@/lib/api/domains/drinks";

export const isOfdSpic = (code: string) => /^\d{17}$/.test(code);

export function useOfdSpicItems() {
  const { data } = useQuery({
    queryKey: ["ofd-spics"],
    queryFn: drinksApi.getOfdSpics,
    staleTime: Infinity,
  });

  return [
    { value: "", label: "Not set" },
    ...(data ?? []).map((s) => ({ value: s.code, label: `${s.code} — ${s.name}` })),
  ];
}
