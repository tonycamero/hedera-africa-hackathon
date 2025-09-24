import * as React from "react";
import {
  Users, Heart, Award, Activity,
  CheckCircle2, Clock, XCircle, Share2, ExternalLink, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SignalEvent } from "@/lib/stores/signalsStore";

type SignalType = "contact" | "trust" | "recognition" | "system";
type SignalStatus = "onchain" | "local" | "error";

const typeStyles: Record<SignalType, { border: string; bg: string; text: string; ring: string }> = {
  contact: { 
    border: "border-[hsl(var(--social))]", 
    bg: "bg-[hsl(var(--social))]/5", 
    text: "text-[hsl(var(--social))]", 
    ring: "ring-[hsl(var(--social))]/20" 
  },
  trust: { 
    border: "border-[hsl(var(--trust))]", 
    bg: "bg-[hsl(var(--trust))]/5", 
    text: "text-[hsl(var(--trust))]", 
    ring: "ring-[hsl(var(--trust))]/20" 
  },
  recognition: { 
    border: "border-[hsl(var(--academic))]", 
    bg: "bg-[hsl(var(--academic))]/5", 
    text: "text-[hsl(var(--academic))]", 
    ring: "ring-[hsl(var(--academic))]/20" 
  },
  system: { 
    border: "border-[hsl(var(--professional))]", 
    bg: "bg-[hsl(var(--professional))]/5", 
    text: "text-[hsl(var(--professional))]", 
    ring: "ring-[hsl(var(--professional))]/20" 
  },
};

const TypeIcon: Record<SignalType, React.ComponentType<any>> = {
  contact: Users,
  trust: Heart,
  recognition: Award,
  system: Activity,
};

const StatusIcon: Record<SignalStatus, React.ComponentType<any>> = {
  onchain: CheckCircle2,
  local: Clock,
  error: XCircle,
};

export function FeedItem({
  signal,
  onPrimaryClick,
  onAccept,
  onBlock,
  onAdjustTrust,
  onRevoke,
  onShare,
  onRetry
}: {
  signal: SignalEvent;
  onPrimaryClick?: (signal: SignalEvent) => void;
  onAccept?: (signal: SignalEvent) => void;
  onBlock?: (signal: SignalEvent) => void;
  onAdjustTrust?: (signal: SignalEvent) => void;
  onRevoke?: (signal: SignalEvent) => void;
  onShare?: (signal: SignalEvent) => void;
  onRetry?: (signal: SignalEvent) => void;
}) {
  const TS = typeStyles[signal.class];
  const TI = TypeIcon[signal.class];
  const SI = StatusIcon[signal.status];
  const date = new Date(signal.ts);
  const time = date.toLocaleString();

  const getTitle = () => {
    if (signal.type === "CONTACT_REQUEST") {
      return signal.direction === "outbound" ? "Contact request sent" : "Contact request received"
    }
    if (signal.type === "CONTACT_ACCEPT") {
      return signal.direction === "outbound" ? "Contact accepted" : "Contact bonded"
    }
    if (signal.type === "TRUST_ALLOCATE") {
      return `Trust allocated (weight ${signal.payload?.weight || 1})`
    }
    if (signal.type === "TRUST_REVOKE") {
      return "Trust revoked"
    }
    return signal.type
  }

  const getActors = () => {
    if (signal.direction === "outbound") {
      return `${signal.actors.from} → ${signal.actors.to || "peer:unknown"}`
    } else {
      return `${signal.actors.from} → ${signal.actors.to || "me"}`
    }
  }

  // Quick action sets vary by type & status
  const QuickActions = () => {
    if (signal.class === "contact") {
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onAccept?.(signal); }}
            className="px-3 py-1 text-xs bg-[hsl(var(--social))] text-[hsl(var(--background))] hover:opacity-90"
          >
            Accept
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onBlock?.(signal); }}
            className="px-3 py-1 text-xs"
          >
            Block
          </Button>
        </div>
      );
    }
    if (signal.class === "trust") {
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onAdjustTrust?.(signal); }}
            className="px-3 py-1 text-xs bg-[hsl(var(--trust))] text-[hsl(var(--background))] hover:opacity-90"
          >
            Adjust
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={(e) => { e.stopPropagation(); onRevoke?.(signal); }}
            className="px-3 py-1 text-xs"
          >
            Revoke
          </Button>
        </div>
      );
    }
    if (signal.class === "recognition") {
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onShare?.(signal); }}
            className="px-3 py-1 text-xs bg-[hsl(var(--academic))] text-[hsl(var(--background))] hover:opacity-90 inline-flex items-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="px-3 py-1 text-xs inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Explorer
          </Button>
        </div>
      );
    }
    // system
    return (
      <div className="flex gap-2">
        {signal.status === "error" && (
          <Button 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onRetry?.(signal); }}
            className="px-3 py-1 text-xs bg-[hsl(var(--professional))] text-[hsl(var(--background))] hover:opacity-90"
          >
            Retry
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline"
          className="px-3 py-1 text-xs inline-flex items-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" /> Copy ID
        </Button>
      </div>
    );
  };

  return (
    <article
      role="button"
      aria-label={`${signal.class} signal: ${getTitle()}`}
      tabIndex={0}
      onClick={() => onPrimaryClick?.(signal)}
      className={[
        "group relative overflow-hidden rounded-2xl border-l-4 p-4 sm:p-5 cursor-pointer",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-1 hover:shadow-xl",
        TS.bg, TS.border, "ring-1", TS.ring
      ].join(" ")}
    >
      {/* Status glow effect */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div 
          className="absolute -inset-2 blur-xl rounded-2xl"
          style={{ 
            background: `linear-gradient(45deg, ${TS.border.includes('social') ? 'hsl(var(--social))' : 
                                                   TS.border.includes('trust') ? 'hsl(var(--trust))' : 
                                                   TS.border.includes('academic') ? 'hsl(var(--academic))' : 
                                                   'hsl(var(--professional))'}/10, transparent 70%)` 
          }} 
        />
      </div>

      <div className="relative flex items-start gap-4">
        {/* Type icon with neon glow */}
        <div className="shrink-0 rounded-xl p-3 bg-card border-2 border-[hsl(var(--border))] shadow-lg group-hover:shadow-xl transition-all duration-200">
          <TI className={`w-5 h-5 ${TS.text}`} aria-hidden />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-3 mb-2">
            <h3 className="font-semibold text-foreground leading-snug truncate">
              {getTitle()}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <SI 
                className={`w-4 h-4 ${
                  signal.status === "onchain" ? "text-[hsl(var(--success))] drop-shadow-[0_0_6px_hsl(var(--success))/60)]" :
                  signal.status === "local" ? "text-[hsl(var(--muted-foreground))]" : 
                  "text-destructive"
                }`} 
                aria-hidden 
              />
              <time className="text-xs text-[hsl(var(--muted-foreground))]">{time}</time>
            </div>
          </header>

          {/* Description */}
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">
            Actors: {getActors()}
          </p>
          <p className="text-xs text-[hsl(var(--text-subtle))] mb-3">
            Direction: {signal.direction} · Topic: {signal.topicType}
          </p>

          {/* Reaction strip (appears on hover) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-3">
            <button 
              className="text-lg hover:scale-110 transition-transform duration-200" 
              aria-label="React like"
              onClick={(e) => e.stopPropagation()}
            >
              👍
            </button>
            <button 
              className="text-lg hover:scale-110 transition-transform duration-200" 
              aria-label="React celebrate"
              onClick={(e) => e.stopPropagation()}
            >
              🎉
            </button>
            <button 
              className="text-lg hover:scale-110 transition-transform duration-200" 
              aria-label="React wow"
              onClick={(e) => e.stopPropagation()}
            >
              🤯
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions (hover reveal) */}
      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <QuickActions />
      </div>
    </article>
  );
}