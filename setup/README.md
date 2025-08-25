# 🏆 TrustMesh - Hackathon Repository

**Computational Trust Network on Hedera**  
*Built for Hedera Africa Hackathon 2025*

---

## 🌟 What is TrustMesh?

TrustMesh is a **bounded dynamical system for computational trust** - the first platform that makes social trust measurable, stakeable, and economically valuable.

### **Academic Foundation**
Inspired by Mark Braverman's work on dynamics and computation at Princeton University, TrustMesh implements trust as a **bounded dynamical system** where:
- **9-token Circle of Trust** prevents complexity explosion
- **HCS standards** ensure computational tractability  
- **TRST staking** creates real economic incentives
- **Network effects** drive viral adoption

### **Core Innovation**
We've solved the fundamental problem: **How do you make trust programmable without losing its human essence?**

---

## 🚀 Quick Start (5 minutes)

### **1. Clone and Setup**
```bash
git clone <your-repo-url>
cd trustmesh-hackathon
pip install -r python-sdk/requirements.txt
```

### **2. Configure Environment**
```bash
cp .env.example .env
# Add your Hedera testnet credentials
```

### **3. Run Demo**
```bash
python demo_script.py --scenario full
```

### **4. Start API Server**
```bash
cd python-sdk
python trustmesh_api.py
# Visit: http://localhost:8000
```

**✅ You're ready for the hackathon!**

---

## 🎯 Hackathon Strategy

### **Winning Formula**
1. **Theoretical Foundation**: Computational trust theory implementation
2. **Real-World Utility**: Solves actual problems in African communities  
3. **Technical Innovation**: Novel use of 5+ HCS standards
4. **Scalable Impact**: Framework other developers can build on

### **Demo Scenarios**
- **Campus Community**: Trust relationships, recognition badges, polls
- **Business Network**: Supplier verification, reputation-based access
- **Economic Impact**: Cross-border trade without traditional credit

### **Key Differentiators**
- First **bounded dynamical trust system** on blockchain
- **Academic credibility** with Princeton theoretical foundation
- **Real economic incentives** through TRST staking
- **Viral mechanics** via recognition badges

---

## 🛠 Technical Architecture

### **Stack Overview**
```
Frontend (React + TypeScript)
        ↓
FastAPI Backend (Python)
        ↓
TrustMesh SDK (Python)
        ↓
Hedera Consensus Service (HCS)
        ↓
5 HCS Standards Implementation
```

### **HCS Standards Implemented**
- **HCS-11**: User profiles with trust data
- **HCS-20**: Trust token transactions with TRST staking
- **HCS-5**: Recognition badges as Hashinals
- **HCS-2**: Reputation aggregation and queries
- **HCS-8/9**: Community polls and voting

### **Performance Characteristics**
- **Transaction Speed**: 10,000+ TPS (Hedera capacity)
- **Finality**: 3-5 seconds for consensus
- **Cost**: ~$0.0001 per trust transaction
- **Scalability**: Horizontal via topic sharding

---

## 📁 Repository Structure

```
trustmesh-hackathon/
├── WINNING_STRATEGY.md          # Complete hackathon strategy
├── demo_script.py               # Automated demo for presentation
├── python-sdk/
│   ├── trustmesh_sdk.py        # Complete Python SDK
│   ├── trustmesh_api.py        # FastAPI web application
│   └── requirements.txt        # Python dependencies
├── docs/
│   ├── api-reference.md        # API documentation
│   ├── hcs-integration.md      # HCS standards guide
│   └── academic-foundation.md   # Theoretical background
├── frontend/                    # React TypeScript app
│   ├── src/
│   ├── public/
│   └── package.json
├── tests/                       # Comprehensive test suite
└── .env.example                # Environment configuration
```

---

## 🎬 Demo Scripts

### **Full Demo (8 minutes)**
```bash
python demo_script.py --scenario full --output demo_results.json
```

### **Campus Scenario (4 minutes)**
```bash
python demo_script.py --scenario campus
```

### **Business Network (4 minutes)**
```bash
python demo_script.py --scenario business
```

### **API Demo (Interactive)**
```bash
cd python-sdk
python trustmesh_api.py
# Visit http://localhost:8000 for interactive demo
```

---

## 🧑‍💻 Development Guide

### **For Python Developers**

#### **Core SDK Usage**
```python
from trustmesh_sdk import TrustMeshSDK, TrustType, BadgeRarity

# Initialize SDK
sdk = TrustMeshSDK(
    account_id="0.0.YOUR_ACCOUNT",
    private_key="your_private_key",
    network="testnet"
)

# Create profile
await sdk.create_profile("Alex Chen")

# Give trust token with TRST staking
await sdk.give_trust_token(
    recipient="0.0.67890",
    trust_type=TrustType.PROFESSIONAL,
    relationship="colleague", 
    context="Great collaboration",
    trst_staked=25.0
)

# Issue recognition badge
await sdk.create_badge(
    recipient="0.0.67890",
    name="Best Dressed",
    rarity=BadgeRarity.RARE,
    category="style"
)

# Calculate reputation
reputation = await sdk.calculate_reputation("0.0.67890")
```

#### **FastAPI Integration**
```python
from trustmesh_api import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test profile creation
response = client.post("/profiles", json={
    "display_name": "Alex Chen",
    "visibility": "public"
})

assert response.status_code == 200
```

### **For Frontend Developers**

#### **React Integration**
```typescript
import { TrustMeshAPI } from './lib/trustmesh-api';

const api = new TrustMeshAPI('http://localhost:8000');

// Create profile
const profile = await api.createProfile({
    displayName: 'Alex Chen',
    visibility: 'public'
});

// Give trust token
const trustToken = await api.giveTrustToken({
    recipient: '0.0.67890',
    trustType: 'professional',
    relationship: 'colleague',
    context: 'Great collaboration',
    trstStaked: 25.0
});
```

---

## 🧪 Testing

### **Run All Tests**
```bash
pytest tests/ -v --cov=trustmesh_sdk
```

### **Test Categories**
- **Unit Tests**: SDK functionality, reputation algorithms
- **Integration Tests**: HCS topic interactions, API endpoints  
- **Demo Tests**: Scenario execution, data validation
- **Performance Tests**: Transaction throughput, response times

### **Coverage Requirements**
- **SDK Core**: 95%+ test coverage
- **API Endpoints**: 90%+ test coverage
- **Demo Scripts**: 100% execution success

---

## 🎪 Hackathon Presentation

### **8-Minute Demo Structure**
1. **Hook (30s)**: "What if trust was programmable?"
2. **Problem (60s)**: Trust verification in African communities
3. **Solution Demo (4m)**: Live campus + business scenarios
4. **Technical Innovation (90s)**: HCS standards + bounded dynamics
5. **Impact (60s)**: Economic inclusion and scalability
6. **Close (30s)**: "Trust layer for Africa's digital economy"

### **Key Demo Moments**
- **Trust Staking**: Real TRST tokens backing relationships
- **Recognition Badges**: Community voting creates Hashinals
- **Reputation Calculation**: Real-time score updates
- **Network Effects**: Trust relationships compound value
- **Economic Impact**: Business verification enables commerce

### **Judge Q&A Prep**
- **Technical Depth**: Ready to dive into HCS implementation
- **Scalability**: Horizontal sharding, 10K+ TPS capacity
- **Security**: Cryptographic proofs, audit trails
- **Economics**: TRST tokenomics, network effects model
- **Academic**: Princeton collaboration potential

---

## 🌍 Real-World Impact

### **African Market Applications**
- **Microfinance**: Credit decisions based on trust scores
- **Cross-Border Trade**: Supplier verification without banks
- **Dating Apps**: Social verification through community trust
- **Gig Economy**: Reputation-based matching and payments
- **Community Banking**: Trust-weighted lending circles

### **Economic Inclusion**
- **No Traditional Credit**: Trust score replaces credit score
- **Portable Reputation**: Social capital moves across platforms
- **Community Verification**: Local knowledge scales globally
- **Reduced Friction**: Trust relationships reduce transaction costs

---

## 🤝 Contributing

### **Hackathon Team Roles**
- **Technical Lead**: Python SDK development and HCS integration
- **Frontend Developer**: React UI and user experience
- **Demo Coordinator**: Presentation preparation and scenario testing
- **Business Analyst**: Use case validation and market research

### **Development Workflow**
1. **Feature Branch**: Create branch from main
2. **Implementation**: Write code with tests
3. **Demo Testing**: Validate in presentation scenarios  
4. **Code Review**: Team review before merge
5. **Integration**: Merge to main, update demo

### **Code Standards**
- **Python**: Black formatting, type hints, docstrings
- **TypeScript**: ESLint rules, strict type checking
- **Git**: Conventional commits, descriptive messages
- **Documentation**: Update README and API docs

---

## 📊 Success Metrics

### **Hackathon Goals**
- [ ] **5+ HCS Standards**: Implemented and demonstrated
- [ ] **Sub-2s Performance**: All transactions under 2 seconds
- [ ] **100+ Demo Interactions**: Comprehensive trust network
- [ ] **Mobile Responsive**: Works on all devices
- [ ] **Open Source**: Code available for community

### **Technical KPIs**
- Trust signal success rate: 99%+
- TRST staking/unstaking: 100% success
- Badge creation: 100% success  
- Reputation calculation: <1s response time
- Demo scenario completion: 100%

### **Business Impact**
- Use cases demonstrated: 2+ realistic scenarios
- Network growth simulation: 40%+ increase
- Economic value: $50K+ business value protected
- Trust verification: 95%+ accuracy
- Adoption potential: Clear path to 10K+ users

---

## 🔗 Links & Resources

### **Live Demo**
- **API Documentation**: http://localhost:8000/docs
- **Interactive Demo**: http://localhost:8000
- **Frontend App**: http://localhost:3000

### **Academic Resources**
- **Mark Braverman's Work**: [Princeton CS Theory](https://www.cs.princeton.edu/~mbraverm/)
- **Dynamics & Computation**: Space-Bounded Church-Turing Thesis
- **Trust Network Theory**: Social capital and network effects

### **Hedera Resources**
- **Developer Portal**: [Hedera Docs](https://docs.hedera.com)
- **HCS Standards**: [Consensus Service](https://docs.hedera.com/hedera/core-concepts/consensus-service)
- **Python SDK**: [hedera-sdk-python](https://github.com/hashgraph/hedera-sdk-python)

---

## 🏅 Team

**Built by**: [Your Team Name]  
**For**: Hedera Africa Hackathon 2025  
**Academic Foundation**: Princeton University Computational Trust Theory  
**Vision**: Trust Layer for Africa's Digital Economy

---

## 📄 License

MIT License - See LICENSE file for details.

Open source, ready for community contribution and ecosystem adoption.

---

**🚀 Ready to revolutionize trust? Let's build the future of computational trust together!**
