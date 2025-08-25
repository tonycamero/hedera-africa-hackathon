"""
TrustMesh Python SDK
===================

Complete Python SDK for building TrustMesh applications on Hedera
Implements HCS standards: HCS-11 (Profiles), HCS-20 (Trust Tokens), HCS-5 (Badges)

Usage:
    from trustmesh_sdk import TrustMeshSDK
    
    # Initialize
    sdk = TrustMeshSDK(
        account_id="0.0.YOUR_ACCOUNT",
        private_key="your_private_key",
        network="testnet"
    )
    
    # Create profile
    profile_id = await sdk.create_profile("Alex Chen")
    
    # Give trust token
    await sdk.give_trust_token(
        recipient="0.0.67890",
        trust_type="professional",
        relationship="colleague",
        context="Great collaboration on project"
    )
    
    # Create badge
    badge_id = await sdk.create_badge(
        recipient="0.0.67890",
        name="Best Dressed",
        category="style",
        rarity="rare"
    )
"""

import asyncio
import json
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

# Install with: pip install hedera-sdk-python fastapi sqlalchemy pydantic redis
try:
    from hedera import (
        Client, AccountId, PrivateKey, TopicId,
        TopicCreateTransaction, TopicMessageSubmitTransaction, 
        TopicMessageQuery, Hbar
    )
except ImportError:
    print("⚠️  Install hedera-sdk-python: pip install hedera-sdk-python")
    
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrustType(str, Enum):
    PERSONAL = "personal"
    PROFESSIONAL = "professional"
    COMMUNITY = "community"

class BadgeRarity(str, Enum):
    COMMON = "common"
    RARE = "rare"
    LEGENDARY = "legendary"

class BadgeType(str, Enum):
    ACHIEVEMENT = "achievement"
    PERSONALITY = "personality" 
    SKILL = "skill"
    CONTRIBUTION = "contribution"

@dataclass
class TrustMeshProfile:
    """HCS-11 compliant profile structure"""
    profile_id: str
    display_name: str
    schema_version: str = "1.0"
    created_at: str = ""
    updated_at: str = ""
    
    # Trust data
    trust_score: float = 0.0
    trust_tokens_given: int = 0
    trust_tokens_received: int = 0
    total_trst_staked: float = 0.0
    
    # Badge data
    badges_earned: List[str] = None
    badge_count: int = 0
    
    # Reputation data
    reputation_breakdown: Dict[str, float] = None
    connections: List[str] = None
    
    # Preferences
    visibility: str = "public"
    allow_trust_requests: bool = True
    show_trust_score: bool = True
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc).isoformat()
        if not self.updated_at:
            self.updated_at = self.created_at
        if self.badges_earned is None:
            self.badges_earned = []
        if self.reputation_breakdown is None:
            self.reputation_breakdown = {
                "reliability": 0.0,
                "collaboration": 0.0, 
                "leadership": 0.0
            }
        if self.connections is None:
            self.connections = []

@dataclass  
class TrustToken:
    """HCS-20 compliant trust token structure"""
    transaction_id: str
    transaction_type: str = "TRANSFER"
    point_type: str = "TRUST_TOKEN"
    amount: int = 1
    
    sender: str = ""
    recipient: str = ""
    
    timestamp: str = ""
    context: str = ""
    expires_at: Optional[str] = None
    
    # Trust metadata
    trust_type: TrustType = TrustType.PERSONAL
    relationship: str = ""
    trst_staked: float = 0.0
    
    # Audit data
    previous_balance: int = 0
    new_balance: int = 0
    transaction_hash: str = ""
    signature: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()
        if not self.transaction_hash:
            self.transaction_hash = self._generate_hash()
            
    def _generate_hash(self) -> str:
        """Generate transaction hash"""
        data = f"{self.transaction_id}:{self.sender}:{self.recipient}:{self.timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()

@dataclass
class RecognitionBadge:
    """HCS-5 compliant badge structure"""
    hashinal_id: str
    name: str
    description: str
    
    badge_type: BadgeType = BadgeType.ACHIEVEMENT
    category: str = ""
    rarity: BadgeRarity = BadgeRarity.COMMON
    
    recipient: str = ""
    issued_by: str = ""
    issued_at: str = ""
    
    # Visual design
    background_color: str = "#95A5A6"
    icon_url: str = ""
    border_style: str = "silver"
    
    # Gamification
    points: int = 25
    level: int = 1
    achievements: List[str] = None
    
    # Context
    issuance_context: Dict[str, Any] = None
    
    def __post_init__(self):
        if not self.issued_at:
            self.issued_at = datetime.now(timezone.utc).isoformat()
        if self.achievements is None:
            self.achievements = []
        if self.issuance_context is None:
            self.issuance_context = {}

class TrustMeshSDK:
    """Main SDK class for TrustMesh operations"""
    
    def __init__(
        self, 
        account_id: str,
        private_key: str, 
        network: str = "testnet",
        topics: Optional[Dict[str, str]] = None
    ):
        """Initialize TrustMesh SDK
        
        Args:
            account_id: Your Hedera account ID (0.0.xxxxx)
            private_key: Your Hedera private key
            network: "testnet" or "mainnet"
            topics: Custom HCS topic IDs (optional)
        """
        self.account_id = AccountId.fromString(account_id)
        self.private_key = PrivateKey.fromString(private_key)
        
        # Initialize Hedera client
        if network == "mainnet":
            self.client = Client.forMainnet()
        else:
            self.client = Client.forTestnet()
            
        self.client.setOperator(self.account_id, self.private_key)
        
        # Default topic IDs (you'll create these)
        self.topics = topics or {
            "profiles": "0.0.PROFILES_TOPIC",
            "trust_tokens": "0.0.TRUST_TOKENS_TOPIC", 
            "badges": "0.0.BADGES_TOPIC",
            "reputation": "0.0.REPUTATION_TOPIC",
            "polls": "0.0.POLLS_TOPIC"
        }
        
        logger.info(f"TrustMesh SDK initialized for account {account_id} on {network}")
    
    async def create_topics(self) -> Dict[str, str]:
        """Create all required HCS topics for TrustMesh
        
        Returns:
            Dictionary of topic names to topic IDs
        """
        topic_configs = [
            ("profiles", "TrustMesh User Profiles (HCS-11)"),
            ("trust_tokens", "TrustMesh Trust Token Transactions (HCS-20)"),
            ("badges", "TrustMesh Recognition Badges (HCS-5)"),
            ("reputation", "TrustMesh Reputation Scores (HCS-2)"),
            ("polls", "TrustMesh Community Polls (HCS-8)")
        ]
        
        created_topics = {}
        
        for topic_name, memo in topic_configs:
            try:
                transaction = (TopicCreateTransaction()
                             .setTopicMemo(memo)
                             .setAdminKey(self.private_key.getPublicKey())
                             .setSubmitKey(self.private_key.getPublicKey()))
                
                response = await transaction.executeAsync(self.client)
                receipt = await response.getReceiptAsync(self.client)
                topic_id = receipt.topicId.toString()
                
                created_topics[topic_name] = topic_id
                logger.info(f"✅ Created {topic_name} topic: {topic_id}")
                
            except Exception as e:
                logger.error(f"❌ Error creating {topic_name} topic: {e}")
                
        self.topics.update(created_topics)
        return created_topics
    
    async def create_profile(
        self, 
        display_name: str,
        visibility: str = "public"
    ) -> str:
        """Create a new TrustMesh profile
        
        Args:
            display_name: User's display name
            visibility: "public", "private", or "friends"
            
        Returns:
            Profile ID (same as account ID)
        """
        profile = TrustMeshProfile(
            profile_id=self.account_id.toString(),
            display_name=display_name,
            visibility=visibility
        )
        
        message = {
            "type": "PROFILE_CREATE",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": asdict(profile),
            "hcs_standard": "HCS-11"
        }
        
        try:
            await self._submit_message(self.topics["profiles"], message)
            logger.info(f"✅ Profile created for {display_name}")
            return profile.profile_id
            
        except Exception as e:
            logger.error(f"❌ Error creating profile: {e}")
            raise
    
    async def give_trust_token(
        self,
        recipient: str,
        trust_type: TrustType = TrustType.PERSONAL,
        relationship: str = "",
        context: str = "",
        trst_staked: float = 0.0
    ) -> str:
        """Give a trust token to another user
        
        Args:
            recipient: Recipient's account ID
            trust_type: Type of trust relationship
            relationship: How you know them
            context: Additional context
            trst_staked: TRST tokens staked behind this trust
            
        Returns:
            Transaction ID
        """
        transaction_id = f"tt_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        # Get recipient's current balance (simplified for demo)
        previous_balance = await self._get_trust_token_balance(recipient)
        
        trust_token = TrustToken(
            transaction_id=transaction_id,
            sender=self.account_id.toString(),
            recipient=recipient,
            trust_type=trust_type,
            relationship=relationship,
            context=context,
            trst_staked=trst_staked,
            previous_balance=previous_balance,
            new_balance=previous_balance + 1
        )
        
        message = {
            "type": "TRUST_TOKEN_GIVEN",
            "timestamp": trust_token.timestamp,
            "data": asdict(trust_token),
            "hcs_standard": "HCS-20"
        }
        
        try:
            await self._submit_message(self.topics["trust_tokens"], message)
            logger.info(f"✅ Trust token given to {recipient}")
            return transaction_id
            
        except Exception as e:
            logger.error(f"❌ Error giving trust token: {e}")
            raise
    
    async def create_badge(
        self,
        recipient: str,
        name: str,
        description: str,
        badge_type: BadgeType = BadgeType.ACHIEVEMENT,
        category: str = "general",
        rarity: BadgeRarity = BadgeRarity.COMMON,
        issuance_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create and issue a recognition badge
        
        Args:
            recipient: Badge recipient's account ID
            name: Badge name (e.g., "Best Dressed")
            description: Badge description
            badge_type: Type of badge
            category: Badge category
            rarity: Badge rarity level
            issuance_context: Additional context
            
        Returns:
            Badge hashinal ID
        """
        hashinal_id = f"badge_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        # Generate visual design based on category and rarity
        visual_design = self._generate_badge_design(category, rarity)
        
        badge = RecognitionBadge(
            hashinal_id=hashinal_id,
            name=name,
            description=description,
            badge_type=badge_type,
            category=category,
            rarity=rarity,
            recipient=recipient,
            issued_by=self.account_id.toString(),
            background_color=visual_design["background_color"],
            icon_url=visual_design["icon_url"], 
            border_style=visual_design["border_style"],
            points=self._calculate_badge_points(rarity),
            issuance_context=issuance_context or {}
        )
        
        message = {
            "type": "BADGE_ISSUED",
            "timestamp": badge.issued_at,
            "data": asdict(badge),
            "hcs_standard": "HCS-5"
        }
        
        try:
            await self._submit_message(self.topics["badges"], message)
            logger.info(f"✅ Badge '{name}' issued to {recipient}")
            return hashinal_id
            
        except Exception as e:
            logger.error(f"❌ Error creating badge: {e}")
            raise
    
    async def calculate_reputation(self, user_id: str) -> Dict[str, Any]:
        """Calculate comprehensive reputation score for a user
        
        Args:
            user_id: User's account ID
            
        Returns:
            Reputation data including score breakdown
        """
        # Get user's trust tokens, badges, and activity
        trust_data = await self._get_user_trust_data(user_id)
        badge_data = await self._get_user_badge_data(user_id)
        
        # Calculate reputation components
        trust_score = self._calculate_trust_score(trust_data)
        badge_score = self._calculate_badge_score(badge_data)
        activity_score = 15.5  # Simplified for demo
        
        # Weighted overall score
        overall_score = (
            trust_score * 0.4 +
            badge_score * 0.3 +
            activity_score * 0.3
        )
        
        reputation_data = {
            "user_id": user_id,
            "overall_score": round(overall_score, 1),
            "breakdown": {
                "trust": {
                    "score": trust_score,
                    "weight": 0.4,
                    "details": trust_data
                },
                "badges": {
                    "score": badge_score,
                    "weight": 0.3,
                    "details": badge_data
                },
                "activity": {
                    "score": activity_score,
                    "weight": 0.3
                }
            },
            "milestone": self._get_reputation_milestone(overall_score),
            "calculated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Submit to reputation topic
        message = {
            "type": "REPUTATION_CALCULATED",
            "timestamp": reputation_data["calculated_at"],
            "data": reputation_data,
            "hcs_standard": "HCS-2"
        }
        
        try:
            await self._submit_message(self.topics["reputation"], message)
            logger.info(f"✅ Reputation calculated for {user_id}: {overall_score}")
            return reputation_data
            
        except Exception as e:
            logger.error(f"❌ Error calculating reputation: {e}")
            raise
    
    async def create_community_poll(
        self,
        title: str,
        description: str,
        options: List[Dict[str, str]],
        voting_duration_hours: int = 168  # 1 week default
    ) -> str:
        """Create a community poll for recognition or decisions
        
        Args:
            title: Poll title
            description: Poll description  
            options: List of poll options with nominee data
            voting_duration_hours: How long voting stays open
            
        Returns:
            Poll ID
        """
        poll_id = f"poll_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        voting_closes = datetime.now(timezone.utc)
        voting_closes = voting_closes.replace(
            hour=voting_closes.hour + voting_duration_hours
        )
        
        poll_data = {
            "poll_id": poll_id,
            "title": title,
            "description": description,
            "poll_type": "recognition_voting",
            "options": options,
            "timeline": {
                "voting_opens": datetime.now(timezone.utc).isoformat(),
                "voting_closes": voting_closes.isoformat()
            },
            "eligibility": {
                "minimum_trust_score": 50.0,
                "requires_verification": False
            },
            "current_votes": {option["option_id"]: 0 for option in options}
        }
        
        message = {
            "type": "COMMUNITY_POLL_CREATED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": poll_data,
            "hcs_standard": "HCS-8"
        }
        
        try:
            await self._submit_message(self.topics["polls"], message)
            logger.info(f"✅ Community poll created: {title}")
            return poll_id
            
        except Exception as e:
            logger.error(f"❌ Error creating poll: {e}")
            raise
    
    async def vote_in_poll(self, poll_id: str, option_id: str) -> str:
        """Vote in a community poll
        
        Args:
            poll_id: The poll to vote in
            option_id: Selected option ID
            
        Returns:
            Vote ID
        """
        vote_id = f"vote_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        # Get voter's trust score (simplified)
        voter_score = 75.5  # Would query actual score
        
        vote_data = {
            "poll_id": poll_id,
            "vote_id": vote_id,
            "selected_option": option_id,
            "voter": self.account_id.toString(),
            "voter_profile": {
                "trust_score": voter_score,
                "eligibility_met": voter_score >= 50.0,
                "verification_status": "verified"
            },
            "vote_weight": 1.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        message = {
            "type": "POLL_VOTE_CAST", 
            "timestamp": vote_data["timestamp"],
            "data": vote_data,
            "hcs_standard": "HCS-9"
        }
        
        try:
            await self._submit_message(self.topics["polls"], message)
            logger.info(f"✅ Vote cast in poll {poll_id}")
            return vote_id
            
        except Exception as e:
            logger.error(f"❌ Error voting: {e}")
            raise
    
    # Helper methods
    async def _submit_message(self, topic_id: str, message: Dict[str, Any]):
        """Submit message to HCS topic"""
        topic = TopicId.fromString(topic_id)
        message_bytes = json.dumps(message).encode('utf-8')
        
        transaction = (TopicMessageSubmitTransaction()
                      .setTopicId(topic)
                      .setMessage(message_bytes))
        
        response = await transaction.executeAsync(self.client)
        receipt = await response.getReceiptAsync(self.client)
        return receipt
    
    async def _get_trust_token_balance(self, user_id: str) -> int:
        """Get user's trust token balance (simplified)"""
        # In production, this would query HCS topic for actual balance
        return 5  # Demo value
    
    async def _get_user_trust_data(self, user_id: str) -> Dict[str, Any]:
        """Get user's trust relationship data"""
        return {
            "tokens_received": 12,
            "tokens_given": 8,
            "average_trust_level": 3.8,
            "trst_backing": 180.0,
            "connections": 15
        }
    
    async def _get_user_badge_data(self, user_id: str) -> Dict[str, Any]:
        """Get user's badge data"""
        return {
            "total_badges": 3,
            "rare_badges": 1,
            "legendary_badges": 0,
            "categories": ["style", "leadership", "community"]
        }
    
    def _calculate_trust_score(self, trust_data: Dict[str, Any]) -> float:
        """Calculate trust component of reputation"""
        base_score = min(trust_data["tokens_received"] * 2, 30)
        quality_bonus = trust_data["average_trust_level"] * 5
        backing_bonus = min(trust_data["trst_backing"] / 10, 10)
        return min(base_score + quality_bonus + backing_bonus, 40.0)
    
    def _calculate_badge_score(self, badge_data: Dict[str, Any]) -> float:
        """Calculate badge component of reputation"""
        total_score = 0
        total_score += badge_data["total_badges"] * 5
        total_score += badge_data["rare_badges"] * 10
        total_score += badge_data["legendary_badges"] * 20
        return min(total_score, 30.0)
    
    def _get_reputation_milestone(self, score: float) -> Dict[str, Any]:
        """Determine reputation milestone and benefits"""
        if score >= 90:
            return {
                "level": "COMMUNITY_LEADER", 
                "benefits": ["event_hosting", "badge_issuing", "trust_verification"]
            }
        elif score >= 75:
            return {
                "level": "TRUSTED_MEMBER",
                "benefits": ["vip_access", "mentor_eligibility"]
            }
        elif score >= 50:
            return {
                "level": "ACTIVE_MEMBER", 
                "benefits": ["full_participation", "voting_rights"]
            }
        else:
            return {
                "level": "NEW_MEMBER",
                "benefits": ["basic_participation"]
            }
    
    def _generate_badge_design(self, category: str, rarity: BadgeRarity) -> Dict[str, str]:
        """Generate visual design for badge"""
        colors = {
            "style": "#FF6B9D",
            "leadership": "#45B7D1", 
            "community": "#4ECDC4",
            "skill": "#96CEB4",
            "achievement": "#FFEAA7"
        }
        
        borders = {
            BadgeRarity.COMMON: "silver",
            BadgeRarity.RARE: "golden", 
            BadgeRarity.LEGENDARY: "platinum"
        }
        
        return {
            "background_color": colors.get(category, "#95A5A6"),
            "icon_url": f"https://trustmesh.app/badges/{category}_{rarity.value}.svg",
            "border_style": borders[rarity]
        }
    
    def _calculate_badge_points(self, rarity: BadgeRarity) -> int:
        """Calculate points for badge rarity"""
        points = {
            BadgeRarity.COMMON: 25,
            BadgeRarity.RARE: 50,
            BadgeRarity.LEGENDARY: 100
        }
        return points[rarity]

# Demo and testing utilities
class DemoDataGenerator:
    """Generate realistic demo data for hackathon"""
    
    def __init__(self, sdk: TrustMeshSDK):
        self.sdk = sdk
    
    async def create_demo_community(self) -> List[str]:
        """Create a realistic demo community with profiles"""
        demo_users = [
            ("Alex Chen", "0.0.12345"),
            ("Jordan Smith", "0.0.67890"),
            ("Amara Okafor", "0.0.11111"),
            ("Kofi Asante", "0.0.22222"),
            ("Zara Hassan", "0.0.33333")
        ]
        
        created_profiles = []
        
        for name, user_id in demo_users:
            # This would normally create actual profiles
            # For demo, we'll just track the IDs
            created_profiles.append(user_id)
            logger.info(f"Demo user created: {name} ({user_id})")
        
        return created_profiles
    
    async def simulate_trust_network(self, user_ids: List[str]):
        """Simulate trust relationships forming"""
        trust_relationships = [
            (user_ids[0], user_ids[1], TrustType.PROFESSIONAL, "colleague", 25.0),
            (user_ids[1], user_ids[2], TrustType.COMMUNITY, "event_partner", 15.0),
            (user_ids[2], user_ids[3], TrustType.PROFESSIONAL, "supplier", 50.0),
            (user_ids[0], user_ids[4], TrustType.PERSONAL, "friend", 10.0)
        ]
        
        for giver, receiver, trust_type, relationship, trst_staked in trust_relationships:
            logger.info(f"Trust relationship: {giver} → {receiver} ({trust_type.value})")
            # Would call actual SDK methods
            await asyncio.sleep(0.1)  # Simulate processing time
    
    async def create_demo_badges(self, user_ids: List[str]):
        """Create demo recognition badges"""
        badges = [
            (user_ids[1], "Best Dressed", "Outstanding style and presentation", BadgeType.PERSONALITY, "style", BadgeRarity.RARE),
            (user_ids[2], "Community Leader", "Exceptional leadership in community events", BadgeType.CONTRIBUTION, "leadership", BadgeRarity.RARE),
            (user_ids[3], "Reliable Supplier", "Consistent delivery and quality", BadgeType.ACHIEVEMENT, "business", BadgeRarity.COMMON),
            (user_ids[0], "Code Contributor", "Outstanding technical contributions", BadgeType.SKILL, "technical", BadgeRarity.COMMON)
        ]
        
        for recipient, name, description, badge_type, category, rarity in badges:
            logger.info(f"Badge issued: '{name}' to {recipient}")
            # Would call actual SDK methods  
            await asyncio.sleep(0.1)

# Example usage and testing
async def main():
    """Example usage of TrustMesh SDK"""
    
    # Initialize SDK (use your test account)
    sdk = TrustMeshSDK(
        account_id="0.0.YOUR_ACCOUNT",
        private_key="your_private_key_here",
        network="testnet"
    )
    
    try:
        # Create HCS topics (run once)
        # topics = await sdk.create_topics()
        # print("Created topics:", topics)
        
        # Create profile
        profile_id = await sdk.create_profile(
            display_name="Alex Chen",
            visibility="public"
        )
        print(f"Profile created: {profile_id}")
        
        # Give trust token
        trust_tx = await sdk.give_trust_token(
            recipient="0.0.67890",
            trust_type=TrustType.PROFESSIONAL,
            relationship="colleague",
            context="Great collaboration on the project",
            trst_staked=25.0
        )
        print(f"Trust token given: {trust_tx}")
        
        # Create badge
        badge_id = await sdk.create_badge(
            recipient="0.0.67890",
            name="Best Dressed",
            description="Outstanding style and presentation",
            badge_type=BadgeType.PERSONALITY,
            category="style",
            rarity=BadgeRarity.RARE
        )
        print(f"Badge created: {badge_id}")
        
        # Calculate reputation
        reputation = await sdk.calculate_reputation("0.0.67890")
        print(f"Reputation calculated: {reputation['overall_score']}")
        
        # Create community poll
        poll_options = [
            {"option_id": "option_1", "nominee": "0.0.67890", "display_name": "Jordan Smith"},
            {"option_id": "option_2", "nominee": "0.0.11111", "display_name": "Amara Okafor"}
        ]
        
        poll_id = await sdk.create_community_poll(
            title="Best Dressed of the Month",
            description="Vote for the most stylish community member!",
            options=poll_options
        )
        print(f"Poll created: {poll_id}")
        
        # Vote in poll
        vote_id = await sdk.vote_in_poll(poll_id, "option_1")
        print(f"Vote cast: {vote_id}")
        
        print("✅ TrustMesh SDK demo completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
