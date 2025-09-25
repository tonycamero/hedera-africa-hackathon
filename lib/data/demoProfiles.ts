// Rich demo profiles for TrustMesh showcasing realistic social/professional networks
// These profiles represent a diverse university/startup ecosystem

export interface DemoProfile {
  id: string
  handle: string
  displayName: string
  bio: string
  avatar?: string
  category: 'student' | 'faculty' | 'entrepreneur' | 'developer' | 'researcher'
  backstory: string
  recognitionStyle: string[] // What types of recognition they typically earn
  trustPersonality: 'conservative' | 'generous' | 'selective' | 'strategic'
  connections: {
    established: string[] // Already bonded contacts
    pending_out: string[] // Sent requests waiting for response
    pending_in: string[] // Received requests they haven't responded to
  }
  trustAllocated: { [contactId: string]: number } // Who they've allocated trust to
}

// Base demo profiles representing a university startup incubator ecosystem
export const demoProfiles: DemoProfile[] = [
  {
    id: 'tm-alex-chen',
    handle: '@alex.chen',
    displayName: 'Alex Chen',
    bio: 'CS Senior • React & Blockchain • Coffee enthusiast ☕',
    category: 'student',
    backstory: 'Senior computer science student specializing in distributed systems. Known for clean code, helpful code reviews, and organizing study groups. Currently working on a blockchain capstone project.',
    recognitionStyle: ['professional', 'academic'],
    trustPersonality: 'generous',
    connections: {
      established: ['tm-maya-patel', 'tm-jordan-kim', 'tm-sam-rivera'],
      pending_out: [],
      pending_in: []
    },
    trustAllocated: {
      'tm-maya-patel': 3,
      'tm-jordan-kim': 2,
      'tm-sam-rivera': 1
    }
  },
  {
    id: 'tm-maya-patel',
    handle: '@maya.patel',
    displayName: 'Dr. Maya Patel',
    bio: 'Associate Prof • HCI Research • Startup Advisor 🚀',
    category: 'faculty',
    backstory: 'Associate Professor of Human-Computer Interaction with 3 successful startup exits. Mentors student entrepreneurs and conducts research on trust in digital systems. Known for giving practical, actionable feedback.',
    recognitionStyle: ['professional', 'academic'],
    trustPersonality: 'selective',
    connections: {
      established: ['tm-alex-chen', 'tm-riley-santos', 'tm-casey-wright'],
      pending_out: ['tm-jordan-kim'],
      pending_in: []
    },
    trustAllocated: {
      'tm-alex-chen': 2,
      'tm-riley-santos': 3
    }
  },
  {
    id: 'tm-jordan-kim',
    handle: '@jordan.kim',
    displayName: 'Jordan Kim',
    bio: 'Design Lead • UX/UI • Figma wizard • Dog parent 🐕',
    category: 'entrepreneur',
    backstory: 'Freelance UX/UI designer who started their own design studio. Known for beautiful interfaces and user-centered thinking. Collaborates frequently with CS students on startup projects.',
    recognitionStyle: ['social', 'professional'],
    trustPersonality: 'strategic',
    connections: {
      established: ['tm-alex-chen', 'tm-sam-rivera'],
      pending_out: [],
      pending_in: ['tm-maya-patel']
    },
    trustAllocated: {
      'tm-alex-chen': 1,
      'tm-sam-rivera': 2
    }
  },
  {
    id: 'tm-sam-rivera',
    handle: '@sam.rivera',
    displayName: 'Sam Rivera',
    bio: 'Full Stack Dev • Open Source • Climbing enthusiast 🧗‍♂️',
    category: 'developer',
    backstory: 'Self-taught full-stack developer who contributes to major open source projects. Known for helping others debug code and explaining complex concepts clearly. Organizes local climbing meetups.',
    recognitionStyle: ['professional', 'social'],
    trustPersonality: 'generous',
    connections: {
      established: ['tm-alex-chen', 'tm-jordan-kim', 'tm-riley-santos'],
      pending_out: ['tm-casey-wright'],
      pending_in: []
    },
    trustAllocated: {
      'tm-alex-chen': 2,
      'tm-jordan-kim': 1
    }
  },
  {
    id: 'tm-riley-santos',
    handle: '@riley.santos',
    displayName: 'Riley Santos',
    bio: 'PhD Candidate • Machine Learning • Ethics Researcher 🤖',
    category: 'researcher',
    backstory: 'PhD candidate researching AI ethics and fairness in machine learning systems. Published multiple papers and speaks at conferences. Known for rigorous research methodology and thoughtful analysis.',
    recognitionStyle: ['academic', 'professional'],
    trustPersonality: 'conservative',
    connections: {
      established: ['tm-maya-patel', 'tm-sam-rivera'],
      pending_out: [],
      pending_in: []
    },
    trustAllocated: {
      'tm-maya-patel': 3
    }
  },
  {
    id: 'tm-casey-wright',
    handle: '@casey.wright',
    displayName: 'Casey Wright',
    bio: 'Startup Founder • YC Alum • Building the future 🌟',
    category: 'entrepreneur',
    backstory: 'Serial entrepreneur and Y Combinator alumni. Founded two startups, one successful exit. Currently building a fintech platform. Known for networking skills and mentoring other founders.',
    recognitionStyle: ['professional', 'social'],
    trustPersonality: 'strategic',
    connections: {
      established: ['tm-maya-patel'],
      pending_out: [],
      pending_in: ['tm-sam-rivera']
    },
    trustAllocated: {
      'tm-maya-patel': 2
    }
  },
  {
    id: 'tm-taylor-brown',
    handle: '@taylor.brown',
    displayName: 'Taylor Brown',
    bio: 'DevOps Engineer • Kubernetes Expert • Home Cook 👨‍🍳',
    category: 'developer',
    backstory: 'Senior DevOps engineer with expertise in cloud infrastructure and container orchestration. Known for reliable systems and clear documentation. Shares cooking recipes as much as deployment scripts.',
    recognitionStyle: ['professional'],
    trustPersonality: 'conservative',
    connections: {
      established: [],
      pending_out: [],
      pending_in: []
    },
    trustAllocated: {}
  },
  {
    id: 'tm-avery-davis',
    handle: '@avery.davis',
    displayName: 'Avery Davis',
    bio: 'Product Manager • Ex-Google • Meditation Teacher 🧘‍♀️',
    category: 'entrepreneur',
    backstory: 'Former Google PM who left to join an early-stage startup. Known for data-driven decisions and user empathy. Teaches meditation workshops and brings mindfulness practices to tech teams.',
    recognitionStyle: ['professional', 'social'],
    trustPersonality: 'selective',
    connections: {
      established: [],
      pending_out: [],
      pending_in: []
    },
    trustAllocated: {}
  }
]

// Recognition distribution patterns based on profiles
export const demoRecognitionDistribution = [
  // Alex gets recognition for being helpful and technical
  { profileId: 'tm-alex-chen', recognitionIds: ['prof-fav', 'code-monkey', 'note-taker'] },
  
  // Maya gets professional and academic recognition as faculty
  { profileId: 'tm-maya-patel', recognitionIds: ['powerpoint-pro', 'chad', 'prof-fav'] },
  
  // Jordan gets social and creative recognition as designer
  { profileId: 'tm-jordan-kim', recognitionIds: ['rizz', 'skibidi', 'chad'] },
  
  // Sam gets technical and social recognition as helpful developer
  { profileId: 'tm-sam-rivera', recognitionIds: ['code-monkey', 'chad', 'bookworm'] },
  
  // Riley gets academic recognition as PhD student
  { profileId: 'tm-riley-santos', recognitionIds: ['bookworm', 'note-taker', 'prof-fav'] },
  
  // Casey gets professional recognition as entrepreneur
  { profileId: 'tm-casey-wright', recognitionIds: ['powerpoint-pro', 'chad', 'rizz'] }
]

// Get profile by ID
export function getDemoProfile(id: string): DemoProfile | undefined {
  return demoProfiles.find(profile => profile.id === id)
}

// Get all profiles except the given one (for showing potential contacts)
export function getOtherProfiles(excludeId: string): DemoProfile[] {
  return demoProfiles.filter(profile => profile.id !== excludeId)
}

// Get profiles by category
export function getProfilesByCategory(category: DemoProfile['category']): DemoProfile[] {
  return demoProfiles.filter(profile => profile.category === category)
}