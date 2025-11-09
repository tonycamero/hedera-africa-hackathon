import { NextRequest, NextResponse } from 'next/server';
import { createMockSpaceRegistry } from '@/lib/v2/engine/spaceRegistry';

/**
 * GET /api/spaces/[id]/token-ref
 * 
 * Returns the token reference for the space's active settlement provider.
 * Used by SettlementPort implementations to identify the correct token for operations.
 */

interface TokenRef {
  symbol: string;
  network: 'hedera' | 'ethereum' | 'polygon';
  id: string;
  decimals: number;
  name?: string;
  contractAddress?: string;
  issuer?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const spaceId = params.id;

    if (!spaceId) {
      return NextResponse.json(
        { error: 'Space ID is required' },
        { status: 400 }
      );
    }

    // Get space from registry
    const registry = createMockSpaceRegistry();
    const space = await registry.getSpace(spaceId);

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    // Extract token reference from treasury config
    let tokenRef: TokenRef;
    
    switch (space.treasuryConfig.settlementProvider) {
      case 'hedera_native':
        tokenRef = {
          symbol: space.treasuryConfig.tokenSymbol,
          network: 'hedera',
          id: space.treasuryConfig.hederaTokenId || '0.0.123456', // TRST token ID
          decimals: space.treasuryConfig.tokenDecimals,
          name: `${space.treasuryConfig.tokenSymbol} Token`,
          issuer: space.treasuryConfig.hederaAccountId
        };
        break;

      case 'matterfi':
        tokenRef = {
          symbol: space.treasuryConfig.tokenSymbol,
          network: 'hedera', // MatterFi operates on Hedera
          id: space.treasuryConfig.hederaTokenId || '0.0.123456',
          decimals: space.treasuryConfig.tokenDecimals,
          name: `${space.treasuryConfig.tokenSymbol} Token`,
          issuer: 'MatterFi Custody'
        };
        break;

      case 'brale':
        // Brale supports multiple networks
        const network = space.treasuryConfig.network === 'testnet' ? 'polygon' : 'ethereum';
        tokenRef = {
          symbol: space.treasuryConfig.tokenSymbol,
          network: network as 'ethereum' | 'polygon',
          id: space.treasuryConfig.contractAddress || '0x...', // ERC-20 contract
          decimals: space.treasuryConfig.tokenDecimals,
          name: `${space.treasuryConfig.tokenSymbol} Token`,
          contractAddress: space.treasuryConfig.contractAddress
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown settlement provider' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      spaceId,
      settlementProvider: space.treasuryConfig.settlementProvider,
      tokenRef,
      lastUpdated: space.updatedAt,
      configHash: space.configHash
    });

  } catch (error) {
    console.error('Token ref API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve token reference' },
      { status: 500 }
    );
  }
}

// Method guards
const ALLOW = { headers: { Allow: 'GET' } };

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, ...ALLOW });
}