import { NextRequest, NextResponse } from 'next/server';
import { createMockSpaceRegistry } from '@/lib/v2/engine/spaceRegistry';

/**
 * GET /api/spaces/[id]/effective-config
 * 
 * Returns the effective configuration for a space after applying inheritance merging.
 * This saves the Context Engine and other consumers from having to perform their own merging.
 */

interface EffectiveSpaceConfig {
  spaceId: string;
  treasuryConfig: {
    settlementProvider: 'matterfi' | 'brale' | 'hedera_native';
    custodialAccountId?: string;
    hederaAccountId?: string;
    network: 'mainnet' | 'testnet';
    tokenSymbol: string;
    tokenDecimals: number;
    minBalance: string;
    maxBalance: string;
    dailyLimit: string;
    monthlyLimit: string;
  };
  recognitionPolicy: {
    allowedLenses: Array<'genz' | 'professional' | 'social' | 'builder'>;
    requiresEvidence: boolean;
    maxAttachments: number;
    skillsRequired: boolean;
    allowedCategories: string[];
    maxRecognitionsPerDay?: number;
    maxRecognitionsPerUser?: number;
    requiresModeration: boolean;
    autoApprove: boolean;
  };
  complianceConfig: {
    retentionPeriod: number;
    auditRetention: number;
    requiresKYC: boolean;
    requiresKYB: boolean;
    jurisdiction: string;
    kycProvider?: string;
    kybProvider?: string;
    auditWebhook?: string;
  };
  rbacConfig: {
    roles: Array<{
      roleId: string;
      name: string;
      permissions: string[];
      scopes: string[];
    }>;
    defaultRole: string;
    requiresInvitation: boolean;
    allowSelfRegistration: boolean;
  };
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

    // Get space registry with inheritance
    const registry = createMockSpaceRegistry();
    const space = await registry.getSpace(spaceId);

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    // Build effective config - inheritance is already applied by SpaceRegistry
    const effectiveConfig: EffectiveSpaceConfig = {
      spaceId: space.spaceId,
      treasuryConfig: {
        settlementProvider: space.treasuryConfig.settlementProvider,
        custodialAccountId: space.treasuryConfig.custodialAccountId,
        hederaAccountId: space.treasuryConfig.hederaAccountId,
        network: space.treasuryConfig.network,
        tokenSymbol: space.treasuryConfig.tokenSymbol,
        tokenDecimals: space.treasuryConfig.tokenDecimals,
        minBalance: space.treasuryConfig.minBalance,
        maxBalance: space.treasuryConfig.maxBalance,
        dailyLimit: space.treasuryConfig.dailyLimit,
        monthlyLimit: space.treasuryConfig.monthlyLimit,
      },
      recognitionPolicy: {
        allowedLenses: space.recognitionPolicy.allowedLenses,
        requiresEvidence: space.recognitionPolicy.requiresEvidence,
        maxAttachments: space.recognitionPolicy.maxAttachments,
        skillsRequired: space.recognitionPolicy.skillsRequired,
        allowedCategories: space.recognitionPolicy.allowedCategories,
        maxRecognitionsPerDay: space.recognitionPolicy.maxRecognitionsPerDay,
        maxRecognitionsPerUser: space.recognitionPolicy.maxRecognitionsPerUser,
        requiresModeration: space.recognitionPolicy.requiresModeration,
        autoApprove: space.recognitionPolicy.autoApprove,
      },
      complianceConfig: {
        retentionPeriod: space.complianceConfig.retentionPeriod,
        auditRetention: space.complianceConfig.auditRetention,
        requiresKYC: space.complianceConfig.requiresKYC,
        requiresKYB: space.complianceConfig.requiresKYB,
        jurisdiction: space.complianceConfig.jurisdiction,
        kycProvider: space.complianceConfig.kycProvider,
        kybProvider: space.complianceConfig.kybProvider,
        auditWebhook: space.complianceConfig.auditWebhook,
      },
      rbacConfig: {
        roles: space.rbacConfig.roles,
        defaultRole: space.rbacConfig.defaultRole,
        requiresInvitation: space.rbacConfig.requiresInvitation,
        allowSelfRegistration: space.rbacConfig.allowSelfRegistration,
      }
    };

    return NextResponse.json({
      success: true,
      spaceId,
      effectiveConfig,
      inheritanceChain: space.parentSpaceId ? [space.parentSpaceId] : [],
      lastUpdated: space.updatedAt,
      configHash: space.configHash
    });

  } catch (error) {
    console.error('Effective config API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve effective config' },
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