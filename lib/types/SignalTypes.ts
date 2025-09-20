export type SignalCategory = "academic" | "professional" | "peer-to-peer" | "institutional" | "experimental"

export type SignalStatus = "active" | "revoked" | "expired"

export interface SignalMetadata {
  name: string
  type: "signal"
  category: SignalCategory
  issuer: string
  recipient: string
  timestamp: string
  status: SignalStatus
  revocation_reason?: string
  proof_url?: string
  encrypted_notes?: string
  description?: string
}

export interface SignalDefinition {
  id: string
  name: string
  category: SignalCategory
  description: string
  emoji: string
  criteria: string
}

// Signal definitions from the library
export const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  // Academic Signals
  {
    id: "study-catalyst",
    name: "Study Group Catalyst",
    category: "academic",
    emoji: "📚",
    description: "For forming or leading consistent study sessions",
    criteria: "Lead 5+ study sessions",
  },
  {
    id: "note-dropper",
    name: "Note Dropper",
    category: "academic",
    emoji: "📝",
    description: "For uploading comprehensive notes to a shared space",
    criteria: "Share detailed notes 10+ times",
  },
  {
    id: "lab-legend",
    name: "Lab Legend",
    category: "academic",
    emoji: "🧪",
    description: "For exceptional contributions in group lab work",
    criteria: "Excel in collaborative lab projects",
  },
  {
    id: "final-boss-slayer",
    name: "Final Boss Slayer",
    category: "academic",
    emoji: "⚔️",
    description: "For acing a course or exam",
    criteria: "Achieve top performance in challenging course",
  },

  // Professional Signals
  {
    id: "resume-whisperer",
    name: "Resume Whisperer",
    category: "professional",
    emoji: "📄",
    description: "For helping others polish professional materials",
    criteria: "Help 5+ people with resumes/portfolios",
  },
  {
    id: "cold-email-beast",
    name: "Cold Email Beast",
    category: "professional",
    emoji: "📧",
    description: "For landing internships or collabs through outreach",
    criteria: "Successful cold outreach results",
  },
  {
    id: "build-week-veteran",
    name: "Build Week Veteran",
    category: "professional",
    emoji: "🏗️",
    description: "For completing a major builder sprint",
    criteria: "Complete intensive build project",
  },

  // Peer-to-Peer Signals
  {
    id: "moral-support-mvp",
    name: "Moral Support MVP",
    category: "peer-to-peer",
    emoji: "🤗",
    description: "For always showing up when it counts",
    criteria: "Consistently provide emotional support",
  },
  {
    id: "conflict-diffuser",
    name: "Conflict Diffuser",
    category: "peer-to-peer",
    emoji: "🕊️",
    description: "For calming drama with grace",
    criteria: "Successfully mediate group conflicts",
  },
  {
    id: "group-project-anchor",
    name: "Group Project Anchor",
    category: "peer-to-peer",
    emoji: "⚓",
    description: "For carrying the team when everyone ghosted",
    criteria: "Save failing group projects",
  },

  // Institutional Signals
  {
    id: "hackathon-hero",
    name: "Hackathon Hero",
    category: "institutional",
    emoji: "🏆",
    description: "For winning or placing at a campus event",
    criteria: "Win or place in hackathon",
  },
  {
    id: "circle-sentinel",
    name: "Circle Sentinel",
    category: "institutional",
    emoji: "🛡️",
    description: "For being trusted by multiple groups",
    criteria: "Maintain trust across diverse communities",
  },

  // Experimental/Meme-Core Signals
  {
    id: "shitposter-substance",
    name: "Shitposter with Substance",
    category: "experimental",
    emoji: "💎",
    description: "For high-signal memes that slap",
    criteria: "Create viral, meaningful content",
  },
  {
    id: "vibes-engineer",
    name: "Vibes Engineer",
    category: "experimental",
    emoji: "✨",
    description: "For raising the room's energy effortlessly",
    criteria: "Consistently improve group dynamics",
  },
  {
    id: "rizzler-residence",
    name: "Rizzler-in-Residence",
    category: "experimental",
    emoji: "😎",
    description: "For socially graceful chaos",
    criteria: "Master social dynamics with style",
  },
]