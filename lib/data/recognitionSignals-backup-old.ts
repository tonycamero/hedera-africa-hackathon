export type SignalCategory = 'social' | 'academic' | 'professional' | 'civic'

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
  tips: string[]
  tags: string[]
  v: number
}

// Recognition Signals v2 - Complete Curated Catalog
// Generated from signals-v2-data.json
// 84 positive signals across 4 balanced categories
// All negative signals removed (brain-rot, gyatt, npc, skibidi, etc.)
// New Civic category with 18 community engagement signals

export const recognitionSignals: RecognitionSignal[] = [

  // PROFESSIONAL - Leadership (8 signals)
  {
    id: 'strategic-visionary',
    name: 'Strategic Visionary',
    description: `Sees the big picture and guides long-term direction`,
    category: 'professional',
    subcategory: 'leadership',
    number: 1,
    icon: '🎯',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `Exceptional ability to see beyond the immediate horizon and chart a course for long-term success. They connect dots others miss and inspire teams with compelling visions of what's possible.`,
    rarity: 'Legendary',
    stats: {'popularity': 90, 'impact': 95, 'authenticity': 92, 'difficulty': 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Legendary signal representing leadership excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['leadership', 'strategy', 'vision'],
    v: 2
  },
  {
    id: 'team-catalyst',
    name: 'Team Catalyst',
    description: `Brings out the best in others, drives collective success`,
    category: 'professional',
    subcategory: 'leadership',
    number: 2,
    icon: '⚡',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `The secret ingredient that transforms good teams into great ones. They create psychological safety, celebrate wins, and help everyone contribute their unique strengths to collective goals.`,
    rarity: 'Legendary',
    stats: {'popularity': 90, 'impact': 95, 'authenticity': 92, 'difficulty': 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Legendary signal representing leadership excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['leadership', 'teamwork', 'empowerment'],
    v: 2
  },
  {
    id: 'decision-maker',
    name: 'Decision Maker',
    description: `Makes sound calls under pressure with incomplete info`,
    category: 'professional',
    subcategory: 'leadership',
    number: 3,
    icon: '⚖️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `When stakes are high and time is short, this person steps up with clarity. They gather just enough information, trust their judgment, and commit to a path forward without endless deliberation.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing leadership excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['leadership', 'decision-making', 'judgment'],
    v: 2
  },
  {
    id: 'culture-builder',
    name: 'Culture Builder',
    description: `Shapes positive organizational culture and values`,
    category: 'professional',
    subcategory: 'leadership',
    number: 4,
    icon: '🏛️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Culture isn't ping-pong tables and free snacks - it's how people treat each other when no one's watching. Culture builders model values, call out toxic behavior, and create environments where people thrive.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing leadership excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['leadership', 'culture', 'values'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing leadership excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['leadership', 'change-management', 'transformation'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing leadership excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['leadership', 'mentorship', 'talent-development'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing leadership excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['leadership', 'servant-leadership', 'empowerment'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing leadership excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['leadership', 'consensus', 'facilitation'],
    v: 2
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
    stats: {'popularity': 90, 'impact': 95, 'authenticity': 92, 'difficulty': 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Legendary signal representing knowledge excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['expertise', 'technical', 'problem-solving'],
    v: 2
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
    stats: {'popularity': 90, 'impact': 95, 'authenticity': 92, 'difficulty': 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Legendary signal representing knowledge excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['architecture', 'systems-thinking', 'design'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing knowledge excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['data', 'analysis', 'insights'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing knowledge excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['expertise', 'domain-knowledge', 'specialization'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing knowledge excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['research', 'innovation', 'methodology'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing knowledge excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['learning', 'growth', 'adaptability'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing knowledge excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['quality', 'excellence', 'attention-to-detail'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing knowledge excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['teaching', 'documentation', 'knowledge-transfer'],
    v: 2
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
    stats: {'popularity': 90, 'impact': 95, 'authenticity': 92, 'difficulty': 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Legendary signal representing execution excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['execution', 'delivery', 'project-management'],
    v: 2
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
    stats: {'popularity': 90, 'impact': 95, 'authenticity': 92, 'difficulty': 85},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Legendary signal representing execution excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['revenue', 'growth', 'business-impact'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing execution excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['efficiency', 'optimization', 'operations'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing execution excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['customer-focus', 'advocacy', 'user-experience'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing execution excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['problem-solving', 'creativity', 'persistence'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing execution excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['collaboration', 'communication', 'alignment'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing execution excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['risk-management', 'planning', 'foresight'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing execution excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['agile', 'iteration', 'speed'],
    v: 2
  },

  // ACADEMIC - Scholarship (6 signals)
  {
    id: 'research-contributor',
    name: 'Research Contributor',
    description: `Makes meaningful contributions to academic research`,
    category: 'academic',
    subcategory: 'scholarship',
    number: 25,
    icon: '🔬',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person advances knowledge through rigorous research. They design studies, collect data carefully, analyze results thoroughly, and publish findings that other scholars build upon.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing scholarship excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['research', 'scholarship', 'academic'],
    v: 2
  },
  {
    id: 'critical-thinker',
    name: 'Critical Thinker',
    description: `Challenges assumptions, evaluates evidence rigorously`,
    category: 'academic',
    subcategory: 'scholarship',
    number: 26,
    icon: '🧠',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person doesn't accept claims at face value. They question assumptions, examine evidence carefully, identify logical fallacies, and arrive at well-reasoned conclusions.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing scholarship excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['critical-thinking', 'analysis', 'reasoning'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing scholarship excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['thesis', 'research', 'achievement'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing scholarship excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['mentoring', 'teaching', 'support'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing scholarship excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['writing', 'communication', 'clarity'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing scholarship excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['presentation', 'public-speaking', 'communication'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing study excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['leadership', 'study', 'collaboration'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing study excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['organization', 'note-taking', 'sharing'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing study excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['test-taking', 'strategy', 'preparation'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing study excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['time-management', 'discipline', 'reliability'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing study excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['reading', 'preparation', 'engagement'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing study excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['study-tools', 'memorization', 'preparation'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing collaboration excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['coordination', 'teamwork', 'organization'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing collaboration excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['tutoring', 'teaching', 'support'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing collaboration excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['lab-work', 'collaboration', 'reliability'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing collaboration excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['participation', 'discussion', 'engagement'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing collaboration excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['resources', 'research', 'sharing'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing collaboration excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['encouragement', 'support', 'empathy'],
    v: 2
  },

  // SOCIAL - Character (8 signals)
  {
    id: 'shows-up',
    name: 'Shows Up',
    description: `Consistently present when needed, reliable presence`,
    category: 'social',
    subcategory: 'character',
    number: 43,
    icon: '✅',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Showing up sounds simple but it's profound. This person is consistently present for friends, follows through on commitments, and builds trust through reliable presence over time.`,
    rarity: 'Common',
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing character excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['reliability', 'commitment', 'trust'],
    v: 2
  },
  {
    id: 'honest-communicator',
    name: 'Honest Communicator',
    description: `Direct, transparent, builds trust through truth`,
    category: 'social',
    subcategory: 'character',
    number: 44,
    icon: '💬',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person tells the truth even when it's uncomfortable. They communicate directly, don't hide behind politeness, and build deep trust through consistent honesty.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing character excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['honesty', 'communication', 'integrity'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing character excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['conflict-resolution', 'mediation', 'fairness'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing character excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['boundaries', 'respect', 'awareness'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing character excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['reliability', 'commitment', 'integrity'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing character excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['growth', 'learning', 'resilience'],
    v: 2
  },
  {
    id: 'authentic-self',
    name: 'Authentic Self',
    description: `Genuine, comfortable in own identity`,
    category: 'social',
    subcategory: 'character',
    number: 49,
    icon: '🦋',
    isActive: true,
    trustValue: 0.3,
    extendedDescription: `This person doesn't pretend to be someone they're not. They're comfortable in their own skin, share their true thoughts and feelings, and give others permission to be authentic too.`,
    rarity: 'Common',
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing character excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['authenticity', 'self-acceptance', 'genuineness'],
    v: 2
  },
  {
    id: 'emotional-intelligence',
    name: 'Emotional Intelligence',
    description: `Reads social cues, responds with empathy`,
    category: 'social',
    subcategory: 'character',
    number: 50,
    icon: '❤️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person picks up on subtle emotional signals others miss. They sense when someone needs support, adapt their communication style to the moment, and respond with genuine empathy.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing character excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['empathy', 'awareness', 'sensitivity'],
    v: 2
  },

  // SOCIAL - Connection (8 signals)
  {
    id: 'connector',
    name: 'Connector',
    description: `Introduces people who should know each other`,
    category: 'social',
    subcategory: 'connection',
    number: 51,
    icon: '🔗',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person has a gift for seeing potential connections others miss. They love introducing people who could help each other, creating value through building their network.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing connection excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['networking', 'connection', 'generosity'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing connection excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['listening', 'attention', 'presence'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing connection excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['celebration', 'recognition', 'positivity'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing connection excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['inclusion', 'welcoming', 'kindness'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing connection excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['storytelling', 'connection', 'vulnerability'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing connection excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['humor', 'joy', 'positivity'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing connection excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['memory', 'attentiveness', 'care'],
    v: 2
  },
  {
    id: 'space-holder',
    name: 'Space Holder',
    description: `Creates safe space for vulnerability and honesty`,
    category: 'social',
    subcategory: 'connection',
    number: 58,
    icon: '🕊️',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `Not everyone feels safe being vulnerable. This person creates conditions where people can share honestly, holds confidence sacred, and responds to vulnerability with compassion not judgment.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing connection excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['safety', 'vulnerability', 'trust'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing energy excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['positivity', 'optimism', 'energy'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing energy excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['calm', 'composure', 'groundedness'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing energy excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['motivation', 'energy', 'action'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing energy excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['planning', 'organization', 'hospitality'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing energy excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['creativity', 'innovation', 'ideation'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing energy excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['momentum', 'execution', 'action'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing energy excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['atmosphere', 'curation', 'environment'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing energy excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['curiosity', 'questions', 'depth'],
    v: 2
  },

  // CIVIC - Community-Service (6 signals)
  {
    id: 'community-organizer',
    name: 'Community Organizer',
    description: `Mobilizes neighbors and resources to address local needs`,
    category: 'civic',
    subcategory: 'community-service',
    number: 67,
    icon: '📢',
    isActive: true,
    trustValue: 0.5,
    extendedDescription: `Real change starts locally. This person brings neighbors together, identifies shared needs, mobilizes resources, and creates the conditions for communities to solve their own problems.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing community-service excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['organizing', 'community', 'leadership'],
    v: 2
  },
  {
    id: 'volunteer-champion',
    name: 'Volunteer Champion',
    description: `Gives time consistently to serve others`,
    category: 'civic',
    subcategory: 'community-service',
    number: 68,
    icon: '🙋',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person doesn't just talk about helping - they show up. They volunteer regularly at local organizations, give their time generously, and inspire others to serve through their example.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing community-service excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['volunteering', 'service', 'dedication'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing community-service excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['fundraising', 'development', 'resources'],
    v: 2
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: `Guides youth or newcomers with patience and care`,
    category: 'civic',
    subcategory: 'community-service',
    number: 70,
    icon: '🌟',
    isActive: true,
    trustValue: 0.4,
    extendedDescription: `This person invests in the next generation. They mentor young people or newcomers patiently, share hard-won wisdom generously, and celebrate their mentees' growth and success.`,
    rarity: 'Rare',
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing community-service excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['mentoring', 'youth', 'guidance'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing community-service excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['neighborliness', 'helping', 'community'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing community-service excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['events', 'community-building', 'organizing'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing civic-participation excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['voting', 'democracy', 'participation'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing civic-participation excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['education', 'civics', 'empowerment'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing civic-participation excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['advocacy', 'public-comment', 'engagement'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing civic-participation excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['campaigns', 'volunteering', 'advocacy'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing civic-participation excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['governance', 'leadership', 'nonprofit'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing civic-participation excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['attendance', 'engagement', 'accountability'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing environmental excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['sustainability', 'environment', 'leadership'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing environmental excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['stewardship', 'parks', 'maintenance'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing environmental excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['recycling', 'education', 'waste-reduction'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing environmental excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['gardening', 'community', 'food-security'],
    v: 2
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
    stats: {'popularity': 75, 'impact': 80, 'authenticity': 85, 'difficulty': 65},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Common signal representing environmental excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['transit', 'advocacy', 'sustainability'],
    v: 2
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
    stats: {'popularity': 80, 'impact': 88, 'authenticity': 88, 'difficulty': 75},
    traits: {
      personality: [],
      skills: [],
      environment: []
    },
    backstory: `Generated from v2 curated catalog - Rare signal representing environmental excellence.`,
    tips: [
      'Use this recognition to acknowledge genuine contributions',
      'Share specific examples when giving this signal',
      'Build trust through consistent recognition of this behavior'
    ],
    tags: ['conservation', 'ecology', 'protection'],
    v: 2
  },
]

export default recognitionSignals
