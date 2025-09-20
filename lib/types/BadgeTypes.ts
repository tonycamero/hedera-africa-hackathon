export type BadgeCategory = "academic" | "professional" | "peer-to-peer" | "institutional" | "experimental"

export type BadgeStatus = "active" | "revoked" | "expired"

export interface BadgeMetadata {
  name: string
  type: "badge"
  category: BadgeCategory
  issuer: string
  recipient: string
  timestamp: string
  status: BadgeStatus
  revocation_reason?: string
  proof_url?: string
  encrypted_notes?: string
  description?: string
  rarity?: "common" | "rare" | "legendary"
}

export interface BadgeDefinition {
  id: string
  name: string
  category: BadgeCategory
  description: string
  emoji: string
  rarity: "common" | "rare" | "legendary"
  criteria: string
}

// Badge definitions from the library
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Academic Badges
  {
    id: "study-catalyst",
    name: "Study Group Catalyst",
    category: "academic",
    emoji: "📚",
    rarity: "common",
    description: "For forming or leading consistent study sessions",
    criteria: "Lead 5+ study sessions",
  },
  {
    id: "note-dropper",
    name: "Note Dropper",
    category: "academic",
    emoji: "📝",
    rarity: "common",
    description: "For uploading comprehensive notes to a shared space",
    criteria: "Share detailed notes 10+ times",
  },
  {
    id: "lab-legend",
    name: "Lab Legend",
    category: "academic",
    emoji: "🧪",
    rarity: "rare",
    description: "For exceptional contributions in group lab work",
    criteria: "Excel in collaborative lab projects",
  },
  {
    id: "final-boss-slayer",
    name: "Final Boss Slayer",
    category: "academic",
    emoji: "⚔️",
    rarity: "legendary",
    description: "For acing a course or exam",
    criteria: "Achieve top performance in challenging course",
  },

  // Professional Badges
  {
    id: "resume-whisperer",
    name: "Resume Whisperer",
    category: "professional",
    emoji: "📄",
    rarity: "common",
    description: "For helping others polish professional materials",
    criteria: "Help 5+ people with resumes/portfolios",
  },
  {
    id: "cold-email-beast",
    name: "Cold Email Beast",
    category: "professional",
    emoji: "📧",
    rarity: "rare",
    description: "For landing internships or collabs through outreach",
    criteria: "Successful cold outreach results",
  },
  {
    id: "build-week-veteran",
    name: "Build Week Veteran",
    category: "professional",
    emoji: "🏗️",
    rarity: "rare",
    description: "For completing a major builder sprint",
    criteria: "Complete intensive build project",
  },

  // Peer-to-Peer Badges
  {
    id: "moral-support-mvp",
    name: "Moral Support MVP",
    category: "peer-to-peer",
    emoji: "🤗",
    rarity: "common",
    description: "For always showing up when it counts",
    criteria: "Consistently provide emotional support",
  },
  {
    id: "conflict-diffuser",
    name: "Conflict Diffuser",
    category: "peer-to-peer",
    emoji: "🕊️",
    rarity: "rare",
    description: "For calming drama with grace",
    criteria: "Successfully mediate group conflicts",
  },
  {
    id: "group-project-anchor",
    name: "Group Project Anchor",
    category: "peer-to-peer",
    emoji: "⚓",
    rarity: "legendary",
    description: "For carrying the team when everyone ghosted",
    criteria: "Save failing group projects",
  },

  // Institutional Badges
  {
    id: "hackathon-hero",
    name: "Hackathon Hero",
    category: "institutional",
    emoji: "🏆",
    rarity: "legendary",
    description: "For winning or placing at a campus event",
    criteria: "Win or place in hackathon",
  },
  {
    id: "circle-sentinel",
    name: "Circle Sentinel",
    category: "institutional",
    emoji: "🛡️",
    rarity: "rare",
    description: "For being trusted by multiple groups",
    criteria: "Maintain trust across diverse communities",
  },

  // Experimental/Meme-Core Badges
  {
    id: "shitposter-substance",
    name: "Shitposter with Substance",
    category: "experimental",
    emoji: "💎",
    rarity: "rare",
    description: "For high-signal memes that slap",
    criteria: "Create viral, meaningful content",
  },
  {
    id: "vibes-engineer",
    name: "Vibes Engineer",
    category: "experimental",
    emoji: "✨",
    rarity: "common",
    description: "For raising the room's energy effortlessly",
    criteria: "Consistently improve group dynamics",
  },
  {
    id: "rizzler-residence",
    name: "Rizzler-in-Residence",
    category: "experimental",
    emoji: "😎",
    rarity: "legendary",
    description: "For socially graceful chaos",
    criteria: "Master social dynamics with style",
  },
]
