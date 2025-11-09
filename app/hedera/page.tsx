import { Suspense } from "react";
import HederaStatsClient from "./HederaStatsClient";

export default function Page() {
  return (
    <div className="min-h-screen bg-ink">
      <Suspense fallback={<div className="p-6 text-genz-text">Loading...</div>}>
        <HederaStatsClient />
      </Suspense>
    </div>
  );
}
