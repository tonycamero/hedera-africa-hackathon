const fs = require('fs');
const crypto = require('crypto');

// Load base catalog
const base = JSON.parse(fs.readFileSync('scripts/out/catalog.v2-base.json', 'utf8'));

console.log(`\n📊 Base catalog has ${base.items.length} signals\n`);
console.log('🎯 Target: 60-70 overlays per cultural lens (70-80% coverage)\n');

// =====================================================================
// GenZ Overlays - Using Actual Base IDs
// =====================================================================

const genzOverlays = [
  // PROFESSIONAL - LEADERSHIP (8 signals)
  {
    base_id: 'strategic-visionary',
    name: 'Main Character Energy',
    description: 'Has that CEO mindset, sees the vision before it\'s obvious',
    icon: '🎯',
    tags: ['leadership', 'strategy', 'vision', 'based']
  },
  {
    base_id: 'team-catalyst',
    name: 'Hype Person',
    description: 'Makes everyone level up, brings the energy',
    icon: '⚡',
    tags: ['leadership', 'teamwork', 'energy', 'positive-vibes']
  },
  {
    base_id: 'decision-maker',
    name: 'No Cap Decision Maker',
    description: 'Makes the call when it matters, no hesitation',
    icon: '⚖️',
    tags: ['leadership', 'decision-making', 'clutch']
  },
  {
    base_id: 'culture-builder',
    name: 'Vibe Architect',
    description: 'Creates the energy everyone wants to be around',
    icon: '🏛️',
    tags: ['leadership', 'culture', 'authentic', 'safe-space']
  },
  {
    base_id: 'change-champion',
    name: 'Plot Twist Navigator',
    description: 'Leads through change without the chaos',
    icon: '🔄',
    tags: ['leadership', 'change', 'empathy', 'real-talk']
  },
  {
    base_id: 'talent-developer',
    name: 'Glow Up Enabler',
    description: 'Helps people reach their final form',
    icon: '🌱',
    tags: ['leadership', 'mentorship', 'growth', 'support']
  },
  {
    base_id: 'servant-leader',
    name: 'For The Team',
    description: 'Leads by clearing the path, not blocking it',
    icon: '🤝',
    tags: ['leadership', 'support', 'humble', 'team-first']
  },
  {
    base_id: 'consensus-builder',
    name: 'Mediator',
    description: 'Gets everyone aligned without the drama',
    icon: '🤲',
    tags: ['leadership', 'mediation', 'alignment', 'communication']
  },

  // PROFESSIONAL - KNOWLEDGE (8 signals)
  {
    base_id: 'technical-expert',
    name: 'Tech Wizard',
    description: 'Just knows how it all works',
    icon: '🔧',
    tags: ['technical', 'expert', 'wizard', 'problem-solving']
  },
  {
    base_id: 'system-architect',
    name: 'Sees The Matrix',
    description: 'Understands how everything connects',
    icon: '🏗️',
    tags: ['systems', 'architecture', 'big-picture', 'design']
  },
  {
    base_id: 'data-analyst',
    name: 'Numbers Person',
    description: 'Makes the data tell the story',
    icon: '📊',
    tags: ['data', 'insights', 'analysis', 'evidence-based']
  },
  {
    base_id: 'domain-specialist',
    name: 'Subject Matter Boss',
    description: 'The one everyone asks about this topic',
    icon: '🎓',
    tags: ['expert', 'specialist', 'go-to-person', 'knowledge']
  },
  {
    base_id: 'research-pioneer',
    name: 'Lab Innovator',
    description: 'Pushes the boundaries of what we know',
    icon: '🔬',
    tags: ['research', 'innovation', 'discovery', 'pioneer']
  },
  {
    base_id: 'continuous-learner',
    name: 'Always Leveling Up',
    description: 'Never stops learning and growing',
    icon: '📚',
    tags: ['learning', 'growth', 'curiosity', 'self-improvement']
  },
  {
    base_id: 'quality-champion',
    name: 'High Standards',
    description: 'Won\'t settle for good enough',
    icon: '✨',
    tags: ['quality', 'excellence', 'standards', 'craft']
  },
  {
    base_id: 'knowledge-sharer',
    name: 'Drops Gems',
    description: 'Shares the knowledge freely, no gatekeeping',
    icon: '💎',
    tags: ['knowledge', 'teaching', 'generosity', 'open-source']
  },

  // PROFESSIONAL - EXECUTION (8 signals)
  {
    base_id: 'delivery-champion',
    name: 'Ships It',
    description: 'Gets things out the door, no matter what',
    icon: '🚀',
    tags: ['execution', 'delivery', 'shipping', 'results']
  },
  {
    base_id: 'revenue-driver',
    name: 'Money Moves',
    description: 'Makes the numbers go up',
    icon: '💰',
    tags: ['revenue', 'growth', 'business', 'impact']
  },
  {
    base_id: 'process-optimizer',
    name: 'Efficiency Hacker',
    description: 'Finds the shortcuts and optimizations',
    icon: '⚡',
    tags: ['efficiency', 'optimization', 'improvement', 'smart-work']
  },
  {
    base_id: 'customer-advocate',
    name: 'User Champion',
    description: 'Always thinking about the end user',
    icon: '🛡️',
    tags: ['customer', 'advocacy', 'user-focused', 'empathy']
  },
  {
    base_id: 'problem-solver',
    name: 'Debug Legend',
    description: 'Figures it out when everyone else is stuck',
    icon: '🔧',
    tags: ['problem-solving', 'persistence', 'resourceful', 'clutch']
  },
  {
    base_id: 'bridge-builder',
    name: 'Connector',
    description: 'Connects different worlds, speaks everyone\'s language',
    icon: '🌉',
    tags: ['collaboration', 'translation', 'connection', 'versatile']
  },
  {
    base_id: 'risk-manager',
    name: 'Safety Net',
    description: 'Spots the risks before they become problems',
    icon: '🛡️',
    tags: ['risk', 'foresight', 'protection', 'planning']
  },
  {
    base_id: 'sprint-champion',
    name: 'Sprint MVP',
    description: 'Carries the team through the sprint',
    icon: '🏃',
    tags: ['agile', 'sprint', 'execution', 'teamwork']
  },

  // PROFESSIONAL - SCHOLARSHIP (6 signals)
  {
    base_id: 'research-contributor',
    name: 'Research Grinder',
    description: 'Puts in the work to find the answers',
    icon: '📚',
    tags: ['research', 'diligence', 'scholarship', 'contribution']
  },
  {
    base_id: 'critical-thinker',
    name: 'Logic King/Queen',
    description: 'Questions everything, finds the flaws',
    icon: '🧠',
    tags: ['critical-thinking', 'logic', 'analysis', 'skeptical']
  },
  {
    base_id: 'thesis-champion',
    name: 'Thesis Beast',
    description: 'Crushes the long-term research project',
    icon: '📖',
    tags: ['thesis', 'research', 'commitment', 'endurance']
  },
  {
    base_id: 'academic-mentor',
    name: 'Study Buddy Sage',
    description: 'Guides others through the academic maze',
    icon: '🎓',
    tags: ['mentorship', 'academic', 'guidance', 'support']
  },
  {
    base_id: 'writing-excellence',
    name: 'Wordsmith',
    description: 'Writes things that people actually want to read',
    icon: '✍️',
    tags: ['writing', 'communication', 'clarity', 'craft']
  },
  {
    base_id: 'presentation-pro',
    name: 'Main Stage Energy',
    description: 'Commands attention when presenting',
    icon: '🎤',
    tags: ['presentation', 'confidence', 'engagement', 'performance']
  },

  // PROFESSIONAL - STUDY (6 signals)
  {
    base_id: 'study-group-leader',
    name: 'Study Squad Lead',
    description: 'Organizes the crew to get it done',
    icon: '👥',
    tags: ['leadership', 'study', 'organization', 'teamwork']
  },
  {
    base_id: 'note-taker',
    name: 'Notes Legend',
    description: 'Takes the notes everyone wants to copy',
    icon: '📝',
    tags: ['notes', 'organization', 'detail', 'sharing']
  },
  {
    base_id: 'exam-strategist',
    name: 'Test Tactician',
    description: 'Has the strategy to ace any exam',
    icon: '🎯',
    tags: ['exams', 'strategy', 'preparation', 'results']
  },
  {
    base_id: 'deadline-keeper',
    name: 'Deadline Beast',
    description: 'Always delivers on time, no excuses',
    icon: '⏰',
    tags: ['deadlines', 'reliability', 'commitment', 'execution']
  },
  {
    base_id: 'reading-champion',
    name: 'Reading Machine',
    description: 'Gets through the reading list like it\'s nothing',
    icon: '📚',
    tags: ['reading', 'comprehension', 'speed', 'dedication']
  },
  {
    base_id: 'flashcard-master',
    name: 'Memory Bank',
    description: 'Never forgets, has all the facts',
    icon: '🧠',
    tags: ['memory', 'flashcards', 'retention', 'study-skills']
  },

  // PROFESSIONAL - COLLABORATION (6 signals)
  {
    base_id: 'project-coordinator',
    name: 'Project Wrangler',
    description: 'Keeps all the moving parts organized',
    icon: '📋',
    tags: ['coordination', 'organization', 'project-management', 'teamwork']
  },
  {
    base_id: 'peer-tutor',
    name: 'Knowledge Sharer',
    description: 'Teaches others without making them feel dumb',
    icon: '🤝',
    tags: ['tutoring', 'teaching', 'patience', 'peer-support']
  },
  {
    base_id: 'lab-partner',
    name: 'Lab Ride-or-Die',
    description: 'The one you want for group lab work',
    icon: '🔬',
    tags: ['partnership', 'reliability', 'collaboration', 'science']
  },
  {
    base_id: 'discussion-contributor',
    name: 'Discussion MVP',
    description: 'Always adds value to the conversation',
    icon: '💬',
    tags: ['discussion', 'contribution', 'insight', 'engagement']
  },
  {
    base_id: 'resource-finder',
    name: 'Resource Ninja',
    description: 'Finds the resources nobody else could',
    icon: '🔍',
    tags: ['research', 'resourcefulness', 'discovery', 'sharing']
  },
  {
    base_id: 'encourager',
    name: 'Cheerleader',
    description: 'Believes in you before you believe in yourself',
    icon: '📣',
    tags: ['encouragement', 'belief', 'support', 'motivation']
  },

  // PERSONAL - CHARACTER (8 signals)
  {
    base_id: 'shows-up',
    name: 'Day One Energy',
    description: 'Always there when it counts, no flaking',
    icon: '✅',
    tags: ['reliability', 'loyalty', 'real-one', 'day-one']
  },
  {
    base_id: 'honest-communicator',
    name: 'Keeps It Real',
    description: 'Says what needs to be said, no sugar coating',
    icon: '💬',
    tags: ['honesty', 'real-talk', 'authentic', 'no-cap']
  },
  {
    base_id: 'conflict-resolver',
    name: 'Peacemaker',
    description: 'Doesn\'t avoid the hard conversations, resolves them',
    icon: '🤝',
    tags: ['conflict-resolution', 'courage', 'growth', 'maturity']
  },
  {
    base_id: 'boundary-respecter',
    name: 'Respects Boundaries',
    description: 'Knows when to give space, never pushy',
    icon: '🚧',
    tags: ['boundaries', 'respect', 'consent', 'awareness']
  },
  {
    base_id: 'promise-keeper',
    name: 'Keeps Their Word',
    description: 'If they say it, they do it',
    icon: '🤝',
    tags: ['promises', 'integrity', 'trust', 'reliability']
  },
  {
    base_id: 'growth-mindset',
    name: 'Growth Mode',
    description: 'Always working on becoming better',
    icon: '📈',
    tags: ['growth', 'mindset', 'improvement', 'learning']
  },
  {
    base_id: 'authentic-self',
    name: 'Unapologetically Them',
    description: 'Never tries to be someone they\'re not',
    icon: '🦋',
    tags: ['authenticity', 'self-acceptance', 'genuine', 'no-mask']
  },
  {
    base_id: 'emotional-intelligence',
    name: 'Reads The Room',
    description: 'Just gets it without anyone explaining',
    icon: '❤️',
    tags: ['empathy', 'awareness', 'emotional-iq', 'understanding']
  },

  // PERSONAL - CONNECTION (8 signals)
  {
    base_id: 'connector',
    name: 'Link Up Specialist',
    description: 'Connects people who need to meet each other',
    icon: '🔗',
    tags: ['networking', 'connections', 'introductions', 'community']
  },
  {
    base_id: 'active-listener',
    name: 'Actually Listens',
    description: 'Doesn\'t just wait to talk, really hears you',
    icon: '👂',
    tags: ['listening', 'attention', 'respect', 'presence']
  },
  {
    base_id: 'celebration-starter',
    name: 'Hype Squad',
    description: 'First to celebrate wins, even when it\'s not theirs',
    icon: '🎉',
    tags: ['celebration', 'support', 'generosity', 'no-jealousy']
  },
  {
    base_id: 'invitation-extender',
    name: 'Everyone\'s Invited',
    description: 'Makes sure nobody\'s left out of the conversation',
    icon: '🌈',
    tags: ['inclusion', 'belonging', 'invitation', 'community']
  },
  {
    base_id: 'story-teller',
    name: 'Story Mode',
    description: 'Makes everything memorable with good storytelling',
    icon: '📖',
    tags: ['storytelling', 'narrative', 'memorable', 'engaging']
  },
  {
    base_id: 'humor-bringer',
    name: 'Comic Relief',
    description: 'Lightens the mood when things get heavy',
    icon: '😂',
    tags: ['humor', 'levity', 'timing', 'connection']
  },
  {
    base_id: 'memory-keeper',
    name: 'Memory Lane',
    description: 'Remembers all the good times and stories',
    icon: '📸',
    tags: ['memory', 'nostalgia', 'appreciation', 'history']
  },
  {
    base_id: 'space-holder',
    name: 'Safe Space',
    description: 'Makes it safe to be vulnerable and real',
    icon: '🕊️',
    tags: ['safety', 'vulnerability', 'trust', 'support']
  },

  // CIVIC (6 signals)
  {
    base_id: 'community-organizer',
    name: 'Movement Starter',
    description: 'Gets people mobilized for the cause',
    icon: '📢',
    tags: ['organizing', 'activism', 'community', 'movement-building']
  },
  {
    base_id: 'volunteer-champion',
    name: 'Shows Up to Serve',
    description: 'Gives time freely for the greater good',
    icon: '🤲',
    tags: ['volunteering', 'service', 'community', 'generosity']
  },
  {
    base_id: 'mentor',
    name: 'Big Sibling Energy',
    description: 'Guides without being preachy or controlling',
    icon: '🌟',
    tags: ['mentorship', 'guidance', 'support', 'wisdom']
  },
  {
    base_id: 'neighbor-helper',
    name: 'Good Neighbor',
    description: 'Looks out for the community around them',
    icon: '🏘️',
    tags: ['community', 'neighborliness', 'care', 'local']
  },
  {
    base_id: 'sustainability-champion',
    name: 'Planet Protector',
    description: 'Lives and leads with environmental consciousness',
    icon: '🌱',
    tags: ['sustainability', 'environment', 'climate', 'stewardship']
  },
  {
    base_id: 'park-steward',
    name: 'Nature Guardian',
    description: 'Takes care of public spaces for everyone',
    icon: '🌳',
    tags: ['nature', 'parks', 'stewardship', 'community']
  }
];

console.log(`✨ Generated ${genzOverlays.length} GenZ overlays (${Math.round(genzOverlays.length / base.items.length * 100)}% coverage)\n`);

// =====================================================================
// African Overlays - Ubuntu Philosophy & Pan-African Cultural Context
// =====================================================================

const africanOverlays = [
  // PROFESSIONAL - LEADERSHIP (8 signals)
  {
    base_id: 'strategic-visionary',
    name: 'Elder Vision',
    description: 'Sees beyond the horizon like the elders, plans for seven generations',
    icon: '🎯',
    tags: ['leadership', 'wisdom', 'long-term', 'ubuntu']
  },
  {
    base_id: 'team-catalyst',
    name: 'Community Energizer',
    description: 'Brings the collective spirit that lifts everyone',
    icon: '⚡',
    tags: ['leadership', 'community', 'collective', 'ubuntu']
  },
  {
    base_id: 'decision-maker',
    name: 'Council Decision Maker',
    description: 'Makes wise decisions after listening to all voices',
    icon: '⚖️',
    tags: ['leadership', 'wisdom', 'council', 'collective']
  },
  {
    base_id: 'culture-builder',
    name: 'Ubuntu Keeper',
    description: 'Preserves and grows the culture of "I am because we are"',
    icon: '🏛️',
    tags: ['leadership', 'ubuntu', 'culture', 'community']
  },
  {
    base_id: 'change-champion',
    name: 'Tradition & Progress Bridge',
    description: 'Honors the old ways while embracing necessary change',
    icon: '🔄',
    tags: ['leadership', 'change', 'tradition', 'balance']
  },
  {
    base_id: 'talent-developer',
    name: 'Community Nurturer',
    description: 'Develops talent for the collective benefit',
    icon: '🌱',
    tags: ['leadership', 'mentorship', 'community', 'ubuntu']
  },
  {
    base_id: 'servant-leader',
    name: 'Servant of the People',
    description: 'Leads by serving the community first',
    icon: '🤝',
    tags: ['leadership', 'service', 'ubuntu', 'humility']
  },
  {
    base_id: 'consensus-builder',
    name: 'Indaba Facilitator',
    description: 'Brings people together for shared understanding',
    icon: '🤲',
    tags: ['leadership', 'consensus', 'dialogue', 'unity']
  },

  // PROFESSIONAL - KNOWLEDGE (8 signals)
  {
    base_id: 'technical-expert',
    name: 'Craft Master',
    description: 'Masters the craft like the ancestral artisans',
    icon: '🔧',
    tags: ['expertise', 'mastery', 'craft', 'technical']
  },
  {
    base_id: 'system-architect',
    name: 'Holistic Designer',
    description: 'Designs systems with interconnection in mind',
    icon: '🏗️',
    tags: ['architecture', 'holistic', 'systems', 'ubuntu']
  },
  {
    base_id: 'data-analyst',
    name: 'Pattern Reader',
    description: 'Sees patterns and connections in the numbers',
    icon: '📊',
    tags: ['analysis', 'patterns', 'insight', 'wisdom']
  },
  {
    base_id: 'domain-specialist',
    name: 'Elder Knowledge',
    description: 'Holds deep wisdom in their area of expertise',
    icon: '🎓',
    tags: ['expertise', 'wisdom', 'specialization', 'heritage']
  },
  {
    base_id: 'research-pioneer',
    name: 'Knowledge Seeker',
    description: 'Seeks new knowledge for community benefit',
    icon: '🔬',
    tags: ['research', 'discovery', 'community', 'innovation']
  },
  {
    base_id: 'continuous-learner',
    name: 'Wisdom Seeker',
    description: 'Always learning from elders and peers',
    icon: '📚',
    tags: ['learning', 'wisdom', 'growth', 'humility']
  },
  {
    base_id: 'quality-champion',
    name: 'Excellence Honor',
    description: 'Pursues excellence to honor ancestors and community',
    icon: '✨',
    tags: ['quality', 'excellence', 'honor', 'ubuntu']
  },
  {
    base_id: 'knowledge-sharer',
    name: 'Knowledge Griot',
    description: 'Shares wisdom like the storytellers of old',
    icon: '💎',
    tags: ['knowledge', 'wisdom', 'storytelling', 'education']
  },

  // PROFESSIONAL - EXECUTION (8 signals)
  {
    base_id: 'delivery-champion',
    name: 'Promise Keeper',
    description: 'Delivers on commitments to the community',
    icon: '🚀',
    tags: ['execution', 'delivery', 'commitment', 'ubuntu']
  },
  {
    base_id: 'revenue-driver',
    name: 'Prosperity Builder',
    description: 'Builds prosperity for collective advancement',
    icon: '💰',
    tags: ['prosperity', 'growth', 'community', 'ubuntu']
  },
  {
    base_id: 'process-optimizer',
    name: 'Efficiency Builder',
    description: 'Improves processes for collective benefit',
    icon: '⚡',
    tags: ['efficiency', 'improvement', 'collective', 'ubuntu']
  },
  {
    base_id: 'customer-advocate',
    name: 'Community Advocate',
    description: 'Champions the needs of those served',
    icon: '🛡️',
    tags: ['advocacy', 'community', 'service', 'ubuntu']
  },
  {
    base_id: 'problem-solver',
    name: 'Community Problem Solver',
    description: 'Solves challenges for collective benefit',
    icon: '🔧',
    tags: ['problem-solving', 'community', 'collective', 'ubuntu']
  },
  {
    base_id: 'bridge-builder',
    name: 'Bridge Between Worlds',
    description: 'Connects different communities and traditions',
    icon: '🌉',
    tags: ['connection', 'bridging', 'unity', 'pan-african']
  },
  {
    base_id: 'risk-manager',
    name: 'Community Protector',
    description: 'Protects community from unnecessary harm',
    icon: '🛡️',
    tags: ['protection', 'wisdom', 'foresight', 'ubuntu']
  },
  {
    base_id: 'sprint-champion',
    name: 'Collective Achiever',
    description: 'Achieves goals through collective effort',
    icon: '🏃',
    tags: ['achievement', 'collective', 'teamwork', 'ubuntu']
  },

  // PROFESSIONAL - SCHOLARSHIP (6 signals)
  {
    base_id: 'research-contributor',
    name: 'Scholarly Contributor',
    description: 'Contributes research for collective knowledge',
    icon: '📚',
    tags: ['research', 'scholarship', 'contribution', 'ubuntu']
  },
  {
    base_id: 'critical-thinker',
    name: 'Wise Analyst',
    description: 'Analyzes with both logic and cultural wisdom',
    icon: '🧠',
    tags: ['critical-thinking', 'wisdom', 'analysis', 'ubuntu']
  },
  {
    base_id: 'thesis-champion',
    name: 'Knowledge Builder',
    description: 'Builds lasting knowledge for future generations',
    icon: '📖',
    tags: ['research', 'legacy', 'scholarship', 'ubuntu']
  },
  {
    base_id: 'academic-mentor',
    name: 'Elder Guide',
    description: 'Mentors with the wisdom of experience',
    icon: '🎓',
    tags: ['mentorship', 'wisdom', 'guidance', 'ubuntu']
  },
  {
    base_id: 'writing-excellence',
    name: 'Written Word Keeper',
    description: 'Writes to preserve and share collective wisdom',
    icon: '✍️',
    tags: ['writing', 'preservation', 'wisdom', 'heritage']
  },
  {
    base_id: 'presentation-pro',
    name: 'Community Speaker',
    description: 'Speaks on behalf of and for the community',
    icon: '🎤',
    tags: ['speaking', 'representation', 'community', 'voice']
  },

  // PROFESSIONAL - STUDY (6 signals)
  {
    base_id: 'study-group-leader',
    name: 'Study Circle Leader',
    description: 'Leads collective learning efforts',
    icon: '👥',
    tags: ['leadership', 'study', 'collective', 'ubuntu']
  },
  {
    base_id: 'note-taker',
    name: 'Memory Keeper',
    description: 'Preserves knowledge for the collective',
    icon: '📝',
    tags: ['preservation', 'knowledge', 'sharing', 'ubuntu']
  },
  {
    base_id: 'exam-strategist',
    name: 'Strategic Scholar',
    description: 'Plans for success with wisdom and strategy',
    icon: '🎯',
    tags: ['strategy', 'scholarship', 'planning', 'wisdom']
  },
  {
    base_id: 'deadline-keeper',
    name: 'Word Keeper',
    description: 'Keeps their word as a matter of honor',
    icon: '⏰',
    tags: ['integrity', 'commitment', 'honor', 'ubuntu']
  },
  {
    base_id: 'reading-champion',
    name: 'Knowledge Consumer',
    description: 'Consumes knowledge to serve the community',
    icon: '📚',
    tags: ['reading', 'knowledge', 'learning', 'ubuntu']
  },
  {
    base_id: 'flashcard-master',
    name: 'Memory Holder',
    description: 'Holds knowledge like the oral historians',
    icon: '🧠',
    tags: ['memory', 'retention', 'heritage', 'ubuntu']
  },

  // PROFESSIONAL - COLLABORATION (6 signals)
  {
    base_id: 'project-coordinator',
    name: 'Collective Coordinator',
    description: 'Coordinates efforts for community benefit',
    icon: '📋',
    tags: ['coordination', 'collective', 'organization', 'ubuntu']
  },
  {
    base_id: 'peer-tutor',
    name: 'Knowledge Sharer',
    description: 'Shares knowledge as a community responsibility',
    icon: '🤝',
    tags: ['teaching', 'sharing', 'community', 'ubuntu']
  },
  {
    base_id: 'lab-partner',
    name: 'Reliable Partner',
    description: 'Partners with trust and commitment',
    icon: '🔬',
    tags: ['partnership', 'reliability', 'trust', 'ubuntu']
  },
  {
    base_id: 'discussion-contributor',
    name: 'Voice in Council',
    description: 'Contributes wisdom to collective dialogue',
    icon: '💬',
    tags: ['contribution', 'dialogue', 'wisdom', 'ubuntu']
  },
  {
    base_id: 'resource-finder',
    name: 'Resource Gatherer',
    description: 'Finds resources for community benefit',
    icon: '🔍',
    tags: ['resourcefulness', 'community', 'contribution', 'ubuntu']
  },
  {
    base_id: 'encourager',
    name: 'Spirit Lifter',
    description: 'Lifts spirits when burdens feel heavy',
    icon: '📣',
    tags: ['encouragement', 'support', 'spirit', 'ubuntu']
  },

  // PERSONAL - CHARACTER (8 signals)
  {
    base_id: 'shows-up',
    name: 'Reliable Presence',
    description: 'Shows up when the community calls, always present',
    icon: '✅',
    tags: ['reliability', 'community', 'ubuntu', 'commitment']
  },
  {
    base_id: 'honest-communicator',
    name: 'Truth Speaker',
    description: 'Speaks truth with respect and dignity',
    icon: '💬',
    tags: ['honesty', 'respect', 'dignity', 'communication']
  },
  {
    base_id: 'conflict-resolver',
    name: 'Restorative Justice Practitioner',
    description: 'Resolves conflict by restoring relationships',
    icon: '🤝',
    tags: ['justice', 'restoration', 'healing', 'ubuntu']
  },
  {
    base_id: 'boundary-respecter',
    name: 'Respecter of Dignity',
    description: 'Honors the dignity and space of others',
    icon: '🚧',
    tags: ['respect', 'dignity', 'boundaries', 'ubuntu']
  },
  {
    base_id: 'promise-keeper',
    name: 'Oath Keeper',
    description: 'Keeps commitments as sacred bonds',
    icon: '🤝',
    tags: ['commitment', 'honor', 'trust', 'ubuntu']
  },
  {
    base_id: 'growth-mindset',
    name: 'Continuous Grower',
    description: 'Grows for self and community benefit',
    icon: '📈',
    tags: ['growth', 'learning', 'improvement', 'ubuntu']
  },
  {
    base_id: 'authentic-self',
    name: 'Rooted in Identity',
    description: 'Stays true to their roots and heritage',
    icon: '🦋',
    tags: ['authenticity', 'heritage', 'identity', 'pride']
  },
  {
    base_id: 'emotional-intelligence',
    name: 'Heart Reader',
    description: 'Understands the unspoken emotions of others',
    icon: '❤️',
    tags: ['empathy', 'ubuntu', 'understanding', 'connection']
  },

  // PERSONAL - CONNECTION (8 signals)
  {
    base_id: 'connector',
    name: 'Network Weaver',
    description: 'Weaves connections across the community',
    icon: '🔗',
    tags: ['networking', 'community', 'connection', 'ubuntu']
  },
  {
    base_id: 'active-listener',
    name: 'Respectful Listener',
    description: 'Listens with the respect due to every voice',
    icon: '👂',
    tags: ['listening', 'respect', 'dignity', 'ubuntu']
  },
  {
    base_id: 'celebration-starter',
    name: 'Joy Sharer',
    description: 'Celebrates others\' success as the community\'s success',
    icon: '🎉',
    tags: ['celebration', 'collective-joy', 'ubuntu', 'generosity']
  },
  {
    base_id: 'invitation-extender',
    name: 'Circle Keeper',
    description: 'Ensures everyone has a place in the circle',
    icon: '🌈',
    tags: ['inclusion', 'circle', 'ubuntu', 'belonging']
  },
  {
    base_id: 'story-teller',
    name: 'Modern Griot',
    description: 'Carries stories that teach and connect',
    icon: '📖',
    tags: ['storytelling', 'heritage', 'wisdom', 'connection']
  },
  {
    base_id: 'humor-bringer',
    name: 'Community Jester',
    description: 'Brings joy and levity to the community',
    icon: '😂',
    tags: ['humor', 'joy', 'community', 'connection']
  },
  {
    base_id: 'memory-keeper',
    name: 'Ancestral Memory',
    description: 'Keeps the memories and stories alive',
    icon: '📸',
    tags: ['memory', 'heritage', 'stories', 'ubuntu']
  },
  {
    base_id: 'space-holder',
    name: 'Sacred Space Keeper',
    description: 'Holds sacred space for healing and growth',
    icon: '🕊️',
    tags: ['safety', 'sacred', 'healing', 'ubuntu']
  },

  // CIVIC (6 signals)
  {
    base_id: 'community-organizer',
    name: 'Community Mobilizer',
    description: 'Mobilizes community for collective action',
    icon: '📢',
    tags: ['organizing', 'community', 'mobilization', 'ubuntu']
  },
  {
    base_id: 'volunteer-champion',
    name: 'Service Heart',
    description: 'Serves community with willing heart',
    icon: '🤲',
    tags: ['service', 'volunteering', 'community', 'ubuntu']
  },
  {
    base_id: 'mentor',
    name: 'Elder Guide',
    description: 'Mentors with the wisdom of experience',
    icon: '🌟',
    tags: ['mentorship', 'wisdom', 'guidance', 'ubuntu']
  },
  {
    base_id: 'neighbor-helper',
    name: 'Ubuntu Neighbor',
    description: 'Embodies "I am because we are" in daily life',
    icon: '🏘️',
    tags: ['ubuntu', 'community', 'neighborliness', 'connection']
  },
  {
    base_id: 'sustainability-champion',
    name: 'Earth Steward',
    description: 'Protects the earth for future generations',
    icon: '🌱',
    tags: ['sustainability', 'stewardship', 'future', 'ubuntu']
  },
  {
    base_id: 'park-steward',
    name: 'Land Keeper',
    description: 'Keeps the land for community and future',
    icon: '🌳',
    tags: ['stewardship', 'land', 'community', 'ubuntu']
  }
];

console.log(`✨ Generated ${africanOverlays.length} African overlays (${Math.round(africanOverlays.length / base.items.length * 100)}% coverage)\n`);

// =====================================================================
// Build and Save Overlays
// =====================================================================

function buildOverlayCatalog(overlays, edition) {
  const items = overlays.map(overlay => {
    const baseSignal = base.items.find(s => s.base_id === overlay.base_id);
    if (!baseSignal) {
      console.warn(`⚠️  Warning: No base signal found for ${overlay.base_id}`);
      return null;
    }

    return {
      base_id: overlay.base_id,
      type_id: `${overlay.base_id}@2-${edition}`,
      name: overlay.name,
      description: overlay.description,
      icon: overlay.icon,
      tags: overlay.tags,
      category: baseSignal.category,
      subcategory: baseSignal.subcategory
      // NO trustValue or rarity - these come from base only!
    };
  }).filter(Boolean);

  // Calculate idem
  const idemInput = items
    .map(it => `${it.base_id}|${it.type_id}|${it.name}|${it.description}`)
    .sort()
    .join('\n');
  const idem = crypto.createHash('sha256').update(idemInput).digest('hex');

  return {
    v: 2,
    type: 'CATALOG_UPSERT_OVERLAY',
    edition,
    version: `2.0-${edition}`,
    items,
    iat: Math.floor(Date.now() / 1000),
    idem
  };
}

// Generate and save catalogs
const genzCatalog = buildOverlayCatalog(genzOverlays, 'genz');
const africanCatalog = buildOverlayCatalog(africanOverlays, 'african');

fs.writeFileSync(
  'scripts/out/catalog.v2-genz.overlay.json',
  JSON.stringify(genzCatalog, null, 2)
);

fs.writeFileSync(
  'scripts/out/catalog.v2-african.overlay.json',
  JSON.stringify(africanCatalog, null, 2)
);

console.log('📁 Saved updated catalogs:\n');
console.log(`   ✅ scripts/out/catalog.v2-genz.overlay.json (${genzCatalog.items.length} overlays)`);
console.log(`   ✅ scripts/out/catalog.v2-african.overlay.json (${africanCatalog.items.length} overlays)\n`);

console.log('🎉 Expansion complete!\n');
console.log('📊 Coverage Summary:');
console.log(`   - Base: ${base.items.length} signals (100%)`);
console.log(`   - GenZ: ${genzCatalog.items.length} overlays (${Math.round(genzCatalog.items.length / base.items.length * 100)}%)`);
console.log(`   - African: ${africanCatalog.items.length} overlays (${Math.round(africanCatalog.items.length / base.items.length * 100)}%)\n`);

console.log('🔍 Key Improvements:');
console.log('   ✅ Removed economics (trustValue/rarity) from overlays');
console.log(`   ✅ 4x increase in GenZ coverage (15 → ${genzCatalog.items.length} signals)`);
console.log(`   ✅ 4x increase in African coverage (15 → ${africanCatalog.items.length} signals)`);
console.log('   ✅ Maintained cultural authenticity and depth\n');

console.log('📝 Next Steps:');
console.log('   1. Review generated catalogs');
console.log('   2. Regenerate markdown docs: node scripts/generate-catalog-docs.js');
console.log('   3. Proceed with HCS seeding\n');
