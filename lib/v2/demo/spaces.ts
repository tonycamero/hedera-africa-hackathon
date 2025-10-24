/**
 * TrustMesh v2 Hackathon Demo - Spaces Configuration
 * Two interconnected spaces: startup-lab (business) and campus-hub (academic)
 */

import { TMSpaceV1 } from '../schema/tm.space@1';

export const DEMO_SPACES_CONFIG: Array<Omit<TMSpaceV1, 'schema' | 'createdAt' | 'updatedAt' | 'configHash'>> = [
  {
    spaceId: 'tm.v2.startup-lab',
    metadata: {
      name: 'Startup Lab',
      category: 'technology',
      description: 'Professional workspace for startup team collaboration and client partnerships',
      displayName: 'Startup Lab 🚀',
      tags: ['startup', 'business', 'professional', 'innovation'],
      socialLinks: [
        { platform: 'website', url: 'https://startup-lab.demo' },
        { platform: 'linkedin', url: 'https://linkedin.com/company/startup-lab-demo' }
      ]
    },
    treasuryConfig: {
      settlementProvider: 'matterfi',
      custodialAccountId: 'startup_lab_custody_001',
      network: 'testnet',
      tokenSymbol: 'TRST',
      tokenDecimals: 6,
      minBalance: '10000000', // 10 TRST minimum
      maxBalance: '10000000000000', // 10M TRST maximum
      dailyLimit: '1000000000000', // 1M TRST daily
      monthlyLimit: '10000000000000' // 10M TRST monthly
    },
    recognitionPolicy: {
      allowedLenses: ['professional', 'builder', 'social'],
      requiresEvidence: false, // Demo mode - no evidence required
      maxAttachments: 3,
      skillsRequired: false,
      allowedCategories: [
        'delivery',
        'innovation', 
        'leadership',
        'reliability',
        'process_improvement',
        'team_coordination',
        'business_value',
        'communication',
        'partnership',
        'technical_guidance',
        'mentorship'
      ],
      maxRecognitionsPerDay: 20, // Higher limit for demo activity
      maxRecognitionsPerUser: 10,
      requiresModeration: false, // Auto-approve for demo flow
      autoApprove: true
    },
    complianceConfig: {
      retentionPeriod: 2555, // 7 years
      auditRetention: 2555,
      requiresKYC: false, // Demo mode
      requiresKYB: true,
      jurisdiction: 'US-CA',
      auditWebhook: 'https://audit.startup-lab.demo/webhook'
    },
    rbacConfig: {
      roles: [
        {
          roleId: 'founder',
          name: 'Founder',
          permissions: ['recognition:create', 'recognition:moderate', 'space:configure', 'audit:export'],
          scopes: ['full_access']
        },
        {
          roleId: 'manager', 
          name: 'Manager',
          permissions: ['recognition:create', 'recognition:view', 'team:coordinate'],
          scopes: ['team_management']
        },
        {
          roleId: 'partner',
          name: 'Strategic Partner',
          permissions: ['recognition:create', 'recognition:view'],
          scopes: ['partnership']
        },
        {
          roleId: 'mentor',
          name: 'Mentor/Advisor',
          permissions: ['recognition:create', 'recognition:view', 'guidance:provide'],
          scopes: ['mentorship']
        },
        {
          roleId: 'recruiter',
          name: 'Recruiter',
          permissions: ['recognition:view', 'talent:assess'],
          scopes: ['talent_pipeline']
        }
      ],
      defaultRole: 'member',
      requiresInvitation: false, // Demo mode - open access
      allowSelfRegistration: true
    },
    adminAccountIds: ['0.0.3001', '0.0.5001'], // Alex (founder) + Dana (mentor)
    ownerAccountId: '0.0.3001', // Alex Chen (founder)
    parentSpaceId: undefined, // Root space
    hcsTopicId: '0.0.777001', // Demo HCS topic
    status: 'active'
  },

  {
    spaceId: 'tm.v2.campus-hub',
    metadata: {
      name: 'Campus Hub',
      category: 'education',
      description: 'Academic community for peer learning, collaboration, and social impact projects',
      displayName: 'Campus Hub 🎓',
      tags: ['campus', 'education', 'genz', 'peer_learning', 'collaboration'],
      socialLinks: [
        { platform: 'discord', url: 'https://discord.gg/campus-hub-demo' },
        { platform: 'instagram', url: 'https://instagram.com/campushub_demo' }
      ]
    },
    treasuryConfig: {
      settlementProvider: 'matterfi',
      custodialAccountId: 'campus_hub_custody_002', 
      network: 'testnet',
      tokenSymbol: 'TRST',
      tokenDecimals: 6,
      minBalance: '1000000', // 1 TRST minimum (lower for students)
      maxBalance: '1000000000000', // 1M TRST maximum
      dailyLimit: '100000000000', // 100K TRST daily
      monthlyLimit: '1000000000000' // 1M TRST monthly
    },
    recognitionPolicy: {
      allowedLenses: ['genz', 'social', 'builder'],
      requiresEvidence: false, // Demo mode
      maxAttachments: 5, // Students might share more media
      skillsRequired: false,
      allowedCategories: [
        'collaboration',
        'peer_support', 
        'study_group',
        'leadership',
        'community_building',
        'social_impact',
        'networking',
        'cross_collaboration',
        'learning',
        'community_engagement',
        'advocacy',
        'career_development'
      ],
      maxRecognitionsPerDay: 30, // Higher student activity
      maxRecognitionsPerUser: 15,
      requiresModeration: false,
      autoApprove: true
    },
    complianceConfig: {
      retentionPeriod: 1095, // 3 years (academic records)
      auditRetention: 2555, // 7 years for audit trail
      requiresKYC: false,
      requiresKYB: false, // Educational context
      jurisdiction: 'US-CA',
      auditWebhook: 'https://audit.campus-hub.demo/webhook'
    },
    rbacConfig: {
      roles: [
        {
          roleId: 'student',
          name: 'Student',
          permissions: ['recognition:create', 'recognition:view', 'peer:support'],
          scopes: ['peer_interaction']
        },
        {
          roleId: 'mentor',
          name: 'Mentor',
          permissions: ['recognition:create', 'recognition:view', 'guidance:provide'],
          scopes: ['mentorship', 'career_guidance']
        },
        {
          roleId: 'community_partner',
          name: 'Community Partner', 
          permissions: ['recognition:create', 'recognition:view', 'community:engage'],
          scopes: ['social_impact']
        },
        {
          roleId: 'recruiter',
          name: 'Recruiter',
          permissions: ['recognition:view', 'talent:scout'],
          scopes: ['talent_identification']
        }
      ],
      defaultRole: 'student',
      requiresInvitation: false,
      allowSelfRegistration: true
    },
    adminAccountIds: ['0.0.4002', '0.0.5001'], // Brooklyn (student leader) + Dana (mentor)
    ownerAccountId: '0.0.4002', // Brooklyn Martinez (natural leader)
    parentSpaceId: undefined, // Root space (peer to startup-lab)
    hcsTopicId: '0.0.777002', // Demo HCS topic
    status: 'active'
  }
];

// HCS Topics for the demo
export const DEMO_HCS_TOPICS = {
  recognition: '0.0.777777', // Main recognition topic
  audit: '0.0.777778',       // Audit/compliance topic  
  reputation: '0.0.777779'   // Optional reputation snapshots
} as const;

// Helper functions
export function getSpaceConfig(spaceId: string) {
  return DEMO_SPACES_CONFIG.find(space => space.spaceId === spaceId);
}

export function getBusinessSpace() {
  return getSpaceConfig('tm.v2.startup-lab');
}

export function getCampusSpace() {
  return getSpaceConfig('tm.v2.campus-hub');
}