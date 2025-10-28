"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function QrResolverPage() {
  const sp = useSearchParams();
  const c = sp.get("c");
  const d = sp.get("d");
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let payload = d;
        if (!payload && c) {
          const res = await fetch(`/api/qr/resolve?c=${encodeURIComponent(c)}`);
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "resolve_failed");
          }
          const j = await res.json();
          payload = j.d;
        }
        if (payload) {
          const deep = `trustmesh://contact?d=${payload}`;
          setTarget(deep);
          // Try native deep link first
          window.location.href = deep;
        }
      } catch (e: any) {
        setError(e.message || "Failed to resolve QR code");
      }
    })();
  }, [c, d]);

  if (!c && !d) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f] flex items-center justify-center p-6">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">TrustMesh Contact Exchange</h1>
          <p className="text-white/60">No QR payload provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-8 text-center">
        {error ? (
          <>
            <h3 className="text-xl font-semibold text-red-400 mb-4">Error</h3>
            <p className="text-white/80 mb-6">{error}</p>
          </>
        ) : target ? (
          <>
            <h3 className="text-xl font-semibold text-white mb-4">Opening TrustMesh…</h3>
            <p className="text-white/60 mb-6">If nothing happens, open manually:</p>
            <code className="block overflow-auto bg-black/30 p-4 rounded text-xs text-white/80 break-all">
              {target}
            </code>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/80">Resolving code…</p>
          </>
        )}
      </div>
    </div>
  );
}
