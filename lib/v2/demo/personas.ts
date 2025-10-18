/**
 * TrustMesh v2 Hackathon Demo - Personas
 * 9 interconnected personas across business and academic contexts
 */

import { LensType } from '../schema/tm.recognition@1';

export interface DemoPersona {
  id: string;
  name: string;
  role: string;
  hederaAccountId: string;
  did?: string;
  email: string;
  primaryLens: LensType;
  context: 'business' | 'campus' | 'ecosystem';
  bio: string;
  spaces: string[];
  recognitionStyle: {
    frequency: 'high' | 'medium' | 'low';
    preferredCategories: string[];
    typicalRecipients: string[];
  };
  initialReputationScore: number;
  rbacRole: string;
}

// 9 Demo Personas as specified in project overview
export const DEMO_PERSONAS: DemoPersona[] = [
  // === BUSINESS / PROFESSIONAL LENS (3) ===
  {
    id: 'founder-alex',
    name: 'Alex Chen',
    role: 'Startup Founder',
    hederaAccountId: '0.0.3001',
    email: 'alex@startup-lab.demo',
    primaryLens: 'professional',
    context: 'business',
    bio: 'Serial entrepreneur building next-gen logistics platform. Values execution and reliability.',
    spaces: ['tm.v2.startup-lab'],
    recognitionStyle: {
      frequency: 'high',
      preferredCategories: ['delivery', 'innovation', 'leadership'],
      typicalRecipients: ['ops-manager-sam', 'client-partner-jordan', 'mentor-dana']
    },
    initialReputationScore: 85,
    rbacRole: 'founder'
  },
  {
    id: 'ops-manager-sam',
    name: 'Sam Rodriguez',
    role: 'Operations Manager', 
    hederaAccountId: '0.0.3002',
    email: 'sam@startup-lab.demo',
    primaryLens: 'professional',
    context: 'business',
    bio: 'Operational excellence expert. Keeps projects on track and teams aligned.',
    spaces: ['tm.v2.startup-lab'],
    recognitionStyle: {
      frequency: 'medium',
      preferredCategories: ['reliability', 'process_improvement', 'team_coordination'],
      typicalRecipients: ['founder-alex', 'student-charlie', 'recruiter-taylor']
    },
    initialReputationScore: 78,
    rbacRole: 'manager'
  },
  {
    id: 'client-partner-jordan',
    name: 'Jordan Kim',
    role: 'Strategic Partner',
    hederaAccountId: '0.0.3003', 
    email: 'jordan@partner-corp.demo',
    primaryLens: 'professional',
    context: 'business',
    bio: 'External partner representing major client. Focused on business value and ROI.',
    spaces: ['tm.v2.startup-lab'],
    recognitionStyle: {
      frequency: 'low',
      preferredCategories: ['business_value', 'communication', 'partnership'],
      typicalRecipients: ['founder-alex', 'ops-manager-sam', 'mentor-dana']
    },
    initialReputationScore: 72,
    rbacRole: 'partner'
  },

  // === CAMPUS / GEN Z LENS (3) ===
  {
    id: 'student-avery',
    name: 'Avery Thompson',
    role: 'Computer Science Student',
    hederaAccountId: '0.0.4001',
    email: 'avery@campus-hub.demo', 
    primaryLens: 'genz',
    context: 'campus',
    bio: 'CS major who loves collaborative coding and peer learning. Always organizing study groups.',
    spaces: ['tm.v2.campus-hub'],
    recognitionStyle: {
      frequency: 'high',
      preferredCategories: ['collaboration', 'peer_support', 'study_group'],
      typicalRecipients: ['student-brooklyn', 'student-charlie', 'mentor-dana']
    },
    initialReputationScore: 45,
    rbacRole: 'student'
  },
  {
    id: 'student-brooklyn', 
    name: 'Brooklyn Martinez',
    role: 'Study Group Leader',
    hederaAccountId: '0.0.4002',
    email: 'brooklyn@campus-hub.demo',
    primaryLens: 'genz',
    context: 'campus', 
    bio: 'Natural leader who brings people together. Organizes events and builds community.',
    spaces: ['tm.v2.campus-hub'],
    recognitionStyle: {
      frequency: 'high',
      preferredCategories: ['leadership', 'community_building', 'social_impact'],
      typicalRecipients: ['student-avery', 'student-charlie', 'community-river']
    },
    initialReputationScore: 52,
    rbacRole: 'student'
  },
  {
    id: 'student-charlie',
    name: 'Charlie Wong', 
    role: 'Trust Intern',
    hederaAccountId: '0.0.4003',
    email: 'charlie@campus-hub.demo',
    primaryLens: 'genz',
    context: 'campus',
    bio: 'Bridge between campus and startup world. Part-time at startup-lab, full-time student.',
    spaces: ['tm.v2.campus-hub', 'tm.v2.startup-lab'],
    recognitionStyle: {
      frequency: 'medium',
      preferredCategories: ['networking', 'cross_collaboration', 'learning'],
      typicalRecipients: ['student-avery', 'student-brooklyn', 'ops-manager-sam', 'founder-alex']
    },
    initialReputationScore: 38,
    rbacRole: 'student'
  },

  // === ECOSYSTEM / BUILDER LENS (3) ===
  {
    id: 'mentor-dana',
    name: 'Dana Park',
    role: 'Mentor & Advisor',
    hederaAccountId: '0.0.5001', 
    email: 'dana@ecosystem.demo',
    primaryLens: 'builder',
    context: 'ecosystem',
    bio: 'Experienced tech leader mentoring both students and startups. Cross-lens connector.',
    spaces: ['tm.v2.startup-lab', 'tm.v2.campus-hub'],
    recognitionStyle: {
      frequency: 'medium',
      preferredCategories: ['mentorship', 'technical_guidance', 'career_development'],
      typicalRecipients: ['founder-alex', 'student-avery', 'student-brooklyn', 'recruiter-taylor']
    },
    initialReputationScore: 95,
    rbacRole: 'mentor'
  },
  {
    id: 'recruiter-taylor',
    name: 'Taylor Singh',
    role: 'Tech Recruiter',
    hederaAccountId: '0.0.5002',
    email: 'taylor@talent-bridge.demo', 
    primaryLens: 'builder',
    context: 'ecosystem',
    bio: 'Talent scout focused on finding reliable, trustworthy candidates. Values verified skills.',
    spaces: ['tm.v2.startup-lab', 'tm.v2.campus-hub'],
    recognitionStyle: {
      frequency: 'low',
      preferredCategories: ['reliability', 'skill_verification', 'professional_growth'],
      typicalRecipients: ['student-charlie', 'ops-manager-sam', 'student-avery']
    },
    initialReputationScore: 68,
    rbacRole: 'recruiter'
  },
  {
    id: 'community-river',
    name: 'River Johnson',
    role: 'Community Partner',
    hederaAccountId: '0.0.5003',
    email: 'river@social-impact.demo',
    primaryLens: 'social',
    context: 'ecosystem', 
    bio: 'Social impact advocate connecting tech innovation with community needs.',
    spaces: ['tm.v2.campus-hub'],
    recognitionStyle: {
      frequency: 'medium',
      preferredCategories: ['social_impact', 'community_engagement', 'advocacy'],
      typicalRecipients: ['student-brooklyn', 'student-avery', 'mentor-dana']
    },
    initialReputationScore: 61,
    rbacRole: 'community_partner'
  }
];

// Helper functions
export function getPersonaById(id: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find(p => p.id === id);
}

export function getPersonasBySpace(spaceId: string): DemoPersona[] {
  return DEMO_PERSONAS.filter(p => p.spaces.includes(spaceId));
}

export function getPersonasByContext(context: 'business' | 'campus' | 'ecosystem'): DemoPersona[] {
  return DEMO_PERSONAS.filter(p => p.context === context);
}

export function getPersonasByLens(lens: LensType): DemoPersona[] {
  return DEMO_PERSONAS.filter(p => p.primaryLens === lens);
}