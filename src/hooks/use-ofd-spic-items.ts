import { useQuery } from "@tanstack/react-query";

import { drinksApi } from "@/lib/api/domains/drinks";

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
