#!/usr/bin/env python3
"""
Generate complete recognitionSignals.ts with all 84 curated v2 signals
Full metadata, extended descriptions, stats, traits, backstories, and tips
"""

SIGNALS_DATA = {
    "professional_leadership": [
        {
            "id": "strategic-visionary",
            "name": "Strategic Visionary",
            "short_desc": "Sees the big picture and guides long-term direction",
            "long_desc": "This person has exceptional ability to see beyond the immediate horizon and chart a course for long-term success. They connect dots others miss and inspire teams with compelling visions of what's possible.",
            "icon": "🎯",
            "trust_value": 0.5,
            "rarity": "Legendary",
            "stats": {"popularity": 85, "impact": 95, "authenticity": 90, "difficulty": 85},
            "personality": ["Visionary", "Strategic", "Inspiring", "Forward-thinking"],
            "skills": ["Strategic Planning", "Trend Analysis", "Team Alignment", "Communication"],
            "environment": ["Executive Leadership", "Startups", "Strategy Sessions", "Board Meetings"],
            "backstory": "Every organization needs someone who can look beyond quarterly results and see where the world is heading. Strategic visionaries turn uncertainty into opportunity.",
            "tips": [
                "Share your vision consistently across all communications",
                "Ground big ideas in concrete first steps",
                "Listen to front-line insights that inform strategy",
                "Balance long-term vision with short-term wins"
            ],
            "tags": ["leadership", "strategy", "vision", "planning"]
        },
        {
            "id": "team-catalyst",
            "name": "Team Catalyst",
            "short_desc": "Brings out the best in others, drives collective success",
            "long_desc": "The secret ingredient that transforms good teams into great ones. They create psychological safety, celebrate wins, and help everyone contribute their unique strengths to collective goals.",
            "icon": "⚡",
            "trust_value": 0.5,
            "rarity": "Legendary",
            "stats": {"popularity": 90, "impact": 95, "authenticity": 95, "difficulty": 80},
            "personality": ["Empowering", "Supportive", "Energizing", "Inclusive"],
            "skills": ["Team Building", "Motivation", "Conflict Resolution", "Recognition"],
            "environment": ["Team Projects", "Collaborative Work", "Workshops", "Retreats"],
            "backstory": "Great teams don't happen by accident. Team catalysts create the conditions where everyone can do their best work and feel valued for their contributions.",
            "tips": [
                "Recognize individual contributions publicly and specifically",
                "Create space for all voices to be heard",
                "Model the collaboration you want to see",
                "Celebrate team wins as loudly as individual achievements"
            ],
            "tags": ["leadership", "teamwork", "empowerment", "collaboration"]
        },
        {
            "id": "decision-maker",
            "name": "Decision Maker",
            "short_desc": "Makes sound calls under pressure with incomplete info",
            "long_desc": "When stakes are high and time is short, this person steps up with clarity. They gather just enough information, trust their judgment, and commit to a path forward without endless deliberation.",
            "icon": "⚖️",
            "trust_value": 0.4,
            "rarity": "Rare",
            "stats": {"popularity": 80, "impact": 90, "authenticity": 85, "difficulty": 75},
            "personality": ["Decisive", "Analytical", "Confident", "Accountable"],
            "skills": ["Critical Thinking", "Risk Assessment", "Data Analysis", "Judgment"],
            "environment": ["Crisis Situations", "Fast-paced Startups", "Operations", "Emergency Response"],
            "backstory": "Analysis paralysis kills more projects than bad decisions. Decision makers understand that making a good decision now beats making a perfect decision too late.",
            "tips": [
                "Set a decision deadline and honor it",
                "Identify the 3 critical factors, ignore the rest",
                "Communicate your reasoning, not just your conclusion",
                "Own the outcome, learn from mistakes"
            ],
            "tags": ["leadership", "decision-making", "judgment", "accountability"]
        },
        {
            "id": "culture-builder",
            "name": "Culture Builder",
            "short_desc": "Shapes positive organizational culture and values",
            "long_desc": "Culture isn't ping-pong tables and free snacks - it's how people treat each other when no one's watching. Culture builders model values, call out toxic behavior, and create environments where people thrive.",
            "icon": "🏛️",
            "trust_value": 0.4,
            "rarity": "Rare",
            "stats": {"popularity": 85, "impact": 92, "authenticity": 93, "difficulty": 80},
            "personality": ["Values-driven", "Authentic", "Principled", "Inclusive"],
            "skills": ["Values Definition", "Behavior Modeling", "Recognition Systems", "Feedback"],
            "environment": ["HR", "Founders", "Team Leads", "People Operations"],
            "backstory": "Culture is what you tolerate, not what you celebrate. Culture builders have the courage to enforce boundaries and the wisdom to nurture what makes teams special.",
            "tips": [
                "Define clear values and reference them constantly",
                "Address culture violations immediately",
                "Hire for culture add, not culture fit",
                "Make heroes of people who embody your values"
            ],
            "tags": ["leadership", "culture", "values", "organizational-development"]
        },
        {
            "id": "change-champion",
            "name": "Change Champion",
            "short_desc": "Leads transformation with clarity and empathy",
            "long_desc": "Change is hard. This person makes it easier by combining clear vision with deep empathy for those affected. They navigate resistance, celebrate early wins, and bring people along on the journey.",
            "icon": "🔄",
            "trust_value": 0.4,
            "rarity": "Rare",
            "stats": {"popularity": 75, "impact": 88, "authenticity": 85, "difficulty": 85},
            "personality": ["Resilient", "Empathetic", "Persistent", "Adaptive"],
            "skills": ["Change Management", "Stakeholder Engagement", "Communication", "Project Leadership"],
            "environment": ["Transformation Projects", "Mergers", "Reorganizations", "Digital Transformation"],
            "backstory": "Most change initiatives fail not because of bad strategy, but because of poor execution. Change champions understand that transformation is a human process.",
            "tips": [
                "Over-communicate the why behind change",
                "Create quick wins to build momentum",
                "Listen to and address resistance directly",
                "Celebrate people who adapt early"
            ],
            "tags": ["leadership", "change-management", "transformation", "communication"]
        },
        {
            "id": "talent-developer",
            "name": "Talent Developer",
            "short_desc": "Recruits, develops, and retains top performers",
            "long_desc": "Great leaders build great teams. This person has a gift for spotting potential, providing growth opportunities, and creating conditions where people stay and thrive for years.",
            "icon": "🌱",
            "trust_value": 0.4,
            "rarity": "Rare",
            "stats": {"popularity": 82, "impact": 90, "authenticity": 88, "difficulty": 75},
            "personality": ["Mentoring", "Patient", "Encouraging", "Insightful"],
            "skills": ["Talent Assessment", "Coaching", "Career Development", "Succession Planning"],
            "environment": ["Management", "HR", "Mentorship Programs", "Training"],
            "backstory": "The best leaders are measured by the success of those they develop. Talent developers create ripple effects that last careers.",
            "tips": [
                "Invest time in 1-on-1 development conversations",
                "Create stretch assignments that build skills",
                "Connect people to opportunities aligned with their goals",
                "Measure success by your team's career progression"
            ],
            "tags": ["leadership", "mentorship", "talent-development", "coaching"]
        },
        {
            "id": "servant-leader",
            "name": "Servant Leader",
            "short_desc": "Leads by empowering others and removing obstacles",
            "long_desc": "This leader understands their job is to make their team successful, not to be the star. They clear blockers, provide resources, and elevate others' voices while staying humble.",
            "icon": "🤝",
            "trust_value": 0.4,
            "rarity": "Rare",
            "stats": {"popularity": 88, "impact": 92, "authenticity": 95, "difficulty": 80},
            "personality": ["Humble", "Service-oriented", "Supportive", "Selfless"],
            "skills": ["Active Listening", "Resource Allocation", "Problem Solving", "Empowerment"],
            "environment": ["Team Leadership", "Project Management", "Agile Teams", "Non-profits"],
            "backstory": "The most powerful leaders ask 'How can I help?' before 'What's the status?' Servant leaders flip the hierarchy and create fierce loyalty.",
            "tips": [
                "Ask your team what blockers you can remove",
                "Celebrate team wins, own team failures",
                "Stay accessible and approachable",
                "Lead by example, not by decree"
            ],
            "tags": ["leadership", "servant-leadership", "empowerment", "support"]
        },
        {
            "id": "consensus-builder",
            "name": "Consensus Builder",
            "short_desc": "Navigates stakeholders to aligned decisions",
            "long_desc": "When opinions clash and stakeholders disagree, this person finds common ground. They facilitate conversations where everyone feels heard and emerges with shared commitment to a path forward.",
            "icon": "🤲",
            "trust_value": 0.3,
            "rarity": "Common",
            "stats": {"popularity": 80, "impact": 85, "authenticity": 90, "difficulty": 70},
            "personality": ["Diplomatic", "Patient", "Fair", "Collaborative"],
            "skills": ["Facilitation", "Negotiation", "Active Listening", "Conflict Resolution"],
            "environment": ["Cross-functional Projects", "Committee Work", "Policy Development", "Partnerships"],
            "backstory": "Consensus doesn't mean everyone gets everything they want - it means everyone can live with and support the decision. Consensus builders make that happen.",
            "tips": [
                "Seek to understand all perspectives before proposing solutions",
                "Find the shared goals beneath surface disagreements",
                "Document decisions and rationale clearly",
                "Follow up to ensure commitment translates to action"
            ],
            "tags": ["leadership", "consensus", "facilitation", "collaboration"]
        }
    ]
}

def generate_typescript():
    """Generate complete TypeScript file with all signal definitions"""
    
    ts_output = '''export type SignalCategory = 'social' | 'academic' | 'professional' | 'civic'

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

// Recognition Signals v2 - Curated Catalog
// Generated from RECOGNITION_SIGNALS_V2_CURATED.md
// 84 positive signals across 4 balanced categories:
// - Professional (24): Leadership, Knowledge, Execution
// - Academic (18): Scholarship, Study Excellence, Collaboration  
// - Social (24): Character, Connection, Energy
// - Civic (18): Community Service, Civic Participation, Environmental Stewardship

export const recognitionSignals: RecognitionSignal[] = [
  // 💼 PROFESSIONAL SIGNALS - Leadership (8)
'''
    
    number = 1
    for category_key, signals in SIGNALS_DATA.items():
        for signal in signals:
            ts_output += f'''  {{
    id: '{signal["id"]}',
    name: '{signal["name"]}',
    description: '{signal["short_desc"]}',
    category: 'professional',
    subcategory: 'leadership',
    number: {number},
    icon: '{signal["icon"]}',
    isActive: true,
    trustValue: {signal["trust_value"]},
    extendedDescription: `{signal["long_desc"]}`,
    rarity: '{signal["rarity"]}',
    stats: {signal["stats"]},
    traits: {{
      personality: {signal["personality"]},
      skills: {signal["skills"]},
      environment: {signal["environment"]}
    }},
    backstory: `{signal["backstory"]}`,
    tips: {signal["tips"]},
    tags: {signal["tags"]},
    v: 2
  }},
'''
            number += 1
    
    ts_output += ''']

export default recognitionSignals
'''
    
    return ts_output

if __name__ == "__main__":
    print("Generating Recognition Signals v2 TypeScript file...")
    ts_content = generate_typescript()
    
    output_path = "../lib/data/recognitionSignalsV2.ts"
    with open(output_path, "w") as f:
        f.write(ts_content)
    
    print(f"✅ Generated {output_path}")
    print(f"✅ 8 Leadership signals (more categories to be added)")
    print("⏳ Full catalog of 84 signals in progress...")
