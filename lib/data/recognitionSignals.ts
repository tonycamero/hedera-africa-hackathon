export type SignalCategory = 'social' | 'academic' | 'professional'

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
  { id: 'delulu', name: 'Delulu', description: 'delicious confidence', category: 'social', number: 4, icon: '🤡', isActive: true },
  { id: 'rizz', name: 'Rizz', description: 'smooth operator', category: 'social', number: 5, icon: '🧠', isActive: true },
  { id: 'brain-rot', name: 'Brain Rot', description: 'too much prime time', category: 'social', number: 6, icon: '🧠', isActive: true },
  { id: 'gyatt', name: 'Gyatt', description: 'respectfully looking', category: 'social', number: 7, icon: '❤️', isActive: true },
  { id: 'aura', name: 'Aura', description: 'positive energy', category: 'social', number: 8, icon: '😊', isActive: true },
  { id: 'npc', name: 'NPC', description: 'background character energy', category: 'social', number: 9, icon: '🤓', isActive: true },
  { id: 'tryhard', name: 'Tryhard', description: 'overly serious', category: 'social', number: 10, icon: '🎯', isActive: true },
  { id: 'goat', name: 'GOAT', description: 'greatest of all time', category: 'social', number: 11, icon: '😊', isActive: true },
  { id: 'melt', name: 'Melt', description: 'awkward but funny', category: 'social', number: 12, icon: '👻', isActive: true },
  { id: 'ghost', name: 'Ghost', description: 'disappears often', category: 'social', number: 13, icon: '👻', isActive: true },
  { id: 'lowkey', name: 'Lowkey', description: 'subtle quiet flex', category: 'social', number: 14, icon: '🚀', isActive: true },
  { id: 'wagmi', name: 'WAGMI', description: 'crypto hype', category: 'social', number: 15, icon: '🤓', isActive: true },
  { id: 'ice', name: 'Ice', description: 'too cool', category: 'social', number: 16, icon: '🦢', isActive: true },

  // 🎓 ACADEMIC SIGNALS (Purple borders)
  { id: 'prof-fav', name: 'Prof Fav', description: "teacher's pet, always cared on", category: 'academic', number: 1, icon: '🏆', isActive: true },
  { id: 'note-taker', name: 'Note Taker', description: 'clean notes, everyone copies', category: 'academic', number: 2, icon: '✏️', isActive: true },
  { id: 'bookworm', name: 'Bookworm', description: 'lives in the library', category: 'academic', number: 3, icon: '📖', isActive: true },
  { id: 'lab-rat', name: 'Lab Rat', description: 'always in the science lab', category: 'academic', number: 4, icon: '🧪', isActive: true },
  { id: 'deadline-dancer', name: 'Deadline Dancer', description: 'submits last minute', category: 'academic', number: 5, icon: '⏰', isActive: true },
  { id: 'grad-grind', name: 'Grad Grind', description: 'obsessed with GPA', category: 'academic', number: 6, icon: '🎯', isActive: true },
  { id: 'flashcard-flox', name: 'Flashcard Flox', description: 'carries study decks everywhere', category: 'academic', number: 7, icon: '📄', isActive: true },
  { id: 'lecture-sleeper', name: 'Lecture Sleeper', description: 'always nodding off', category: 'academic', number: 8, icon: '🛌', isActive: true },
  { id: 'question-king', name: 'Question King', description: 'asks too many', category: 'academic', number: 9, icon: '🔨', isActive: true },
  { id: 'group-glue', name: 'Group Glue', description: 'keeps projects together', category: 'academic', number: 10, icon: '💛', isActive: true },
  { id: 'exam-sniper', name: 'Exam Sniper', description: 'crushes tests, silent otherwise', category: 'academic', number: 11, icon: '🎯', isActive: true },
  { id: 'slow-burner', name: 'Slow Burner', description: 'starts slow, finishes strong', category: 'academic', number: 12, icon: '🌱', isActive: true },
  { id: 'early-bird', name: 'Early Bird', description: 'first to class every time', category: 'academic', number: 13, icon: '🚨', isActive: true },
  { id: 'stats-nerd', name: 'Stats Nerd', description: 'makes everything a graph', category: 'academic', number: 14, icon: '📊', isActive: true },
  { id: 'problem-solver', name: 'Problem Solver', description: 'finds hacks for tricky work', category: 'academic', number: 15, icon: '❌', isActive: true },
  { id: 'idea-machine', name: 'Idea Machine', description: 'brainstorming genius', category: 'academic', number: 16, icon: '💡', isActive: true },
  { id: 'project-picasso', name: 'Project Picasso', description: 'makes slides beautiful', category: 'academic', number: 17, icon: '🎨', isActive: true },
  { id: 'background-dj', name: 'Background DJ', description: 'creates best study sessions', category: 'academic', number: 18, icon: '🎵', isActive: true },
  { id: 'wellness-guru-2', name: 'Wellness Guru', description: 'morning yoga always', category: 'academic', number: 19, icon: '🧘', isActive: true },
  { id: 'training-junkie-2', name: 'Training Junkie', description: 'loves learning new skills', category: 'academic', number: 20, icon: '📚', isActive: true },

  // 💼 PROFESSIONAL SIGNALS (Blue borders)
  { id: 'powerpoint-pro', name: 'PowerPoint Pro', description: 'biggest slides in the room', category: 'professional', number: 1, icon: '📊', isActive: true },
  { id: 'suit-up', name: 'Suit Up', description: 'overdressed for everything', category: 'professional', number: 2, icon: '💼', isActive: true },
  { id: 'meeting-hog', name: 'Meeting Hog', description: 'talks too much in meetings', category: 'professional', number: 3, icon: '👽', isActive: true },
  { id: 'silent-operator', name: 'Silent Operator', description: 'works hard, unnoticed', category: 'professional', number: 4, icon: '👀', isActive: true },
  { id: 'inbox-zero', name: 'Inbox Zero', description: 'replies instantly, always', category: 'professional', number: 5, icon: '📧', isActive: true },
  { id: 'deadline-dodger', name: 'Deadline Dodger', description: 'always almost done', category: 'professional', number: 6, icon: '⏰', isActive: true },
  { id: 'code-monkey', name: 'Code Monkey', description: 'nonstop coder', category: 'professional', number: 7, icon: '👨‍💻', isActive: true },
  { id: 'data-whisperer', name: 'Data Whisperer', description: 'always has chart ready', category: 'professional', number: 8, icon: '📊', isActive: true },
  { id: 'office-macgyver', name: 'Office MacGyver', description: 'fixes everything with random tools', category: 'professional', number: 9, icon: '🔧', isActive: true },
  { id: 'linkedin-star', name: 'LinkedIn Star', description: 'posts daily, corporate jargon', category: 'professional', number: 10, icon: '🌐', isActive: true },
  { id: 'coffee-iv', name: 'Coffee IV', description: 'lives on caffeine', category: 'professional', number: 11, icon: '☕', isActive: true },
  { id: 'slack-phantom', name: 'Slack Phantom', description: 'online but never responds', category: 'professional', number: 12, icon: '👻', isActive: true },
  { id: 'wellness-guru', name: 'Wellness Guru', description: 'morning yoga always hydrated', category: 'professional', number: 13, icon: '🧘', isActive: true },
  { id: 'task-crusher', name: 'Task Crusher', description: 'knocks out to-do list daily', category: 'professional', number: 14, icon: '🎯', isActive: true },
  { id: 'night-owl', name: 'Night Owl', description: 'always working 2 AM', category: 'professional', number: 15, icon: '🦉', isActive: true },
  { id: 'startup-energy', name: 'Startup Energy', description: 'hustles nonstop constantly', category: 'professional', number: 16, icon: '🚀', isActive: true },
  { id: 'budget-boss', name: 'Budget Boss', description: 'knows where every cent goes', category: 'professional', number: 17, icon: '💰', isActive: true },
  { id: 'training-junkie', name: 'Training Junkie', description: 'loves learning new skills', category: 'professional', number: 18, icon: '📚', isActive: true },
  { id: 'innovation-engine', name: 'Innovation Engine', description: 'always has new ideas', category: 'professional', number: 19, icon: '💡', isActive: true },
  { id: 'network-ninja', name: 'Network Ninja', description: 'knows everyone everywhere', category: 'professional', number: 20, icon: '🕸️', isActive: true }
]

export const getSignalsByCategory = (category: SignalCategory) => 
  recognitionSignals.filter(signal => signal.category === category)

export const getSignalCounts = () => ({
  social: getSignalsByCategory('social').length,
  academic: getSignalsByCategory('academic').length,
  professional: getSignalsByCategory('professional').length
})