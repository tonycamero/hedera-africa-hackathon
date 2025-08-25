# ⚡ Team Setup - TrustMesh Hackathon

**Goal**: Get your entire team productive in 30 minutes.

---

## 🏃‍♂️ **30-Minute Team Sprint**

### **Minutes 0-10: Environment Setup**
```bash
# 1. Clone repo
git clone [YOUR_REPO_URL]
cd hedera-africa-hackathon

# 2. Hedera testnet setup  
# Visit: https://portal.hedera.com/register
# Create Account ID + Private Key
# Fund via faucet: https://portal.hedera.com/faucet

# 3. Environment file
cp setup/.env.example .env
# Add your HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY
```

### **Minutes 10-20: Technical Foundation**
```bash
# Backend setup
cd setup/python-sdk
pip install -r requirements.txt

# Frontend setup (parallel)
cd ../../
npx create-react-app frontend --template typescript
cd frontend
npm install @tailwindcss/typography framer-motion
```

### **Minutes 20-30: First HCS Message**
```bash
# Test Hedera connection
cd setup/python-sdk  
python trustmesh_sdk.py --test-connection

# Create HCS topics
node ../hedera-setup.js

# Verify everything works
python trustmesh_api.py
# Visit: http://localhost:8000/health
```

---

## 👥 **Team Role Assignment**

### **Technical Lead (Python)**
- **Responsibilities**: HCS integration, backend architecture, SDK development
- **First Task**: `src/hedera/` - Hedera client + topic management
- **Key Deliverable**: Working trust token exchange

### **Frontend Developer (React)**  
- **Responsibilities**: UI/UX, mobile responsive, demo polish
- **First Task**: `src/ui/` - Trust token exchange interface
- **Key Deliverable**: Campus demo user flows

### **Full-Stack/Demo Coordinator**
- **Responsibilities**: Integration, demo scenarios, presentation prep
- **First Task**: `src/demo/` - Campus scenario implementation  
- **Key Deliverable**: 5-minute demo walkthrough

### **Strategic Lead (Tony)**
- **Responsibilities**: Pitch development, judge engagement, ecosystem
- **First Task**: `docs/` - Presentation materials and positioning
- **Key Deliverable**: Compelling 8-minute pitch

---

## 🎯 **Daily Milestones**

### **Day 1 Checkpoints**
- **Hour 6**: ✅ Hedera integration + Profile creation
- **Hour 12**: ✅ Trust token exchange + Basic UI
- **Hour 18**: ✅ Badge system + Reputation engine
- **Hour 24**: ✅ Campus demo scenario complete

### **Day 2 Checkpoints**  
- **Hour 30**: ✅ Mobile polish + Performance optimization
- **Hour 36**: ✅ Pitch deck + Demo script ready
- **Hour 42**: ✅ Final testing + Backup plans
- **Hour 48**: ✅ Competition submission complete

---

## 🛠️ **Development Workflow**

### **Git Strategy**
```bash
# Feature branches for parallel work
git checkout -b feature/profile-manager
git checkout -b feature/trust-tokens  
git checkout -b feature/badge-system
git checkout -b feature/demo-ui

# Daily integration
git checkout main
git merge feature/[completed-feature]
```

### **Communication Protocol**
- **Standup**: Every 6 hours (progress + blockers)
- **Demo Testing**: Test scenarios after each feature
- **Final Rehearsal**: Hour 36-42 (multiple run-throughs)

---

## 🚨 **Emergency Protocols**

### **If HCS Integration Fails**
1. **Switch to mock mode**: Pre-loaded demo data
2. **Offline demo**: Local state simulation  
3. **Backup narrative**: "This would work on Hedera mainnet"

### **If Demo Breaks During Presentation**
1. **Fallback slides**: Screenshots of working demo
2. **Code walkthrough**: Show implementation on screen
3. **Concept explanation**: Focus on innovation story

### **If Team Member Blocked**
1. **Immediate escalation**: Slack/Discord ping for help
2. **Pair programming**: Two people tackle blocker together
3. **Scope reduction**: Remove non-essential features

---

## 📊 **Success Metrics**

### **Technical KPIs**
- [ ] 5 HCS standards implemented and working
- [ ] Sub-2 second transaction times
- [ ] 100% mobile responsive experience
- [ ] Zero bugs during final demo

### **Competition KPIs**
- [ ] Compelling 8-minute presentation
- [ ] Live demo with real Hedera transactions
- [ ] Clear real-world impact story
- [ ] Judge excitement about building on TrustMesh

---

**🎯 Remember**: We're building **social infrastructure**, not social media. Every feature should demonstrate how trust becomes programmable while staying human.

**🚀 Let's win this! Execute with precision and ship with confidence.**
