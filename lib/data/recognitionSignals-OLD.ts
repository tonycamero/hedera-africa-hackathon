export type SignalCategory = 'social' | 'academic' | 'professional' | 'civic'

export interface RecognitionSignal {
  id: string
  name: string
  description: string
  category: SignalCategory
  number: number
  icon: string
  isActive: boolean
  // Rich metadata for detailed view
  extendedDescription: string
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'
  stats: {
    popularity: number // 1-100
    impact: number // 1-100  
    authenticity: number // 1-100
    difficulty: number // 1-100
  }
  traits: {
    personality: string[]
    skills: string[]
    environment: string[]
  }
  relatedLinks: {
    name: string
    url: string
    type: 'article' | 'meme' | 'guide' | 'reference'
  }[]
  backstory: string
  tips: string[]
}

export const recognitionSignals: RecognitionSignal[] = [
  // 🔥 SOCIAL SIGNALS (Cyan borders)
  { 
    id: 'skibidi', 
    name: 'Skibidi', 
    description: 'chaotic energy', 
    category: 'social', 
    number: 1, 
    icon: '🤪', 
    isActive: true,
    extendedDescription: 'The ultimate embodiment of Gen Z chaos energy. This person brings unpredictable, manic enthusiasm to every interaction. They\'re the friend who suggests the most random adventures and somehow makes them legendary.',
    rarity: 'Epic',
    stats: {
      popularity: 95,
      impact: 88,
      authenticity: 92,
      difficulty: 75
    },
    traits: {
      personality: ['Unpredictable', 'Energetic', 'Creative', 'Bold'],
      skills: ['Social Media Mastery', 'Trend Creation', 'Comedy Timing', 'Risk Taking'],
      environment: ['TikTok', 'Discord', 'IRL Hangouts', 'Gaming']
    },
    relatedLinks: [
      { name: 'What is Skibidi Toilet?', url: '#', type: 'reference' },
      { name: 'Gen Z Slang Dictionary', url: '#', type: 'guide' },
      { name: 'Ohio Energy Compilation', url: '#', type: 'meme' }
    ],
    backstory: 'Born from the viral Skibidi Toilet phenomenon, this archetype represents the peak of Gen Z\'s ability to create meaning from absurdity. They turn random moments into core memories.',
    tips: [
      'Embrace the chaos - your unpredictability is your superpower',
      'Not everyone will get your humor, and that\'s totally fine',
      'Channel your energy into creative projects',
      'Remember to take breaks from being "on" all the time'
    ]
  },
  { 
    id: 'chad', 
    name: 'Chad', 
    description: 'alpha vibes', 
    category: 'social', 
    number: 2, 
    icon: '🦆', 
    isActive: true,
    extendedDescription: 'The confident leader who walks into any room and immediately commands respect. Not through arrogance, but through genuine self-assurance and the ability to make others feel included in their success.',
    rarity: 'Legendary',
    stats: {
      popularity: 90,
      impact: 95,
      authenticity: 85,
      difficulty: 80
    },
    traits: {
      personality: ['Confident', 'Leader', 'Charismatic', 'Supportive'],
      skills: ['Natural Leadership', 'Motivation', 'Physical Fitness', 'Social Dynamics'],
      environment: ['Gym', 'Sports Teams', 'Parties', 'Leadership Roles']
    },
    relatedLinks: [
      { name: 'Chad Meme Origins', url: '#', type: 'reference' },
      { name: 'Sigma Male Mindset', url: '#', type: 'guide' },
      { name: 'Virgin vs Chad Meme', url: '#', type: 'meme' }
    ],
    backstory: 'Evolved from internet meme culture, the Chad represents positive masculinity and authentic confidence. They lift others up while pursuing their own excellence.',
    tips: [
      'True strength comes from helping others succeed',
      'Confidence is attractive, arrogance is not',
      'Lead by example, not by authority',
      'Stay humble despite your achievements'
    ]
  },
  { 
    id: 'savage', 
    name: 'Savage', 
    description: 'no mercy', 
    category: 'social', 
    number: 3, 
    icon: '🔥', 
    isActive: true,
    extendedDescription: 'The person who delivers the perfect comeback at exactly the right moment. They have zero tolerance for BS and aren\'t afraid to call people out, but they do it with style and usually with a smile.',
    rarity: 'Rare',
    stats: {
      popularity: 85,
      impact: 92,
      authenticity: 95,
      difficulty: 70
    },
    traits: {
      personality: ['Direct', 'Witty', 'Fearless', 'Honest'],
      skills: ['Quick Wit', 'Roasting', 'Boundary Setting', 'Humor'],
      environment: ['Twitter', 'Group Chats', 'Debates', 'Comedy Shows']
    },
    relatedLinks: [
      { name: 'Art of the Comeback', url: '#', type: 'guide' },
      { name: 'Best Roasts Compilation', url: '#', type: 'meme' },
      { name: 'Savage Mode Playlist', url: '#', type: 'reference' }
    ],
    backstory: 'Born from the need to defend friends and call out injustice with humor. The Savage has mastered the art of truth-telling without being cruel.',
    tips: [
      'Timing is everything - wait for the perfect moment',
      'Punch up, not down - target those who can handle it',
      'Your words have power, use them wisely',
      'Balance savagery with kindness in your daily life'
    ]
  },
  { 
    id: 'delulu', 
    name: 'Delulu', 
    description: 'delicious confidence', 
    category: 'social', 
    number: 4, 
    icon: '🤡', 
    isActive: true,
    extendedDescription: 'The eternal optimist who manifests their dreams into reality through sheer belief. Like a Lagos entrepreneur who starts with nothing but ends up running the biggest tech hub in West Africa.',
    rarity: 'Rare',
    stats: {
      popularity: 88,
      impact: 85,
      authenticity: 90,
      difficulty: 60
    },
    traits: {
      personality: ['Optimistic', 'Persistent', 'Visionary', 'Confident'],
      skills: ['Manifestation', 'Positive Thinking', 'Risk Taking', 'Motivation'],
      environment: ['Startup Hubs', 'Social Media', 'Entrepreneurship Events', 'Community Gatherings']
    },
    relatedLinks: [
      { name: 'African Success Stories', url: '#', type: 'article' },
      { name: 'Ubuntu Philosophy Guide', url: '#', type: 'reference' },
      { name: 'Delulu is the Solulu Memes', url: '#', type: 'meme' }
    ],
    backstory: 'Born from African Ubuntu philosophy - "I am because we are" - this archetype believes that positive energy and community support can overcome any obstacle.',
    tips: [
      'Your dreams are valid - keep believing in them',
      'Find your community that supports your vision',
      'Balance optimism with practical planning',
      'Use your confidence to inspire others'
    ]
  },
  { 
    id: 'rizz', 
    name: 'Rizz', 
    description: 'smooth operator', 
    category: 'social', 
    number: 5, 
    icon: '🧠', 
    isActive: true,
    extendedDescription: 'The master of effortless charm who can talk to literally anyone. They slide into conversations like butter and make everyone feel like they\'re the most interesting person in the room.',
    rarity: 'Epic',
    stats: {
      popularity: 92,
      impact: 88,
      authenticity: 85,
      difficulty: 85
    },
    traits: {
      personality: ['Charismatic', 'Smooth', 'Confident', 'Socially Aware'],
      skills: ['Conversation Mastery', 'Body Language Reading', 'Emotional Intelligence', 'Storytelling'],
      environment: ['Parties', 'Dating Apps', 'Networking Events', 'Coffee Shops']
    },
    relatedLinks: [
      { name: 'The Art of Rizz', url: '#', type: 'guide' },
      { name: 'Smooth Operator Compilation', url: '#', type: 'meme' },
      { name: 'Rizz or Miss TikToks', url: '#', type: 'reference' }
    ],
    backstory: 'Evolved from the need to connect authentically in the digital age. True rizz isn\'t about pick-up lines - it\'s about genuine interest in others.',
    tips: [
      'Listen more than you talk',
      'Be genuinely interested in others',
      'Confidence is attractive, desperation is not',
      'Practice makes perfect - start with low-stakes conversations'
    ]
  },
  { 
    id: 'brain-rot', 
    name: 'Brain Rot', 
    description: 'too much prime time', 
    category: 'social', 
    number: 6, 
    icon: '🧠', 
    isActive: true,
    extendedDescription: 'The person who\'s so terminally online they speak in TikTok references and can\'t function without constant digital stimulation. Somehow still endearing.',
    rarity: 'Common',
    stats: { popularity: 75, impact: 60, authenticity: 95, difficulty: 30 },
    traits: {
      personality: ['Extremely Online', 'Meme-Fluent', 'Attention-Seeking', 'Entertaining'],
      skills: ['Meme Knowledge', 'Content Creation', 'Trend Spotting', 'Digital Native'],
      environment: ['TikTok', 'Twitter', 'Discord', 'Streaming Platforms']
    },
    relatedLinks: [{ name: 'Brain Rot Compilation', url: '#', type: 'meme' }],
    backstory: 'Born from the intersection of digital nativity and dopamine addiction.',
    tips: ['Touch grass occasionally', 'Remember real-world conversations exist']
  },
  { 
    id: 'gyatt', 
    name: 'Gyatt', 
    description: 'respectfully looking', 
    category: 'social', 
    number: 7, 
    icon: '❤️', 
    isActive: true,
    extendedDescription: 'The appreciator of beauty who always notices when someone\'s glowed up. Respectful but enthusiastic about complimenting others.',
    rarity: 'Common',
    stats: { popularity: 80, impact: 70, authenticity: 85, difficulty: 40 },
    traits: {
      personality: ['Appreciative', 'Respectful', 'Observant', 'Positive'],
      skills: ['Compliment Giving', 'Aesthetic Appreciation', 'Social Awareness', 'Hype Person'],
      environment: ['Instagram', 'Fashion Events', 'Gym', 'Social Gatherings']
    },
    relatedLinks: [{ name: 'Respectful Appreciation Guide', url: '#', type: 'guide' }],
    backstory: 'Evolved from the need to appreciate beauty while maintaining respect and boundaries.',
    tips: ['Compliments should lift people up', 'Respect boundaries always']
  },
  { 
    id: 'aura', 
    name: 'Aura', 
    description: 'positive energy', 
    category: 'social', 
    number: 8, 
    icon: '😊', 
    isActive: true,
    extendedDescription: 'The person who radiates good vibes wherever they go. Their presence alone makes situations better and people happier.',
    rarity: 'Rare',
    stats: { popularity: 90, impact: 95, authenticity: 90, difficulty: 70 },
    traits: {
      personality: ['Positive', 'Magnetic', 'Uplifting', 'Authentic'],
      skills: ['Energy Management', 'Mood Lifting', 'Presence', 'Emotional Contagion'],
      environment: ['Everywhere', 'Group Settings', 'Difficult Situations', 'Celebrations']
    },
    relatedLinks: [{ name: 'Building Your Aura', url: '#', type: 'guide' }],
    backstory: 'Some people are just built different - they carry light with them.',
    tips: ['Your energy affects others', 'Authenticity is key to true aura']
  },
  { 
    id: 'npc', 
    name: 'NPC', 
    description: 'background character energy', 
    category: 'social', 
    number: 9, 
    icon: '🤓', 
    isActive: true,
    extendedDescription: 'The person who blends into the background but keeps everything running smoothly. Often underestimated but secretly essential.',
    rarity: 'Common',
    stats: { popularity: 50, impact: 75, authenticity: 80, difficulty: 20 },
    traits: {
      personality: ['Reliable', 'Quiet', 'Supportive', 'Consistent'],
      skills: ['Background Support', 'Consistency', 'Reliability', 'Observation'],
      environment: ['Behind the Scenes', 'Support Roles', 'Quiet Spaces', 'Teams']
    },
    relatedLinks: [{ name: 'Introvert Appreciation', url: '#', type: 'article' }],
    backstory: 'Not everyone needs to be the main character - supporting roles are vital too.',
    tips: ['Your contributions matter even if unseen', 'Quiet strength is still strength']
  },
  // Continue with remaining social tokens...
  { id: 'ubuntu-spirit', name: 'Ubuntu Spirit', description: 'I am because we are', category: 'social', number: 17, icon: '🌍', isActive: true,
    extendedDescription: 'Embodies the African philosophy of Ubuntu - understanding that individual well-being is connected to the well-being of the community.',
    rarity: 'Legendary', stats: { popularity: 85, impact: 95, authenticity: 100, difficulty: 90 },
    traits: { personality: ['Community-Minded', 'Empathetic', 'Wise', 'Connected'], skills: ['Community Building', 'Conflict Resolution', 'Cultural Bridge Building', 'Collective Leadership'], environment: ['Community Centers', 'Cultural Events', 'Family Gatherings', 'Traditional Ceremonies'] },
    relatedLinks: [{ name: 'Ubuntu Philosophy Explained', url: '#', type: 'reference' }],
    backstory: 'Rooted in ancient African wisdom that recognizes the interconnectedness of all humanity.',
    tips: ['Lift others as you climb', 'Your success is tied to your community\'s success'] },
  { id: 'griot-keeper', name: 'Griot Keeper', description: 'storyteller of the people', category: 'social', number: 18, icon: '📿', isActive: true,
    extendedDescription: 'The keeper of stories, histories, and cultural wisdom. Like the West African griots, they preserve and share the community\'s collective memory.',
    rarity: 'Epic', stats: { popularity: 80, impact: 90, authenticity: 95, difficulty: 80 },
    traits: { personality: ['Wise', 'Eloquent', 'Culturally Connected', 'Respected'], skills: ['Storytelling', 'History Keeping', 'Oral Tradition', 'Cultural Preservation'], environment: ['Cultural Centers', 'Elder Councils', 'Educational Institutions', 'Community Gatherings'] },
    relatedLinks: [{ name: 'West African Griot Tradition', url: '#', type: 'article' }],
    backstory: 'Carries forward the ancient tradition of griots who were the living libraries of their communities.',
    tips: ['Every elder has wisdom to share', 'Stories connect us across generations'] },

  // 🎓 ACADEMIC SIGNALS (Purple borders)
  { 
    id: 'prof-fav', 
    name: 'Prof Fav', 
    description: "teacher's pet, always cared on", 
    category: 'academic', 
    number: 1, 
    icon: '🏆', 
    isActive: true,
    extendedDescription: 'The student who somehow became the professor\'s unofficial TA without getting paid. They sit in the front row and actually read the assigned readings.',
    rarity: 'Common',
    stats: { popularity: 60, impact: 80, authenticity: 75, difficulty: 50 },
    traits: {
      personality: ['Eager', 'Responsible', 'Organized', 'Dedicated'],
      skills: ['Academic Excellence', 'Teacher Relations', 'Study Organization', 'Participation'],
      environment: ['Front Row', 'Office Hours', 'Study Groups', 'Academic Events']
    },
    relatedLinks: [{ name: 'How to Build Prof Relationships', url: '#', type: 'guide' }],
    backstory: 'Started participating actively in class and never looked back.',
    tips: ['Genuine interest beats brown-nosing', 'Help other students too']
  },
  { 
    id: 'makerere-scholar', 
    name: 'Makerere Scholar', 
    description: 'academic excellence with Ubuntu wisdom', 
    category: 'academic', 
    number: 21, 
    icon: '🎓', 
    isActive: true,
    extendedDescription: 'Combines rigorous academic pursuit with deep cultural wisdom, like the scholars at Uganda\'s Makerere University who shaped African intellectual thought.',
    rarity: 'Epic',
    stats: { popularity: 85, impact: 95, authenticity: 90, difficulty: 85 },
    traits: {
      personality: ['Intellectually Curious', 'Culturally Grounded', 'Thoughtful', 'Inspiring'],
      skills: ['Critical Thinking', 'Cultural Integration', 'Research Excellence', 'Mentorship'],
      environment: ['Universities', 'Research Centers', 'Cultural Institutes', 'Libraries']
    },
    relatedLinks: [{ name: 'African Universities Legacy', url: '#', type: 'article' }],
    backstory: 'Represents the proud tradition of African scholarship and intellectual leadership.',
    tips: ['Knowledge serves the community', 'Blend traditional wisdom with modern learning']
  },
  { 
    id: 'timbuktu-librarian', 
    name: 'Timbuktu Librarian', 
    description: 'keeper of ancient knowledge', 
    category: 'academic', 
    number: 22, 
    icon: '📜', 
    isActive: true,
    extendedDescription: 'Protects and preserves knowledge like the manuscript keepers of ancient Timbuktu, understanding that information is power and heritage.',
    rarity: 'Legendary',
    stats: { popularity: 75, impact: 100, authenticity: 100, difficulty: 95 },
    traits: {
      personality: ['Protective', 'Wise', 'Patient', 'Dedicated'],
      skills: ['Knowledge Preservation', 'Research', 'Cultural Conservation', 'Teaching'],
      environment: ['Libraries', 'Archives', 'Museums', 'Universities']
    },
    relatedLinks: [{ name: 'Timbuktu Manuscripts', url: '#', type: 'reference' }],
    backstory: 'Carries the legacy of Timbuktu\'s golden age when it was the Harvard of Africa.',
    tips: ['Preserve knowledge for future generations', 'Every book saved is a culture preserved']
  },

  // 💼 PROFESSIONAL SIGNALS (Blue borders)
  { 
    id: 'powerpoint-pro', 
    name: 'PowerPoint Pro', 
    description: 'biggest slides in the room', 
    category: 'professional', 
    number: 1, 
    icon: '📊', 
    isActive: true,
    extendedDescription: 'The presentation wizard who turns boring data into visual masterpieces. Their slides are so good, people actually pay attention during meetings.',
    rarity: 'Rare',
    stats: { popularity: 85, impact: 90, authenticity: 70, difficulty: 75 },
    traits: {
      personality: ['Detail-Oriented', 'Creative', 'Professional', 'Communicative'],
      skills: ['Design', 'Data Visualization', 'Storytelling', 'Software Mastery'],
      environment: ['Meeting Rooms', 'Conferences', 'Client Presentations', 'Corporate Settings']
    },
    relatedLinks: [{ name: 'PowerPoint Design Guide', url: '#', type: 'guide' }],
    backstory: 'Turned necessity into artform when forced to make presentations engaging.',
    tips: ['Less text, more visuals', 'Tell a story with your data']
  },
  // Africa-themed Professional Tokens
  { 
    id: 'balogun-trader', 
    name: 'Balogun Trader', 
    description: 'Lagos market negotiation master', 
    category: 'professional', 
    number: 21, 
    icon: '🏦', 
    isActive: true,
    extendedDescription: 'Masters the art of negotiation and relationship building like the legendary traders of Lagos\'s Balogun Market. Can close any deal with charm and wisdom.',
    rarity: 'Epic',
    stats: { popularity: 90, impact: 95, authenticity: 95, difficulty: 80 },
    traits: {
      personality: ['Persuasive', 'Relationship-Focused', 'Strategic', 'Culturally Aware'],
      skills: ['Negotiation', 'Market Analysis', 'Cultural Intelligence', 'Network Building'],
      environment: ['Markets', 'Trade Centers', 'Business Districts', 'Networking Events']
    },
    relatedLinks: [{ name: 'West African Trading Culture', url: '#', type: 'article' }],
    backstory: 'Learned business from the masters at Africa\'s most vibrant commercial centers.',
    tips: ['Relationships before transactions', 'Every negotiation is a cultural exchange']
  },
  { 
    id: 'kigali-innovator', 
    name: 'Kigali Innovator', 
    description: 'Silicon Savannah tech pioneer', 
    category: 'professional', 
    number: 22, 
    icon: '📱', 
    isActive: true,
    extendedDescription: 'Embodies the innovation spirit of Rwanda\'s tech transformation, building solutions that serve African communities while competing globally.',
    rarity: 'Epic',
    stats: { popularity: 85, impact: 90, authenticity: 90, difficulty: 85 },
    traits: {
      personality: ['Innovative', 'Solution-Oriented', 'Resilient', 'Forward-Thinking'],
      skills: ['Technology Development', 'Product Innovation', 'Market Adaptation', 'Social Impact'],
      environment: ['Tech Hubs', 'Innovation Labs', 'Startup Incubators', 'Digital Conferences']
    },
    relatedLinks: [{ name: 'African Tech Renaissance', url: '#', type: 'article' }],
    backstory: 'Part of the generation transforming Africa through technology and innovation.',
    tips: ['Build for local needs first', 'Technology should serve humanity']
  },
  { 
    id: 'cooperative-leader', 
    name: 'Cooperative Leader', 
    description: 'Ubuntu business philosophy', 
    category: 'professional', 
    number: 23, 
    icon: '🤝', 
    isActive: true,
    extendedDescription: 'Applies Ubuntu principles to business leadership, understanding that collective success creates individual prosperity. Builds cooperative enterprises.',
    rarity: 'Legendary',
    stats: { popularity: 80, impact: 100, authenticity: 95, difficulty: 90 },
    traits: {
      personality: ['Collaborative', 'Ethical', 'Community-Focused', 'Visionary'],
      skills: ['Cooperative Management', 'Consensus Building', 'Ethical Leadership', 'Community Development'],
      environment: ['Cooperatives', 'Community Centers', 'Social Enterprises', 'Development Organizations']
    },
    relatedLinks: [{ name: 'Cooperative Business Models', url: '#', type: 'guide' }],
    backstory: 'Believes that business should uplift entire communities, not just individuals.',
    tips: ['Success is collective', 'Lead by serving others']
  },
]

export const getSignalsByCategory = (category: SignalCategory) => 
  recognitionSignals.filter(signal => signal.category === category)

export const getSignalCounts = () => ({
  social: getSignalsByCategory('social').length,
  academic: getSignalsByCategory('academic').length,
  professional: getSignalsByCategory('professional').length
})