export type SignalCategory = 'social' | 'academic' | 'professional' | 'civic'
export type CulturalVariant = 'base' | 'genz' | 'african'

export interface RecognitionSignal {
  id: string
  name: string
  description: string
  category: SignalCategory
  subcategory?: string
  number: number
  icon: string
  isActive: boolean
  trustValue: number
  extendedDescription: string
  rarity: 'Common' | 'Rare' | 'Legendary'
  stats: {
    popularity: number
    impact: number
    authenticity: number
    difficulty: number
  }
  traits: {
    personality: string[]
    skills: string[]
    environment: string[]
  }
  backstory: string
  culturalContext?: string
  tips: string[]
  tags: string[]
  v: number
  culturalVariant: CulturalVariant
}

// Recognition Signals v2 - African cultural overlay
export const recognitionSignals: RecognitionSignal[] = [


  // PROFESSIONAL - Leadership (8 signals)

  {
    id: 'strategic-visionary',
    name: 'Ọgá Visionary',
    description: `Sees the path forward with ancestral wisdom`,
    category: 'professional',
    subcategory: 'leadership',
    number: 1,
    icon: '🎯',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `This leader combines forward vision with deep wisdom, seeing opportunities others miss while honoring the lessons of those who came before. They chart the course with both innovation and respect for tradition.`,
    rarity: 'Legendary',
    stats: {"popularity": 90, "impact": 95, "authenticity": 92, "difficulty": 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Legendary signal for leadership.`,
    culturalContext: `Ọgá = Boss/Chief (Yoruba/Nigerian Pidgin)`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["leadership", "strategy", "vision"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'team-catalyst',
    name: 'Ubuntu Builder',
    description: `Lifts the whole community, celebrates collective success`,
    category: 'professional',
    subcategory: 'leadership',
    number: 2,
    icon: '⚡',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `Embodies Ubuntu - 'I am because we are.' This person understands that individual success means nothing without community elevation. They create spaces where everyone's gifts contribute to collective flourishing.`,
    rarity: 'Legendary',
    stats: {"popularity": 90, "impact": 95, "authenticity": 92, "difficulty": 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Legendary signal for leadership.`,
    culturalContext: `Ubuntu = Humanity/Interconnectedness (Nguni Bantu)`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["leadership", "teamwork", "empowerment"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'decision-maker',
    name: 'Council Leader',
    description: `Makes wise decisions with counsel, not alone`,
    category: 'professional',
    subcategory: 'leadership',
    number: 3,
    icon: '⚖️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Knows that the best decisions come from gathering diverse wisdom. They consult elders, peers, and even youth before making important calls, but have the strength to decide when the time comes.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for leadership.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["leadership", "decision-making", "judgment"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'culture-builder',
    name: 'Griot of Values',
    description: `Keeps the culture alive through stories and example`,
    category: 'professional',
    subcategory: 'leadership',
    number: 4,
    icon: '🏛️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Like the griots who preserve oral history, this person keeps organizational culture alive through storytelling, example, and teaching. They ensure the values are not just written down but lived out daily.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for leadership.`,
    culturalContext: `Griot = West African historian/storyteller`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["leadership", "culture", "values"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'change-champion',
    name: 'Change Champion',
    description: `Leads transformation with clarity and empathy`,
    category: 'professional',
    subcategory: 'leadership',
    number: 5,
    icon: '🔄',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Change is hard. This person makes it easier by combining clear vision with deep empathy for those affected. They navigate resistance, celebrate early wins, and bring people along on the journey.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for leadership.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["leadership", "change-management", "transformation"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'talent-developer',
    name: 'Talent Developer',
    description: `Recruits, develops, and retains top performers`,
    category: 'professional',
    subcategory: 'leadership',
    number: 6,
    icon: '🌱',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Great leaders build great teams. This person has a gift for spotting potential, providing growth opportunities, and creating conditions where people stay and thrive for years.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for leadership.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["leadership", "mentorship", "talent-development"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'servant-leader',
    name: 'Servant Leader',
    description: `Leads by empowering others and removing obstacles`,
    category: 'professional',
    subcategory: 'leadership',
    number: 7,
    icon: '🤝',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This leader understands their job is to make their team successful, not to be the star. They clear blockers, provide resources, and elevate others' voices while staying humble.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for leadership.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["leadership", "servant-leadership", "empowerment"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'consensus-builder',
    name: 'Consensus Builder',
    description: `Navigates stakeholders to aligned decisions`,
    category: 'professional',
    subcategory: 'leadership',
    number: 8,
    icon: '🤲',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `When opinions clash and stakeholders disagree, this person finds common ground. They facilitate conversations where everyone feels heard and emerges with shared commitment to a path forward.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for leadership.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["leadership", "consensus", "facilitation"],
    v: 2,
    culturalVariant: 'african'
  },

  // PROFESSIONAL - Knowledge (8 signals)

  {
    id: 'technical-expert',
    name: 'Technical Expert',
    description: `Deep technical mastery, solves complex problems`,
    category: 'professional',
    subcategory: 'knowledge',
    number: 9,
    icon: '🔧',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `The person everyone turns to when facing impossible technical challenges. They combine deep domain expertise with practical problem-solving to unlock solutions others can't see.`,
    rarity: 'Legendary',
    stats: {"popularity": 90, "impact": 95, "authenticity": 92, "difficulty": 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Legendary signal for knowledge.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["expertise", "technical", "problem-solving"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'system-architect',
    name: 'System Architect',
    description: `Designs robust, scalable technical solutions`,
    category: 'professional',
    subcategory: 'knowledge',
    number: 10,
    icon: '🏗️',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `This person sees the forest and the trees. They design systems that are elegant, maintainable, and built to scale while respecting real-world constraints and team capabilities.`,
    rarity: 'Legendary',
    stats: {"popularity": 90, "impact": 95, "authenticity": 92, "difficulty": 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Legendary signal for knowledge.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["architecture", "systems-thinking", "design"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: `Transforms data into actionable insights`,
    category: 'professional',
    subcategory: 'knowledge',
    number: 11,
    icon: '📊',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Numbers tell stories if you know how to listen. This person cuts through data noise to find patterns, trends, and insights that drive better strategic and tactical decisions.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for knowledge.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["data", "analysis", "insights"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'domain-specialist',
    name: 'Domain Specialist',
    description: `Deep expertise in specific industry or function`,
    category: 'professional',
    subcategory: 'knowledge',
    number: 12,
    icon: '🎓',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person knows their domain inside and out. They understand the nuances, regulations, history, and best practices that make solutions actually work in the real world.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for knowledge.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["expertise", "domain-knowledge", "specialization"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'research-pioneer',
    name: 'Research Pioneer',
    description: `Conducts rigorous research, develops methodologies`,
    category: 'professional',
    subcategory: 'knowledge',
    number: 13,
    icon: '🔬',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person pushes the boundaries of what is known. They design studies, test hypotheses rigorously, and discover insights that become the foundation for future innovation.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for knowledge.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["research", "innovation", "methodology"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'continuous-learner',
    name: 'Continuous Learner',
    description: `Always acquiring new skills, stays current`,
    category: 'professional',
    subcategory: 'knowledge',
    number: 14,
    icon: '📚',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `In a rapidly changing world, this person never stops learning. They read voraciously, experiment fearlessly, take courses regularly, and adapt quickly to new ideas and technologies.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for knowledge.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["learning", "growth", "adaptability"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'quality-champion',
    name: 'Quality Champion',
    description: `Maintains exceptional standards and attention to detail`,
    category: 'professional',
    subcategory: 'knowledge',
    number: 15,
    icon: '✨',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person sweats the details others miss. They catch errors before they ship, maintain high standards consistently, and create systems that prevent quality issues from recurring.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for knowledge.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["quality", "excellence", "attention-to-detail"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'knowledge-sharer',
    name: 'Knowledge Sharer',
    description: `Documents processes, teaches others generously`,
    category: 'professional',
    subcategory: 'knowledge',
    number: 16,
    icon: '📖',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Knowledge hoarded is knowledge wasted. This person believes in multiplying impact by sharing what they know through clear documentation, patient teaching, and open collaboration.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for knowledge.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["teaching", "documentation", "knowledge-transfer"],
    v: 2,
    culturalVariant: 'african'
  },

  // PROFESSIONAL - Execution (8 signals)

  {
    id: 'delivery-champion',
    name: 'Delivery Champion',
    description: `Consistently ships on time, within scope`,
    category: 'professional',
    subcategory: 'execution',
    number: 17,
    icon: '🚀',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `This person has mastered the art of execution. They break down complex projects, manage dependencies expertly, coordinate teams effectively, and deliver results that exceed expectations.`,
    rarity: 'Legendary',
    stats: {"popularity": 90, "impact": 95, "authenticity": 92, "difficulty": 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Legendary signal for execution.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["execution", "delivery", "project-management"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'revenue-driver',
    name: 'Revenue Driver',
    description: `Directly contributes to business growth`,
    category: 'professional',
    subcategory: 'execution',
    number: 18,
    icon: '💰',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `This person understands that business is about creating value. They find opportunities, close deals, drive initiatives, and focus relentlessly on activities that directly impact the bottom line.`,
    rarity: 'Legendary',
    stats: {"popularity": 90, "impact": 95, "authenticity": 92, "difficulty": 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Legendary signal for execution.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["revenue", "growth", "business-impact"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'process-optimizer',
    name: 'Process Optimizer',
    description: `Streamlines operations, eliminates waste`,
    category: 'professional',
    subcategory: 'execution',
    number: 19,
    icon: '⚙️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person sees inefficiency everywhere and cannot resist fixing it. They redesign workflows, automate repetitive tasks, eliminate bottlenecks, and make everything run smoother.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for execution.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["efficiency", "optimization", "operations"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'customer-advocate',
    name: 'Customer Advocate',
    description: `Relentlessly focuses on customer success`,
    category: 'professional',
    subcategory: 'execution',
    number: 20,
    icon: '🤗',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person puts the customer at the center of every decision. They listen deeply to customer needs, advocate internally for customer priorities, and ensure solutions actually solve real problems.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for execution.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["customer-focus", "advocacy", "user-experience"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: `Tackles challenges with creativity and rigor`,
    category: 'professional',
    subcategory: 'execution',
    number: 21,
    icon: '🧩',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `When others see obstacles, this person sees puzzles to solve. They break down complex problems systematically, explore creative solutions courageously, and persist until they find a way forward.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for execution.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["problem-solving", "creativity", "persistence"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'bridge-builder',
    name: 'Bridge Builder',
    description: `Connects cross-functional teams effectively`,
    category: 'professional',
    subcategory: 'execution',
    number: 22,
    icon: '🌉',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Silos slow down progress and create misunderstandings. This person builds bridges between departments, translates between different perspectives, and keeps everyone aligned toward shared goals.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for execution.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["collaboration", "communication", "alignment"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'risk-manager',
    name: 'Risk Manager',
    description: `Identifies and mitigates issues proactively`,
    category: 'professional',
    subcategory: 'execution',
    number: 23,
    icon: '🛡️',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person thinks three steps ahead about what could go wrong. They spot potential problems early, develop contingency plans proactively, and keep projects on track despite uncertainty.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for execution.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["risk-management", "planning", "foresight"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'sprint-champion',
    name: 'Sprint Champion',
    description: `Executes rapid iterations with quality`,
    category: 'professional',
    subcategory: 'execution',
    number: 24,
    icon: '⏱️',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Speed and quality don't have to be trade-offs. This person masters rapid iteration, establishes quick feedback loops, embraces incremental improvement, and ships early and often.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for execution.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["agile", "iteration", "speed"],
    v: 2,
    culturalVariant: 'african'
  },

  // ACADEMIC - Scholarship (6 signals)

  {
    id: 'research-contributor',
    name: 'Knowledge Griot',
    description: `Preserves and creates knowledge for the people`,
    category: 'academic',
    subcategory: 'scholarship',
    number: 25,
    icon: '🔬',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Like the griots who preserved African knowledge through oral tradition, this scholar creates and documents knowledge that serves the community. Research that uplifts, not extracts.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for scholarship.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["research", "scholarship", "academic"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'critical-thinker',
    name: 'Sankofa Scholar',
    description: `Questions colonial narratives, reclaims truth`,
    category: 'academic',
    subcategory: 'scholarship',
    number: 26,
    icon: '🧠',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Applies Sankofa thinking to scholarship - critically examining what was taught, reclaiming what was taken, and building knowledge that centers African perspectives and experiences.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for scholarship.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["critical-thinking", "analysis", "reasoning"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'thesis-champion',
    name: 'Thesis Champion',
    description: `Completes significant independent research project`,
    category: 'academic',
    subcategory: 'scholarship',
    number: 27,
    icon: '📄',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Completing a major thesis requires sustained focus, intellectual rigor, and perseverance. This person masters all three, producing original research that demonstrates deep subject mastery.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for scholarship.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["thesis", "research", "achievement"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'academic-mentor',
    name: 'Academic Mentor',
    description: `Guides peers through difficult coursework`,
    category: 'academic',
    subcategory: 'scholarship',
    number: 28,
    icon: '🎓',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person remembers what it was like to struggle and uses that empathy to help others. They explain concepts clearly, share study strategies generously, and celebrate peers' academic wins.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for scholarship.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["mentoring", "teaching", "support"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'writing-excellence',
    name: 'Writing Excellence',
    description: `Produces clear, compelling academic writing`,
    category: 'academic',
    subcategory: 'scholarship',
    number: 29,
    icon: '✍️',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Academic writing is a craft that takes practice. This person has mastered it, producing papers that are well-structured, clearly argued, properly cited, and compelling to read.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for scholarship.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["writing", "communication", "clarity"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'presentation-pro',
    name: 'Presentation Pro',
    description: `Delivers engaging, well-structured presentations`,
    category: 'academic',
    subcategory: 'scholarship',
    number: 30,
    icon: '🎤',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Public speaking doesn't come naturally to everyone, but this person has mastered it. They structure presentations logically, engage audiences effectively, and communicate complex ideas clearly.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for scholarship.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["presentation", "public-speaking", "communication"],
    v: 2,
    culturalVariant: 'african'
  },

  // ACADEMIC - Study (6 signals)

  {
    id: 'study-group-leader',
    name: 'Study Group Leader',
    description: `Organizes and facilitates effective study sessions`,
    category: 'academic',
    subcategory: 'study',
    number: 31,
    icon: '👥',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Study groups work best when someone takes the lead. This person organizes sessions, keeps discussions on track, ensures everyone participates, and creates an environment where everyone learns.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for study.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["leadership", "study", "collaboration"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'note-taker',
    name: 'Note Taker',
    description: `Creates comprehensive, shareable notes`,
    category: 'academic',
    subcategory: 'study',
    number: 32,
    icon: '📝',
    isActive: true,
    trustValue: 0.2,
    extendedDescription: `Great notes are a gift to future students. This person takes detailed, organized notes during lectures and shares them generously, helping everyone succeed together.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for study.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["organization", "note-taking", "sharing"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'exam-strategist',
    name: 'Exam Strategist',
    description: `Masters test-taking and preparation methods`,
    category: 'academic',
    subcategory: 'study',
    number: 33,
    icon: '📋',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Doing well on exams requires more than knowing the material - it requires strategy. This person has mastered time management, question interpretation, and stress management under pressure.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for study.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["test-taking", "strategy", "preparation"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'deadline-keeper',
    name: 'Deadline Keeper',
    description: `Consistently meets academic deadlines with quality`,
    category: 'academic',
    subcategory: 'study',
    number: 34,
    icon: '⏰',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Procrastination is easy, discipline is hard. This person manages their time well, plans ahead, and submits high-quality work on time, every time, no excuses.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for study.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["time-management", "discipline", "reliability"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'reading-champion',
    name: 'Reading Champion',
    description: `Completes all assigned readings, synthesizes insights`,
    category: 'academic',
    subcategory: 'study',
    number: 35,
    icon: '📖',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Many students skip the readings. This person does them all, takes notes, connects ideas across texts, and comes to class prepared to contribute meaningfully to discussions.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for study.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["reading", "preparation", "engagement"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'flashcard-master',
    name: 'Flashcard Master',
    description: `Creates effective study tools for self and others`,
    category: 'academic',
    subcategory: 'study',
    number: 36,
    icon: '🃏',
    isActive: true,
    trustValue: 0.2,
    extendedDescription: `Flashcards are a proven learning tool, and this person has mastered the art. They create clear, focused cards that help cement key concepts for themselves and classmates.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for study.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["study-tools", "memorization", "preparation"],
    v: 2,
    culturalVariant: 'african'
  },

  // ACADEMIC - Collaboration (6 signals)

  {
    id: 'project-coordinator',
    name: 'Project Coordinator',
    description: `Keeps group projects organized and on track`,
    category: 'academic',
    subcategory: 'collaboration',
    number: 37,
    icon: '📊',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Group projects can be chaos without coordination. This person creates timelines, tracks progress, coordinates contributions, and ensures the team delivers quality work together.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for collaboration.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["coordination", "teamwork", "organization"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'peer-tutor',
    name: 'Peer Tutor',
    description: `Helps classmates understand difficult concepts`,
    category: 'academic',
    subcategory: 'collaboration',
    number: 38,
    icon: '👨‍🏫',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Sometimes peers explain things better than professors. This person has deep subject understanding and the patience to help others grasp difficult concepts through clear explanations and examples.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for collaboration.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["tutoring", "teaching", "support"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'lab-partner',
    name: 'Lab Partner',
    description: `Reliable, thorough, safe in experimental work`,
    category: 'academic',
    subcategory: 'collaboration',
    number: 39,
    icon: '🧪',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Lab work requires precision, safety awareness, and reliable collaboration. This person is the lab partner everyone wants - thorough, careful, and genuinely collaborative.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for collaboration.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["lab-work", "collaboration", "reliability"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'discussion-contributor',
    name: 'Discussion Contributor',
    description: `Adds valuable insights to class discussions`,
    category: 'academic',
    subcategory: 'collaboration',
    number: 40,
    icon: '💬',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Thoughtful class participation enriches everyone's learning. This person comes prepared, listens actively, builds on others' ideas, and contributes insights that deepen the conversation.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for collaboration.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["participation", "discussion", "engagement"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'resource-finder',
    name: 'Resource Finder',
    description: `Discovers and shares helpful learning materials`,
    category: 'academic',
    subcategory: 'collaboration',
    number: 41,
    icon: '🔍',
    isActive: true,
    trustValue: 0.2,
    extendedDescription: `Great supplemental resources can make hard topics click. This person has a knack for finding helpful videos, articles, tutorials, and practice problems, and shares them freely.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for collaboration.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["resources", "research", "sharing"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'encourager',
    name: 'Encourager',
    description: `Supports peers during academic challenges`,
    category: 'academic',
    subcategory: 'collaboration',
    number: 42,
    icon: '💪',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Academic stress is real, and kindness matters. This person lifts up struggling classmates with encouraging words, study tips, and genuine belief that they can succeed.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for collaboration.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["encouragement", "support", "empathy"],
    v: 2,
    culturalVariant: 'african'
  },

  // SOCIAL - Character (8 signals)

  {
    id: 'shows-up',
    name: 'Harambee Spirit',
    description: `Pulls together when community needs them`,
    category: 'social',
    subcategory: 'character',
    number: 43,
    icon: '✅',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Embodies Harambee - the spirit of pulling together. When the community calls, they answer. Not for recognition or reward, but because that's what community members do for each other.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for character.`,
    culturalContext: `Harambee = 'All pull together' (Swahili/Kenya)`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["reliability", "commitment", "trust"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'honest-communicator',
    name: 'Truth Speaker',
    description: `Speaks truth with love and respect for community`,
    category: 'social',
    subcategory: 'character',
    number: 44,
    icon: '💬',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Speaks truth not to tear down but to build up. They understand that honest communication is an act of love and respect for the community's wellbeing, delivered with care for relationships.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for character.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["honesty", "communication", "integrity"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'conflict-resolver',
    name: 'Conflict Resolver',
    description: `Navigates disagreements with grace and fairness`,
    category: 'social',
    subcategory: 'character',
    number: 45,
    icon: '🤝',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Conflict is inevitable in relationships. This person faces it head-on with empathy, listens to all sides, finds fair solutions, and helps people move forward together.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for character.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["conflict-resolution", "mediation", "fairness"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'boundary-respecter',
    name: 'Boundary Respecter',
    description: `Honors others' time, space, and limits`,
    category: 'social',
    subcategory: 'character',
    number: 46,
    icon: '🚧',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Healthy relationships require healthy boundaries. This person respects others' need for space, doesn't push when told no, and honors the limits people set without taking it personally.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for character.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["boundaries", "respect", "awareness"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'promise-keeper',
    name: 'Promise Keeper',
    description: `Follows through on commitments, no matter how small`,
    category: 'social',
    subcategory: 'character',
    number: 47,
    icon: '🤞',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Trust is built in small moments. This person takes all commitments seriously - if they say they'll do something, they do it, building a reputation for reliability one promise at a time.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for character.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["reliability", "commitment", "integrity"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'growth-mindset',
    name: 'Growth Mindset',
    description: `Embraces feedback, learns from mistakes`,
    category: 'social',
    subcategory: 'character',
    number: 48,
    icon: '🌱',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person sees challenges as opportunities to grow. They welcome constructive feedback, reflect on mistakes without defensiveness, and continuously evolve into better versions of themselves.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for character.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["growth", "learning", "resilience"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'authentic-self',
    name: 'Rooted In Self',
    description: `Grounded in identity, culture, and heritage`,
    category: 'social',
    subcategory: 'character',
    number: 49,
    icon: '🦋',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Deeply rooted in their identity and cultural heritage. They don't code-switch to please others - they bring their full authentic self while respecting the spaces they enter. Confidence from knowing who they are.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for character.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["authenticity", "self-acceptance", "genuineness"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'emotional-intelligence',
    name: 'Ubuntu Heart',
    description: `Feels the community's pulse, responds with care`,
    category: 'social',
    subcategory: 'character',
    number: 50,
    icon: '❤️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Has deep Ubuntu consciousness - feels when someone in the community is struggling before they say a word. Responds with the care and attention that honors our interconnectedness.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for character.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["empathy", "awareness", "sensitivity"],
    v: 2,
    culturalVariant: 'african'
  },

  // SOCIAL - Connection (8 signals)

  {
    id: 'connector',
    name: 'Bridge Builder',
    description: `Connects diaspora, builds Pan-African networks`,
    category: 'social',
    subcategory: 'connection',
    number: 51,
    icon: '🔗',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Actively builds connections across the African diaspora - linking Kenya to Nigeria, Ghana to South Africa, Atlanta to London. They understand that our collective power comes from these connections.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for connection.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["networking", "connection", "generosity"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'active-listener',
    name: 'Active Listener',
    description: `Gives full attention, remembers what matters`,
    category: 'social',
    subcategory: 'connection',
    number: 52,
    icon: '👂',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `In a distracted world, presence is a gift. This person puts away their phone, makes eye contact, asks follow-up questions, and remembers details that matter to people.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for connection.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["listening", "attention", "presence"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'celebration-starter',
    name: 'Celebration Starter',
    description: `Recognizes and celebrates others' wins`,
    category: 'social',
    subcategory: 'connection',
    number: 53,
    icon: '🎉',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person doesn't wait for big milestones to celebrate. They notice daily wins, vocally appreciate others' successes, and create a culture where achievement is acknowledged.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for connection.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["celebration", "recognition", "positivity"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'invitation-extender',
    name: 'Invitation Extender',
    description: `Includes newcomers, expands circles`,
    category: 'social',
    subcategory: 'connection',
    number: 54,
    icon: '🤗',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person remembers what it feels like to be new. They intentionally include people on the periphery, extend invitations generously, and help newcomers feel welcome.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for connection.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["inclusion", "welcoming", "kindness"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'story-teller',
    name: 'Story Teller',
    description: `Shares experiences that bring people together`,
    category: 'social',
    subcategory: 'connection',
    number: 55,
    icon: '📖',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Good stories create connection. This person shares personal experiences with humor and vulnerability, helping others see shared humanity and feel less alone in their own struggles.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for connection.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["storytelling", "connection", "vulnerability"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'humor-bringer',
    name: 'Humor Bringer',
    description: `Lightens mood appropriately, spreads joy`,
    category: 'social',
    subcategory: 'connection',
    number: 56,
    icon: '😄',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Laughter is medicine for tough times. This person knows when to crack a joke, shares memes that land perfectly, and helps groups navigate stress through appropriate humor.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for connection.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["humor", "joy", "positivity"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'memory-keeper',
    name: 'Memory Keeper',
    description: `Remembers important details about friends`,
    category: 'social',
    subcategory: 'connection',
    number: 57,
    icon: '💭',
    isActive: true,
    trustValue: 0.2,
    extendedDescription: `This person pays attention to what matters to others. They remember birthdays, ask about that big presentation, check in on that family situation - showing they care through remembering.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for connection.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["memory", "attentiveness", "care"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'space-holder',
    name: 'Sacred Circle Keeper',
    description: `Creates safe space for vulnerability and truth`,
    category: 'social',
    subcategory: 'connection',
    number: 58,
    icon: '🕊️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Creates and protects sacred spaces where people can be vulnerable, share burdens, and speak truths. Like the village circle where elders and youth gather to process life together.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for connection.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["safety", "vulnerability", "trust"],
    v: 2,
    culturalVariant: 'african'
  },

  // SOCIAL - Energy (8 signals)

  {
    id: 'positive-energy',
    name: 'Positive Energy',
    description: `Brings optimism and encouragement`,
    category: 'social',
    subcategory: 'energy',
    number: 59,
    icon: '☀️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person lights up a room. They bring optimistic energy, encourage others genuinely, see possibilities where others see problems, and lift the group's collective mood.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for energy.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["positivity", "optimism", "energy"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'calm-presence',
    name: 'Calm Presence',
    description: `Remains grounded during stress or chaos`,
    category: 'social',
    subcategory: 'energy',
    number: 60,
    icon: '🧘',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `When everything feels urgent and chaotic, this person stays centered. Their calm presence reminds others to breathe, slows down rushed decisions, and brings perspective to problems.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for energy.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["calm", "composure", "groundedness"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'energizer',
    name: 'Energizer',
    description: `Motivates and inspires action in groups`,
    category: 'social',
    subcategory: 'energy',
    number: 61,
    icon: '⚡',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Some people talk about doing things, this person makes them happen. They inspire others to take action, create momentum around ideas, and turn enthusiasm into concrete progress.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for energy.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["motivation", "energy", "action"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'thoughtful-planner',
    name: 'Thoughtful Planner',
    description: `Organizes meaningful gatherings and experiences`,
    category: 'social',
    subcategory: 'energy',
    number: 62,
    icon: '📅',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Great experiences don't happen by accident. This person thinks through details, considers everyone's needs, and creates gatherings where people feel welcomed and have genuine fun.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for energy.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["planning", "organization", "hospitality"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'creative-spark',
    name: 'Creative Spark',
    description: `Generates fresh ideas and novel approaches`,
    category: 'social',
    subcategory: 'energy',
    number: 63,
    icon: '✨',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person sees possibilities others miss. They suggest creative solutions, propose unconventional approaches, and help groups break out of conventional thinking patterns.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for energy.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["creativity", "innovation", "ideation"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'momentum-builder',
    name: 'Momentum Builder',
    description: `Helps groups move from talk to action`,
    category: 'social',
    subcategory: 'energy',
    number: 64,
    icon: '🎯',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Ideas are easy, execution is hard. This person bridges that gap, helping groups move from endless discussion to concrete next steps and building momentum through small wins.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for energy.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["momentum", "execution", "action"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'vibe-curator',
    name: 'Vibe Curator',
    description: `Sets tone through music, environment, presence`,
    category: 'social',
    subcategory: 'energy',
    number: 65,
    icon: '🎵',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person understands that environment shapes experience. They curate music playlists, set up spaces thoughtfully, and create atmospheres where people feel comfortable and connected.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for energy.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["atmosphere", "curation", "environment"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'curiosity-champion',
    name: 'Curiosity Champion',
    description: `Asks great questions, explores ideas deeply`,
    category: 'social',
    subcategory: 'energy',
    number: 66,
    icon: '🤔',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person's curiosity is contagious. They ask questions that make people think, explore topics deeply rather than superficially, and help conversations go beyond small talk.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for energy.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["curiosity", "questions", "depth"],
    v: 2,
    culturalVariant: 'african'
  },

  // CIVIC - Community-Service (6 signals)

  {
    id: 'community-organizer',
    name: 'Sankofa Organizer',
    description: `Builds community while honoring the ancestors`,
    category: 'civic',
    subcategory: 'community-service',
    number: 67,
    icon: '📢',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `Practices Sankofa - going back to fetch what was left behind. This organizer mobilizes communities with deep respect for cultural roots, traditional knowledge, and the strength that comes from collective memory.`,
    rarity: 'Legendary',
    stats: {"popularity": 90, "impact": 95, "authenticity": 92, "difficulty": 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Legendary signal for community-service.`,
    culturalContext: `Sankofa = 'Go back and get it' (Akan/Ghana)`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["organizing", "community", "leadership"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'volunteer-champion',
    name: 'Ajé Giver',
    description: `Gives resources, time, and energy for community`,
    category: 'civic',
    subcategory: 'community-service',
    number: 68,
    icon: '🙋',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Practices Ajé - the principle of shared prosperity. They give their time, resources, and energy knowing that when the community prospers, everyone prospers. No one succeeds alone.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for community-service.`,
    culturalContext: `Ajé = Wealth/Prosperity (Yoruba)`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["volunteering", "service", "dedication"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'fundraiser',
    name: 'Fundraiser',
    description: `Raises resources for worthy causes`,
    category: 'civic',
    subcategory: 'community-service',
    number: 69,
    icon: '💝',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Good causes need funding to survive. This person has mastered the art of fundraising - telling compelling stories, building donor relationships, and securing resources for important work.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for community-service.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["fundraising", "development", "resources"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'mentor',
    name: 'Elder Wisdom Keeper',
    description: `Passes down knowledge to the next generation`,
    category: 'civic',
    subcategory: 'community-service',
    number: 70,
    icon: '🌟',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Follows the African tradition of elders mentoring youth. They don't gatekeep knowledge - they actively pass down wisdom, skills, and cultural knowledge to ensure the next generation stands on their shoulders.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for community-service.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["mentoring", "youth", "guidance"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'neighbor-helper',
    name: 'Neighbor Helper',
    description: `Shows up for neighbors in practical ways`,
    category: 'civic',
    subcategory: 'community-service',
    number: 71,
    icon: '🏡',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person embodies neighborliness. They shovel snow for elderly neighbors, watch kids in a pinch, lend tools freely, and build community through small acts of practical kindness.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for community-service.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["neighborliness", "helping", "community"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'event-creator',
    name: 'Event Creator',
    description: `Organizes gatherings that strengthen community bonds`,
    category: 'civic',
    subcategory: 'community-service',
    number: 72,
    icon: '🎪',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Communities need spaces to connect. This person creates block parties, community dinners, neighborhood cleanups - events that bring people together and strengthen local bonds.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for community-service.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["events", "community-building", "organizing"],
    v: 2,
    culturalVariant: 'african'
  },

  // CIVIC - Civic-Participation (6 signals)

  {
    id: 'voter-mobilizer',
    name: 'Voter Mobilizer',
    description: `Helps others register and participate in democracy`,
    category: 'civic',
    subcategory: 'civic-participation',
    number: 73,
    icon: '🗳️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Democracy works when people participate. This person registers voters, provides election information, drives people to polls, and helps ensure everyone's voice can be heard.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for civic-participation.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["voting", "democracy", "participation"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'civic-educator',
    name: 'Civic Educator',
    description: `Teaches others about government, policy, rights`,
    category: 'civic',
    subcategory: 'civic-participation',
    number: 74,
    icon: '📚',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Informed citizens make better decisions. This person helps others understand how government works, explains policy impacts clearly, and empowers people to engage effectively.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for civic-participation.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["education", "civics", "empowerment"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'public-commenter',
    name: 'Public Commenter',
    description: `Engages thoughtfully in civic forums`,
    category: 'civic',
    subcategory: 'civic-participation',
    number: 75,
    icon: '🎤',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Public comment matters. This person prepares thoughtful input for city councils, school boards, and planning commissions - ensuring community voices shape local decisions.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for civic-participation.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["advocacy", "public-comment", "engagement"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'campaign-volunteer',
    name: 'Campaign Volunteer',
    description: `Works on campaigns for candidates or issues`,
    category: 'civic',
    subcategory: 'civic-participation',
    number: 76,
    icon: '📞',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Elections don't run themselves. This person knocks doors, makes calls, writes postcards, and does the ground work that determines who represents the community and what policies pass.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for civic-participation.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["campaigns", "volunteering", "advocacy"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'board-member',
    name: 'Board Member',
    description: `Serves on nonprofit or civic board`,
    category: 'civic',
    subcategory: 'civic-participation',
    number: 77,
    icon: '👔',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Nonprofits need good governance. This person serves on boards, brings expertise to strategic decisions, ensures fiscal responsibility, and helps organizations serve their missions effectively.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for civic-participation.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["governance", "leadership", "nonprofit"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'meeting-attendee',
    name: 'Meeting Attendee',
    description: `Shows up to city council, school board meetings`,
    category: 'civic',
    subcategory: 'civic-participation',
    number: 78,
    icon: '📋',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Local decisions happen whether we're paying attention or not. This person shows up to public meetings regularly, stays informed on local issues, and holds leaders accountable.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for civic-participation.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["attendance", "engagement", "accountability"],
    v: 2,
    culturalVariant: 'african'
  },

  // CIVIC - Environmental (6 signals)

  {
    id: 'sustainability-champion',
    name: 'Sustainability Champion',
    description: `Leads initiatives to reduce environmental impact`,
    category: 'civic',
    subcategory: 'environmental',
    number: 79,
    icon: '♻️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person doesn't just talk about sustainability - they lead it. They organize composting programs, push for renewable energy, reduce waste, and help communities live more sustainably.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for environmental.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["sustainability", "environment", "leadership"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'park-steward',
    name: 'Park Steward',
    description: `Maintains public spaces for community use`,
    category: 'civic',
    subcategory: 'environmental',
    number: 80,
    icon: '🌳',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Parks don't maintain themselves. This person shows up for cleanup days, plants native species, removes invasive plants, and ensures green spaces remain beautiful and accessible.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for environmental.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["stewardship", "parks", "maintenance"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'recycling-advocate',
    name: 'Recycling Advocate',
    description: `Educates and organizes waste reduction`,
    category: 'civic',
    subcategory: 'environmental',
    number: 81,
    icon: '♻️',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Recycling requires community participation. This person educates neighbors on proper recycling, organizes collection drives, and helps the community divert waste from landfills.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for environmental.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["recycling", "education", "waste-reduction"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'garden-builder',
    name: 'Garden Builder',
    description: `Creates community gardens, green spaces`,
    category: 'civic',
    subcategory: 'environmental',
    number: 82,
    icon: '🌱',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Community gardens build more than food - they build community. This person organizes gardens, teaches growing skills, and creates green spaces where neighbors connect over shared harvests.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for environmental.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["gardening", "community", "food-security"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'transit-promoter',
    name: 'Transit Promoter',
    description: `Advocates for sustainable transportation`,
    category: 'civic',
    subcategory: 'environmental',
    number: 83,
    icon: '🚲',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `Better transit means healthier communities. This person advocates for bike lanes, pushes for improved public transit, organizes bike shares, and makes sustainable transportation easier for everyone.`,
    rarity: 'Common',
    stats: {"popularity": 75, "impact": 80, "authenticity": 85, "difficulty": 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Common signal for environmental.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["transit", "advocacy", "sustainability"],
    v: 2,
    culturalVariant: 'african'
  },
  {
    id: 'conservation-leader',
    name: 'Conservation Leader',
    description: `Protects natural resources and ecosystems`,
    category: 'civic',
    subcategory: 'environmental',
    number: 84,
    icon: '🦅',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Natural ecosystems need protection. This person leads conservation efforts, restores habitats, advocates for protected lands, and ensures future generations inherit a healthy environment.`,
    rarity: 'Rare',
    stats: {"popularity": 80, "impact": 88, "authenticity": 88, "difficulty": 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 catalog - Rare signal for environmental.`,
    tips: [
      'Acknowledge genuine contributions',
      'Share specific examples when recognizing',
      'Build trust through consistent recognition'
    ],
    tags: ["conservation", "ecology", "protection"],
    v: 2,
    culturalVariant: 'african'
  },
]

export default recognitionSignals
