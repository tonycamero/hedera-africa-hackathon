'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MagicHederaUser } from '@/lib/services/MagicWalletService';

interface MintCounterProps {
  user: MagicHederaUser;
}

export function MintCounter({ user }: MintCounterProps) {
  const showTopUpCTA = user.freeMints < 5 && user.trstBalance < 0.25;

  return (
    <div className="flex items-center gap-3">
      {/* Free mints badge */}
      {user.freeMints > 0 && (
        <Badge variant="default" className="flex items-center gap-1">
          <span>🎁</span>
          <span>{user.freeMints} mints left</span>
        </Badge>
      )}

      {/* TRST balance */}
      <Badge variant="outline" className="flex items-center gap-1">
        <span>💎</span>
        <span>{user.trstBalance.toFixed(2)} TRST</span>
      </Badge>

      {/* Top-up CTA */}
      {showTopUpCTA && (
        <Button size="sm" variant="secondary" disabled>
          Top up $10 for more
        </Button>
      )}
    </div>
  );
}
