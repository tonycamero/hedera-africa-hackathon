
# Dataset Cleanup Report

## Summary
- **Total Signals**: 53
- **Total Issues**: 19
- **High Priority**: 9
- **Medium Priority**: 2  
- **Low Priority**: 8

## High Priority Issues (Action Required)

### Brain Rot (brain-rot)
- **Type**: negative
- **Issue**: Negative connotation - should be deprecated on-chain
- **Category**: social
- **Current**: "too much prime time" 🧠



### NPC (npc)
- **Type**: negative
- **Issue**: Negative connotation - should be deprecated on-chain
- **Category**: social
- **Current**: "background character energy" 🤓



### Melt (melt)
- **Type**: negative
- **Issue**: Negative connotation - should be deprecated on-chain
- **Category**: social
- **Current**: "awkward but funny" 👻



### Ghost (ghost)
- **Type**: negative
- **Issue**: Negative connotation - should be deprecated on-chain
- **Category**: social
- **Current**: "disappears often" 👻



### Lecture Sleeper (lecture-sleeper)
- **Type**: negative
- **Issue**: Negative connotation - should be deprecated on-chain
- **Category**: social
- **Current**: "always nodding off" 🛌



### Meeting Hog (meeting-hog)
- **Type**: negative
- **Issue**: Negative connotation - should be deprecated on-chain
- **Category**: professional
- **Current**: "talks too much in meetings" 👽



### Deadline Dodger (deadline-dodger)
- **Type**: negative
- **Issue**: Negative connotation - should be deprecated on-chain
- **Category**: social
- **Current**: "always almost done" ⏰



### Slack Phantom (slack-phantom)
- **Type**: negative
- **Issue**: Negative connotation - should be deprecated on-chain
- **Category**: social
- **Current**: "online but never responds" 👻



### Tryhard (tryhard)
- **Type**: negative
- **Issue**: Negative connotation - should be deprecated on-chain
- **Category**: social
- **Current**: "overly serious" 🎯



## Medium Priority Issues (Consider Fixing)

### Wellness Guru (wellness-guru-2)
- **Type**: duplicate
- **Issue**: Duplicate/variant of "Wellness Guru" (wellness-guru)
- **Category**: social
- **Current**: "morning yoga always" 🧘
- **Suggested Fix**: {
  "name": "Wellness Guru v2",
  "description": "morning yoga always"
}


### Training Junkie (training-junkie-2)
- **Type**: duplicate
- **Issue**: Duplicate/variant of "Training Junkie" (training-junkie)
- **Category**: social
- **Current**: "loves learning new skills" 📚
- **Suggested Fix**: {
  "name": "Training Junkie v2",
  "description": "loves learning new skills"
}


## Low Priority Issues (Optional)

### Rizz (rizz)
- **Type**: icon_mismatch
- **Issue**: Icon "🧠" doesn't match signal intent
- **Current**: "smooth operator" 🧠
- **Suggested Fix**: {
  "icon": "😎"
}


### Problem Solver (problem-solver)
- **Type**: icon_mismatch
- **Issue**: Icon "❌" doesn't match signal intent
- **Current**: "finds hacks for tricky work" ❌
- **Suggested Fix**: {
  "icon": "🔧"
}


### PowerPoint Pro (powerpoint-pro)
- **Type**: icon_mismatch
- **Issue**: Icon "📊" doesn't match signal intent
- **Current**: "biggest slides in the room" 📊
- **Suggested Fix**: {
  "icon": "📽️"
}


### Code Monkey (code-monkey)
- **Type**: icon_mismatch
- **Issue**: Icon "👨‍💻" doesn't match signal intent
- **Current**: "nonstop coder" 👨‍💻
- **Suggested Fix**: {
  "icon": "💻"
}


### Network Ninja (network-ninja)
- **Type**: icon_mismatch
- **Issue**: Icon "🕸️" doesn't match signal intent
- **Current**: "knows everyone everywhere" 🕸️
- **Suggested Fix**: {
  "icon": "🤝"
}


### Ice (ice)
- **Type**: description_issue
- **Issue**: Description too short - needs more context
- **Current**: "too cool" 🦢



### Prof Fav (prof-fav)
- **Type**: description_issue
- **Issue**: Description contains absolute language that may not apply universally
- **Current**: "teacher's pet, always cared on" 🏆



### Night Owl (night-owl)
- **Type**: description_issue
- **Issue**: Description contains absolute language that may not apply universally
- **Current**: "always working 2 AM" 🦉



## Recommended Actions

### 1. On-Chain Deprecation (High Priority)
Publish HCS deprecation messages for these 9 negative signals:
```json
"brain-rot", "npc", "melt", "ghost", "lecture-sleeper", "meeting-hog", "deadline-dodger", "slack-phantom", "tryhard"
```

### 2. Duplicate Resolution (Medium Priority)
- Decide whether to merge or remove duplicate variants
- If keeping variants, add proper versioning system

### 3. Icon Updates (Low Priority)
- Update icons to better match signal intent
- Ensure consistency across similar signal types

## Clean Dataset Stats (After Fixes)
- **Signals After Cleanup**: 43 (estimated)
- **Positive Signals Only**: 44
- **Rarity Distribution**: 
  - Regular: 42
  - Heat: 1
  - God-Tier: 1
