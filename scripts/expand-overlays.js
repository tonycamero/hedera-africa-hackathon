const fs = require('fs');
const crypto = require('crypto');

// Load base catalog
const base = JSON.parse(fs.readFileSync('scripts/out/catalog.v2-base.json', 'utf8'));

console.log(`\n📊 Base catalog has ${base.items.length} signals\n`);
console.log('🎯 Target: 60-70 overlays per cultural lens (70-80% coverage)\n');

// =====================================================================
// GenZ Overlays - Comprehensive Cultural Translation
// =====================================================================

// Simplified approach: manually select ~60 signals that are most culturally meaningful
// for both GenZ and African overlays

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

  // COLLABORATION (14 signals - 12 overlaid)
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
    base_id: 'authentic-self',
    name: 'Unapologetically Them',
    description: 'Never tries to be someone they\'re not',
    icon: '🦋',
    tags: ['authenticity', 'self-acceptance', 'genuine', 'no-mask']
  },
  {
    base_id: 'team-player',
    name: 'Squad Goals',
    description: 'Makes the whole crew better just by being there',
    icon: '🤝',
    tags: ['teamwork', 'collaboration', 'unity', 'squad']
  },
  {
    base_id: 'cross-functional',
    name: 'Bridge Builder',
    description: 'Connects different worlds, speaks everyone\'s language',
    icon: '🌉',
    tags: ['collaboration', 'translation', 'connection', 'versatile']
  },
  {
    base_id: 'knowledge-sharer',
    name: 'Drops Gems',
    description: 'Shares the knowledge freely, no gatekeeping',
    icon: '💎',
    tags: ['knowledge', 'teaching', 'generosity', 'open-source']
  },
  {
    base_id: 'active-listener',
    name: 'Actually Listens',
    description: 'Doesn\'t just wait to talk, really hears you',
    icon: '👂',
    tags: ['listening', 'attention', 'respect', 'presence']
  },
  {
    base_id: 'diplomatic',
    name: 'Conflict Diffuser',
    description: 'Cools things down before they escalate',
    icon: '🕊️',
    tags: ['diplomacy', 'peace', 'de-escalation', 'emotional-iq']
  },
  {
    base_id: 'celebrates-others',
    name: 'Hype Squad',
    description: 'First to celebrate wins, even when it\'s not theirs',
    icon: '🎉',
    tags: ['celebration', 'support', 'generosity', 'no-jealousy']
  },
  {
    base_id: 'feedback-giver',
    name: 'Real Feedback Friend',
    description: 'Tells you what you need to hear, not what you want',
    icon: '💬',
    tags: ['feedback', 'growth', 'honesty', 'care']
  },
  {
    base_id: 'inclusive',
    name: 'Everyone\'s Invited',
    description: 'Makes sure nobody\'s left out of the conversation',
    icon: '🌈',
    tags: ['inclusion', 'belonging', 'equity', 'community']
  },
  {
    base_id: 'conflict-resolver',
    name: 'Peacemaker',
    description: 'Doesn\'t avoid the hard conversations, resolves them',
    icon: '🤝',
    tags: ['conflict-resolution', 'courage', 'growth', 'maturity']
  },

  // INNOVATION (12 signals - 10 overlaid)
  {
    base_id: 'creative-thinker',
    name: 'Ideas Person',
    description: 'Always cooking up something new',
    icon: '💡',
    tags: ['creativity', 'innovation', 'imagination', 'originality']
  },
  {
    base_id: 'problem-solver',
    name: 'Debug Legend',
    description: 'Figures it out when everyone else is stuck',
    icon: '🔧',
    tags: ['problem-solving', 'persistence', 'resourceful', 'clutch']
  },
  {
    base_id: 'experimenter',
    name: 'Lab Rat',
    description: 'Tries the wild ideas that might just work',
    icon: '🧪',
    tags: ['experimentation', 'risk-taking', 'learning', 'innovation']
  },
  {
    base_id: 'continuous-learner',
    name: 'Always Leveling Up',
    description: 'Never stops learning and growing',
    icon: '📚',
    tags: ['learning', 'growth', 'curiosity', 'self-improvement']
  },
  {
    base_id: 'future-focused',
    name: 'Sees What\'s Next',
    description: 'Spots the trends before they\'re mainstream',
    icon: '🔮',
    tags: ['future', 'trends', 'vision', 'early-adopter']
  },
  {
    base_id: 'risk-taker',
    name: 'Send It Energy',
    description: 'Takes calculated risks when others hesitate',
    icon: '🚀',
    tags: ['courage', 'boldness', 'calculated-risk', 'momentum']
  },
  {
    base_id: 'systems-thinker',
    name: 'Sees The Matrix',
    description: 'Understands how everything connects',
    icon: '🧠',
    tags: ['systems', 'complexity', 'connections', 'big-picture']
  },
  {
    base_id: 'resourceful',
    name: 'MacGyver Mode',
    description: 'Makes it work with whatever\'s available',
    icon: '🛠️',
    tags: ['resourcefulness', 'creativity', 'scrappy', 'adaptive']
  },
  {
    base_id: 'tech-savvy',
    name: 'Digital Native',
    description: 'Just gets tech, doesn\'t need the manual',
    icon: '💻',
    tags: ['technology', 'digital', 'fluency', 'modern']
  },
  {
    base_id: 'process-improver',
    name: 'Efficiency Hacker',
    description: 'Finds the shortcuts and optimizations',
    icon: '⚡',
    tags: ['efficiency', 'optimization', 'improvement', 'smart-work']
  },

  // COMMUNICATION (14 signals - 12 overlaid)
  {
    base_id: 'clear-communicator',
    name: 'Makes It Make Sense',
    description: 'Explains complex things so everyone gets it',
    icon: '🗣️',
    tags: ['clarity', 'communication', 'teaching', 'translation']
  },
  {
    base_id: 'storyteller',
    name: 'Story Mode',
    description: 'Makes everything memorable with good storytelling',
    icon: '📖',
    tags: ['storytelling', 'narrative', 'memorable', 'engaging']
  },
  {
    base_id: 'presenter',
    name: 'Main Stage Energy',
    description: 'Commands attention when presenting',
    icon: '🎤',
    tags: ['presentation', 'confidence', 'engagement', 'performance']
  },
  {
    base_id: 'writer',
    name: 'Wordsmith',
    description: 'Writes things that people actually want to read',
    icon: '✍️',
    tags: ['writing', 'communication', 'clarity', 'craft']
  },
  {
    base_id: 'emotional-intelligence',
    name: 'Reads The Room',
    description: 'Just gets it without anyone explaining',
    icon: '❤️',
    tags: ['empathy', 'awareness', 'emotional-iq', 'understanding']
  },
  {
    base_id: 'persuasive',
    name: 'Convincing AF',
    description: 'Makes people see their perspective',
    icon: '🎯',
    tags: ['persuasion', 'influence', 'rhetoric', 'compelling']
  },
  {
    base_id: 'humor',
    name: 'Comic Relief',
    description: 'Lightens the mood when things get heavy',
    icon: '😂',
    tags: ['humor', 'levity', 'timing', 'connection']
  },
  {
    base_id: 'multilingual',
    name: 'Polyglot',
    description: 'Switches languages like it\'s nothing',
    icon: '🌍',
    tags: ['languages', 'global', 'versatile', 'cultural']
  },
  {
    base_id: 'visual-communicator',
    name: 'Meme Lord',
    description: 'Communicates with visuals that hit different',
    icon: '🎨',
    tags: ['visual', 'design', 'memes', 'creative']
  },
  {
    base_id: 'connector',
    name: 'Link Up Specialist',
    description: 'Connects people who need to meet each other',
    icon: '🔗',
    tags: ['networking', 'connections', 'introductions', 'community']
  },
  {
    base_id: 'bridge-builder',
    name: 'Translator',
    description: 'Helps different groups understand each other',
    icon: '🌉',
    tags: ['translation', 'mediation', 'understanding', 'unity']
  },
  {
    base_id: 'consensus-facilitator',
    name: 'Agreement Whisperer',
    description: 'Gets people to yes without the pressure',
    icon: '🤝',
    tags: ['facilitation', 'consensus', 'agreement', 'diplomacy']
  },

  // SUPPORT (14 signals - 12 overlaid)
  {
    base_id: 'mentor',
    name: 'Big Sibling Energy',
    description: 'Guides without being preachy or controlling',
    icon: '🌟',
    tags: ['mentorship', 'guidance', 'support', 'wisdom']
  },
  {
    base_id: 'sponsor',
    name: 'Opens Doors',
    description: 'Uses their platform to elevate others',
    icon: '🚪',
    tags: ['sponsorship', 'advocacy', 'access', 'opportunities']
  },
  {
    base_id: 'encourager',
    name: 'Cheerleader',
    description: 'Believes in you before you believe in yourself',
    icon: '📣',
    tags: ['encouragement', 'belief', 'support', 'motivation']
  },
  {
    base_id: 'celebrates-wins',
    name: 'First to Congratulate',
    description: 'Never misses a chance to celebrate someone',
    icon: '🎊',
    tags: ['celebration', 'joy', 'recognition', 'generous']
  },
  {
    base_id: 'present-in-crisis',
    name: 'Shows Up in Hard Times',
    description: 'There when things get real, not just for the good times',
    icon: '🫂',
    tags: ['loyalty', 'support', 'crisis', 'reliability']
  },
  {
    base_id: 'resource-sharer',
    name: 'Drops Links',
    description: 'Always sharing the resources and connections',
    icon: '📤',
    tags: ['generosity', 'resources', 'sharing', 'community']
  },
  {
    base_id: 'space-holder',
    name: 'Safe Space',
    description: 'Makes it safe to be vulnerable and real',
    icon: '🕊️',
    tags: ['safety', 'vulnerability', 'trust', 'support']
  },
  {
    base_id: 'accountability-partner',
    name: 'Keeps You Honest',
    description: 'Holds you accountable with love',
    icon: '⚖️',
    tags: ['accountability', 'growth', 'honesty', 'support']
  },
  {
    base_id: 'advocate',
    name: 'Speaks Up For Others',
    description: 'Uses their voice for those who aren\'t in the room',
    icon: '📢',
    tags: ['advocacy', 'justice', 'allyship', 'courage']
  },
  {
    base_id: 'helper',
    name: 'Always Down to Help',
    description: 'First to volunteer when someone needs it',
    icon: '🙋',
    tags: ['helpfulness', 'service', 'reliability', 'generosity']
  },
  {
    base_id: 'teacher',
    name: 'Patient Teacher',
    description: 'Explains until you get it, no judgment',
    icon: '👨‍🏫',
    tags: ['teaching', 'patience', 'clarity', 'empowerment']
  },
  {
    base_id: 'gratitude-expresser',
    name: 'Says Thank You',
    description: 'Never forgets to show appreciation',
    icon: '🙏',
    tags: ['gratitude', 'appreciation', 'acknowledgment', 'respect']
  },

  // ACHIEVEMENT (14 signals - 12 overlaid)
  {
    base_id: 'goal-achiever',
    name: 'Gets It Done',
    description: 'Sets goals and actually hits them',
    icon: '🎯',
    tags: ['achievement', 'goals', 'execution', 'results']
  },
  {
    base_id: 'overcomes-obstacles',
    name: 'Nothing Stops Them',
    description: 'Finds a way even when it looks impossible',
    icon: '⛰️',
    tags: ['perseverance', 'resilience', 'determination', 'grit']
  },
  {
    base_id: 'excellence-pursuer',
    name: 'High Standards',
    description: 'Won\'t settle for good enough',
    icon: '💯',
    tags: ['excellence', 'quality', 'standards', 'craft']
  },
  {
    base_id: 'deadline-keeper',
    name: 'Ships On Time',
    description: 'Delivers when they say they will',
    icon: '⏰',
    tags: ['reliability', 'deadlines', 'commitment', 'trust']
  },
  {
    base_id: 'quality-focused',
    name: 'Attention to Detail',
    description: 'Catches the small things others miss',
    icon: '🔍',
    tags: ['quality', 'detail', 'thoroughness', 'care']
  },
  {
    base_id: 'consistent-performer',
    name: 'Reliable Output',
    description: 'You know what you\'re getting, every time',
    icon: '🔄',
    tags: ['consistency', 'reliability', 'trust', 'predictable']
  },
  {
    base_id: 'milestone-marker',
    name: 'Progress Tracker',
    description: 'Celebrates the small wins along the way',
    icon: '📍',
    tags: ['progress', 'milestones', 'celebration', 'momentum']
  },
  {
    base_id: 'breakthrough-maker',
    name: 'Clutch Performer',
    description: 'Comes through when it matters most',
    icon: '💥',
    tags: ['breakthroughs', 'clutch', 'impact', 'game-changer']
  },
  {
    base_id: 'record-breaker',
    name: 'Sets New Standards',
    description: 'Shows what\'s actually possible',
    icon: '🏆',
    tags: ['achievement', 'excellence', 'records', 'inspiration']
  },
  {
    base_id: 'pioneer',
    name: 'First to Try',
    description: 'Goes where others haven\'t dared',
    icon: '🚀',
    tags: ['innovation', 'courage', 'first-mover', 'boldness']
  },
  {
    base_id: 'award-winner',
    name: 'Gets Recognition',
    description: 'Their work gets noticed and awarded',
    icon: '🥇',
    tags: ['recognition', 'achievement', 'excellence', 'validation']
  },
  {
    base_id: 'legacy-builder',
    name: 'Leaves a Mark',
    description: 'Creates something that lasts beyond them',
    icon: '🏛️',
    tags: ['legacy', 'impact', 'lasting', 'meaningful']
  },

  // CIVIC/COMMUNITY (8 signals - 6 overlaid)
  {
    base_id: 'community-organizer',
    name: 'Movement Starter',
    description: 'Gets people mobilized for the cause',
    icon: '📢',
    tags: ['organizing', 'activism', 'community', 'movement-building']
  },
  {
    base_id: 'volunteer',
    name: 'Shows Up to Serve',
    description: 'Gives time freely for the greater good',
    icon: '🤲',
    tags: ['volunteering', 'service', 'community', 'generosity']
  },
  {
    base_id: 'activist',
    name: 'Stands For Justice',
    description: 'Fights for what\'s right, even when it\'s hard',
    icon: '✊',
    tags: ['activism', 'justice', 'courage', 'advocacy']
  },
  {
    base_id: 'voter-mobilizer',
    name: 'Gets Out The Vote',
    description: 'Makes sure everyone\'s voice is heard',
    icon: '🗳️',
    tags: ['voting', 'democracy', 'mobilization', 'civic-engagement']
  },
  {
    base_id: 'sustainability-champion',
    name: 'Planet Protector',
    description: 'Lives and leads with environmental consciousness',
    icon: '🌱',
    tags: ['sustainability', 'environment', 'climate', 'stewardship']
  },
  {
    base_id: 'neighbor',
    name: 'Good Neighbor',
    description: 'Looks out for the community around them',
    icon: '🏘️',
    tags: ['community', 'neighborliness', 'care', 'local']
  }
];

console.log(`✨ Generated ${genzOverlays.length} GenZ overlays (${Math.round(genzOverlays.length / base.items.length * 100)}% coverage)\n`);

// =====================================================================
// African Overlays - Ubuntu Philosophy & Pan-African Cultural Context
// =====================================================================

const africanOverlays = [
  // LEADERSHIP (8 signals - all overlaid)
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

  // COLLABORATION (14 signals - 12 overlaid)
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
    base_id: 'authentic-self',
    name: 'Rooted in Identity',
    description: 'Stays true to their roots and heritage',
    icon: '🦋',
    tags: ['authenticity', 'heritage', 'identity', 'pride']
  },
  {
    base_id: 'team-player',
    name: 'Ubuntu Spirit',
    description: 'Lives "I am because we are" in every action',
    icon: '🤝',
    tags: ['ubuntu', 'collective', 'community', 'togetherness']
  },
  {
    base_id: 'cross-functional',
    name: 'Bridge Between Worlds',
    description: 'Connects different communities and traditions',
    icon: '🌉',
    tags: ['connection', 'bridging', 'unity', 'pan-african']
  },
  {
    base_id: 'knowledge-sharer',
    name: 'Knowledge Griot',
    description: 'Shares wisdom like the storytellers of old',
    icon: '💎',
    tags: ['knowledge', 'wisdom', 'storytelling', 'education']
  },
  {
    base_id: 'active-listener',
    name: 'Respectful Listener',
    description: 'Listens with the respect due to every voice',
    icon: '👂',
    tags: ['listening', 'respect', 'dignity', 'ubuntu']
  },
  {
    base_id: 'diplomatic',
    name: 'Peacekeeper',
    description: 'Maintains harmony in the community',
    icon: '🕊️',
    tags: ['peace', 'harmony', 'diplomacy', 'ubuntu']
  },
  {
    base_id: 'celebrates-others',
    name: 'Joy Sharer',
    description: 'Celebrates others\' success as the community\'s success',
    icon: '🎉',
    tags: ['celebration', 'collective-joy', 'ubuntu', 'generosity']
  },
  {
    base_id: 'feedback-giver',
    name: 'Elder Counsel',
    description: 'Offers guidance with wisdom and care',
    icon: '💬',
    tags: ['feedback', 'wisdom', 'guidance', 'care']
  },
  {
    base_id: 'inclusive',
    name: 'Circle Keeper',
    description: 'Ensures everyone has a place in the circle',
    icon: '🌈',
    tags: ['inclusion', 'circle', 'ubuntu', 'belonging']
  },
  {
    base_id: 'conflict-resolver',
    name: 'Restorative Justice Practitioner',
    description: 'Resolves conflict by restoring relationships',
    icon: '🤝',
    tags: ['justice', 'restoration', 'healing', 'ubuntu']
  },

  // INNOVATION (12 signals - 10 overlaid)
  {
    base_id: 'creative-thinker',
    name: 'Traditional Innovation',
    description: 'Innovates while honoring ancestral wisdom',
    icon: '💡',
    tags: ['creativity', 'innovation', 'tradition', 'balance']
  },
  {
    base_id: 'problem-solver',
    name: 'Community Problem Solver',
    description: 'Solves challenges for collective benefit',
    icon: '🔧',
    tags: ['problem-solving', 'community', 'collective', 'ubuntu']
  },
  {
    base_id: 'experimenter',
    name: 'Cultural Innovator',
    description: 'Tries new approaches rooted in cultural values',
    icon: '🧪',
    tags: ['innovation', 'culture', 'experimentation', 'values']
  },
  {
    base_id: 'continuous-learner',
    name: 'Wisdom Seeker',
    description: 'Always learning from elders and peers',
    icon: '📚',
    tags: ['learning', 'wisdom', 'growth', 'humility']
  },
  {
    base_id: 'future-focused',
    name: 'Seven Generations Thinker',
    description: 'Plans for the long-term benefit of generations',
    icon: '🔮',
    tags: ['future', 'long-term', 'legacy', 'stewardship']
  },
  {
    base_id: 'risk-taker',
    name: 'Courageous Pioneer',
    description: 'Takes bold steps for community advancement',
    icon: '🚀',
    tags: ['courage', 'pioneering', 'community', 'boldness']
  },
  {
    base_id: 'systems-thinker',
    name: 'Holistic Thinker',
    description: 'Sees the interconnectedness of all things',
    icon: '🧠',
    tags: ['systems', 'holistic', 'interconnection', 'ubuntu']
  },
  {
    base_id: 'resourceful',
    name: 'Makes A Way',
    description: 'Creates solutions from what is available',
    icon: '🛠️',
    tags: ['resourcefulness', 'creativity', 'resilience', 'ubuntu']
  },
  {
    base_id: 'tech-savvy',
    name: 'Digital Connector',
    description: 'Uses technology to connect and uplift community',
    icon: '💻',
    tags: ['technology', 'connection', 'community', 'modern']
  },
  {
    base_id: 'process-improver',
    name: 'Efficiency Builder',
    description: 'Improves processes for collective benefit',
    icon: '⚡',
    tags: ['efficiency', 'improvement', 'collective', 'ubuntu']
  },

  // COMMUNICATION (14 signals - 12 overlaid)
  {
    base_id: 'clear-communicator',
    name: 'Clear Voice',
    description: 'Speaks with clarity that serves understanding',
    icon: '🗣️',
    tags: ['clarity', 'communication', 'understanding', 'respect']
  },
  {
    base_id: 'storyteller',
    name: 'Modern Griot',
    description: 'Carries stories that teach and connect',
    icon: '📖',
    tags: ['storytelling', 'heritage', 'wisdom', 'connection']
  },
  {
    base_id: 'presenter',
    name: 'Community Speaker',
    description: 'Speaks on behalf of and for the community',
    icon: '🎤',
    tags: ['speaking', 'representation', 'community', 'voice']
  },
  {
    base_id: 'writer',
    name: 'Written Word Keeper',
    description: 'Writes to preserve and share collective wisdom',
    icon: '✍️',
    tags: ['writing', 'preservation', 'wisdom', 'heritage']
  },
  {
    base_id: 'emotional-intelligence',
    name: 'Heart Reader',
    description: 'Understands the unspoken emotions of others',
    icon: '❤️',
    tags: ['empathy', 'ubuntu', 'understanding', 'connection']
  },
  {
    base_id: 'persuasive',
    name: 'Respected Influencer',
    description: 'Influences through respect and earned trust',
    icon: '🎯',
    tags: ['influence', 'respect', 'trust', 'wisdom']
  },
  {
    base_id: 'humor',
    name: 'Community Jester',
    description: 'Brings joy and levity to the community',
    icon: '😂',
    tags: ['humor', 'joy', 'community', 'connection']
  },
  {
    base_id: 'multilingual',
    name: 'Language Bridge',
    description: 'Connects people across language barriers',
    icon: '🌍',
    tags: ['languages', 'connection', 'bridge', 'pan-african']
  },
  {
    base_id: 'visual-communicator',
    name: 'Visual Storyteller',
    description: 'Communicates culture through visual art',
    icon: '🎨',
    tags: ['visual', 'art', 'culture', 'storytelling']
  },
  {
    base_id: 'connector',
    name: 'Network Weaver',
    description: 'Weaves connections across the community',
    icon: '🔗',
    tags: ['networking', 'community', 'connection', 'ubuntu']
  },
  {
    base_id: 'bridge-builder',
    name: 'Unity Builder',
    description: 'Builds bridges between different groups',
    icon: '🌉',
    tags: ['unity', 'bridging', 'connection', 'peace']
  },
  {
    base_id: 'consensus-facilitator',
    name: 'Consensus Weaver',
    description: 'Facilitates agreement through patient dialogue',
    icon: '🤝',
    tags: ['consensus', 'dialogue', 'patience', 'ubuntu']
  },

  // SUPPORT (14 signals - 12 overlaid)
  {
    base_id: 'mentor',
    name: 'Elder Guide',
    description: 'Mentors with the wisdom of experience',
    icon: '🌟',
    tags: ['mentorship', 'wisdom', 'guidance', 'ubuntu']
  },
  {
    base_id: 'sponsor',
    name: 'Path Opener',
    description: 'Opens doors for the next generation',
    icon: '🚪',
    tags: ['sponsorship', 'opportunity', 'legacy', 'ubuntu']
  },
  {
    base_id: 'encourager',
    name: 'Spirit Lifter',
    description: 'Lifts spirits when burdens feel heavy',
    icon: '📣',
    tags: ['encouragement', 'support', 'spirit', 'ubuntu']
  },
  {
    base_id: 'celebrates-wins',
    name: 'Joy Multiplier',
    description: 'Multiplies joy by celebrating with others',
    icon: '🎊',
    tags: ['celebration', 'joy', 'community', 'ubuntu']
  },
  {
    base_id: 'present-in-crisis',
    name: 'Storm Companion',
    description: 'Stands with others through difficult times',
    icon: '🫂',
    tags: ['support', 'loyalty', 'ubuntu', 'solidarity']
  },
  {
    base_id: 'resource-sharer',
    name: 'Abundance Sharer',
    description: 'Shares resources believing in collective abundance',
    icon: '📤',
    tags: ['generosity', 'sharing', 'abundance', 'ubuntu']
  },
  {
    base_id: 'space-holder',
    name: 'Sacred Space Keeper',
    description: 'Holds sacred space for healing and growth',
    icon: '🕊️',
    tags: ['safety', 'sacred', 'healing', 'ubuntu']
  },
  {
    base_id: 'accountability-partner',
    name: 'Mutual Accountability',
    description: 'Holds others accountable with love and respect',
    icon: '⚖️',
    tags: ['accountability', 'ubuntu', 'growth', 'respect']
  },
  {
    base_id: 'advocate',
    name: 'Voice for the Voiceless',
    description: 'Speaks up for those who cannot speak',
    icon: '📢',
    tags: ['advocacy', 'justice', 'ubuntu', 'solidarity']
  },
  {
    base_id: 'helper',
    name: 'Ready Helper',
    description: 'Always ready to assist community members',
    icon: '🙋',
    tags: ['help', 'service', 'ubuntu', 'community']
  },
  {
    base_id: 'teacher',
    name: 'Patient Teacher',
    description: 'Teaches with patience and respect',
    icon: '👨‍🏫',
    tags: ['teaching', 'patience', 'respect', 'ubuntu']
  },
  {
    base_id: 'gratitude-expresser',
    name: 'Gratitude Keeper',
    description: 'Expresses thanks and acknowledges blessings',
    icon: '🙏',
    tags: ['gratitude', 'acknowledgment', 'ubuntu', 'respect']
  },

  // ACHIEVEMENT (14 signals - 12 overlaid)
  {
    base_id: 'goal-achiever',
    name: 'Vision Achiever',
    description: 'Achieves goals for collective advancement',
    icon: '🎯',
    tags: ['achievement', 'collective', 'vision', 'ubuntu']
  },
  {
    base_id: 'overcomes-obstacles',
    name: 'Resilience Embodied',
    description: 'Overcomes obstacles with ancestral strength',
    icon: '⛰️',
    tags: ['resilience', 'strength', 'perseverance', 'ubuntu']
  },
  {
    base_id: 'excellence-pursuer',
    name: 'Excellence Honor',
    description: 'Pursues excellence to honor ancestors and community',
    icon: '💯',
    tags: ['excellence', 'honor', 'heritage', 'ubuntu']
  },
  {
    base_id: 'deadline-keeper',
    name: 'Word Keeper',
    description: 'Keeps their word as a matter of honor',
    icon: '⏰',
    tags: ['integrity', 'commitment', 'honor', 'ubuntu']
  },
  {
    base_id: 'quality-focused',
    name: 'Craftsmanship',
    description: 'Takes pride in quality of work',
    icon: '🔍',
    tags: ['quality', 'craft', 'pride', 'excellence']
  },
  {
    base_id: 'consistent-performer',
    name: 'Steady Presence',
    description: 'Provides consistent, reliable contribution',
    icon: '🔄',
    tags: ['consistency', 'reliability', 'ubuntu', 'trust']
  },
  {
    base_id: 'milestone-marker',
    name: 'Progress Celebrator',
    description: 'Celebrates each step of the journey',
    icon: '📍',
    tags: ['progress', 'celebration', 'journey', 'ubuntu']
  },
  {
    base_id: 'breakthrough-maker',
    name: 'Barrier Breaker',
    description: 'Breaks through barriers for the community',
    icon: '💥',
    tags: ['breakthrough', 'pioneering', 'community', 'ubuntu']
  },
  {
    base_id: 'record-breaker',
    name: 'New Standard Setter',
    description: 'Sets new standards for community achievement',
    icon: '🏆',
    tags: ['achievement', 'standards', 'excellence', 'ubuntu']
  },
  {
    base_id: 'pioneer',
    name: 'Pathfinder',
    description: 'Finds new paths for community advancement',
    icon: '🚀',
    tags: ['pioneering', 'innovation', 'community', 'ubuntu']
  },
  {
    base_id: 'award-winner',
    name: 'Community Pride',
    description: 'Brings pride and recognition to community',
    icon: '🥇',
    tags: ['recognition', 'pride', 'community', 'ubuntu']
  },
  {
    base_id: 'legacy-builder',
    name: 'Ancestor Work',
    description: 'Builds legacy for seven generations',
    icon: '🏛️',
    tags: ['legacy', 'ancestors', 'future', 'ubuntu']
  },

  // CIVIC/COMMUNITY (8 signals - 6 overlaid)
  {
    base_id: 'community-organizer',
    name: 'Community Mobilizer',
    description: 'Mobilizes community for collective action',
    icon: '📢',
    tags: ['organizing', 'community', 'mobilization', 'ubuntu']
  },
  {
    base_id: 'volunteer',
    name: 'Service Heart',
    description: 'Serves community with willing heart',
    icon: '🤲',
    tags: ['service', 'volunteering', 'community', 'ubuntu']
  },
  {
    base_id: 'activist',
    name: 'Justice Warrior',
    description: 'Fights for justice with courage and conviction',
    icon: '✊',
    tags: ['justice', 'activism', 'courage', 'ubuntu']
  },
  {
    base_id: 'voter-mobilizer',
    name: 'Democracy Keeper',
    description: 'Ensures all voices are heard in decisions',
    icon: '🗳️',
    tags: ['democracy', 'voice', 'participation', 'ubuntu']
  },
  {
    base_id: 'sustainability-champion',
    name: 'Earth Steward',
    description: 'Protects the earth for future generations',
    icon: '🌱',
    tags: ['sustainability', 'stewardship', 'future', 'ubuntu']
  },
  {
    base_id: 'neighbor',
    name: 'Ubuntu Neighbor',
    description: 'Embodies "I am because we are" in daily life',
    icon: '🏘️',
    tags: ['ubuntu', 'community', 'neighborliness', 'connection']
  }
];

console.log(`✨ Generated ${africanOverlays.length} African overlays (${Math.round(africanOverlays.length / base.items.length * 100)}% coverage)\n`);

// =====================================================================
// Build and Save Overlays
// =====================================================================

function buildOverlayCatalog(overlays, edition) {
  // Map overlays to catalog format
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
console.log('   ✅ 4x increase in GenZ coverage (15 → 72 signals)');
console.log('   ✅ 4x increase in African coverage (15 → 72 signals)');
console.log('   ✅ Maintained cultural authenticity and depth\n');

console.log('📝 Next Steps:');
console.log('   1. Review generated catalogs');
console.log('   2. Regenerate markdown docs: node scripts/generate-catalog-docs.js');
console.log('   3. Proceed with HCS seeding\n');
