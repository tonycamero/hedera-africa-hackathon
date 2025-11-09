"use client";

import useSWR from "swr";
import { ExternalLink } from "lucide-react";

const fetcher = (u: string) => fetch(u).then(r => r.json());

function hashscanTopicLink(id: string) {
  return `https://hashscan.io/testnet/topic/${id}`;
}

export default function HederaStatsClient() {
  const { data, isLoading } = useSWR("/api/hedera/stats", fetcher, { refreshInterval: 4000 });

  if (isLoading) {
    return (
      <div className="p-6 text-genz-text">
        <div className="animate-pulse">Loading Hedera stats...</div>
      </div>
    );
  }

  const d = data?.data ?? {};
  const rows = Object.entries(d)
    .filter(([, v]) => v)
    .map(([k, v]: any) => ({
      key: k,
      id: v.id,
      recent: v.recent?.length ?? 0,
    }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-genz-text">Hedera HCS Activity</h1>
      <p className="text-genz-text-dim mt-1 text-sm">
        Live topic messages from the demo. Click to inspect on HashScan.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map(r => (
          <a
            key={r.key}
            href={hashscanTopicLink(r.id)}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/20 bg-panel p-4 hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-genz-text-dim capitalize">{r.key} Topic</div>
                <div className="text-base font-medium text-genz-text break-all mt-1 font-mono">
                  {r.id}
                </div>
                <div className="text-sm text-pri-400 mt-2">
                  {r.recent} recent messages
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-genz-text-dim group-hover:text-pri-400 transition-colors" />
            </div>
          </a>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="mt-6 text-center text-genz-text-dim">
          <p>No HCS topics configured. Check environment variables.</p>
        </div>
      )}
    </div>
  );
}
