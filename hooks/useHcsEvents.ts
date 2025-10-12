import useSWR from "swr";
import { useRef } from "react";

const fetcher = (u:string) => fetch(u).then(r=>r.json());

export function useHcsEvents(type: "trust"|"recognition"|"contact"|"profile", refreshMs=2500) {
  const sinceRef = useRef<string | undefined>(undefined);
  const url = `/api/hcs/events?type=${type}${sinceRef.current ? `&since=${sinceRef.current}` : ""}`;
  const { data, isLoading, error, mutate } = useSWR(url, fetcher, { refreshInterval: refreshMs });

  const items = (data?.items || []) as any[];
  if (data?.watermark) sinceRef.current = data.watermark; // advance watermark forward only

  return { items, watermark: data?.watermark, isLoading, error, refresh: () => mutate() };
}