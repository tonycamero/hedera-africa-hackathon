#!/usr/bin/env python3
"""
TrustMesh Hackathon Setup Script
===============================

One-command setup for the complete hackathon environment
Creates HCS topics, validates environment, runs demo

Usage:
    python setup.py --init         # Initialize environment
    python setup.py --create-topics # Create HCS topics
    python setup.py --demo         # Run demo validation
    python setup.py --all          # Full setup + demo
"""

import os
import sys
import asyncio
import argparse
import subprocess
from pathlib import Path
import json

# Add python-sdk to path
sys.path.insert(0, str(Path(__file__).parent / "python-sdk"))

try:
    from trustmesh_sdk import TrustMeshSDK
except ImportError:
    print("⚠️  TrustMesh SDK not found. Installing dependencies...")

def run_command(command, description):
    """Run shell command with nice output"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} completed")
            return True
        else:
            print(f"❌ {description} failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} failed: {e}")
        return False

def check_python_version():
    """Ensure Python 3.8+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    print(f"✅ Python {version.major}.{version.minor} detected")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing Dependencies")
    print("-" * 30)
    
    # Install main requirements
    if not run_command("pip install -r python-sdk/requirements.txt", "Installing Python packages"):
        return False
    
    # Install development tools
    dev_packages = [
        "black",
        "flake8", 
        "mypy",
        "pytest",
        "pytest-asyncio"
    ]
    
    for package in dev_packages:
        if not run_command(f"pip install {package}", f"Installing {package}"):
            print(f"⚠️  Failed to install {package}, continuing...")
    
    return True

def setup_environment():
    """Set up environment configuration"""
    print("\n⚙️  Setting Up Environment")
    print("-" * 30)
    
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    if env_example.exists():
        # Copy example to .env
        with open(env_example, 'r') as f:
            content = f.read()
        
        with open(env_file, 'w') as f:
            f.write(content)
        
        print("✅ Created .env from .env.example")
        print("⚠️  Please update .env with your Hedera credentials!")
        return True
    else:
        print("❌ .env.example not found")
        return False

async def create_hcs_topics():
    """Create HCS topics for TrustMesh"""
    print("\n🌐 Creating HCS Topics")
    print("-" * 30)
    
    # Check if credentials are set
    if not os.getenv("HEDERA_ACCOUNT_ID") or "YOUR_ACCOUNT" in os.getenv("HEDERA_ACCOUNT_ID", ""):
        print("❌ Please set your Hedera credentials in .env file first!")
        print("   HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT")
        print("   HEDERA_PRIVATE_KEY=your_private_key")
        return False
    
    try:
        sdk = TrustMeshSDK(
            account_id=os.getenv("HEDERA_ACCOUNT_ID"),
            private_key=os.getenv("HEDERA_PRIVATE_KEY"),
            network=os.getenv("HEDERA_NETWORK", "testnet")
        )
        
        print("🔗 Connecting to Hedera network...")
        topics = await sdk.create_topics()
        
        print("\n✅ HCS Topics Created:")
        for name, topic_id in topics.items():
            print(f"   {name.upper()}: {topic_id}")
        
        # Update .env file with topic IDs
        print("\n📝 Updating .env file with topic IDs...")
        update_env_file(topics)
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create HCS topics: {e}")
        print("💡 Make sure your Hedera credentials are correct")
        return False

def update_env_file(topics):
    """Update .env file with created topic IDs"""
    env_file = Path(".env")
    
    if not env_file.exists():
        print("❌ .env file not found")
        return
    
    # Read current content
    with open(env_file, 'r') as f:
        lines = f.readlines()
    
    # Update topic IDs
    topic_mapping = {
        "profiles": "TRUSTMESH_PROFILES_TOPIC",
        "trust_tokens": "TRUSTMESH_TRUST_TOKENS_TOPIC",
        "badges": "TRUSTMESH_BADGES_TOPIC",
        "reputation": "TRUSTMESH_REPUTATION_TOPIC",
        "polls": "TRUSTMESH_POLLS_TOPIC"
    }
    
    updated_lines = []
    for line in lines:
        updated = False
        for topic_name, env_var in topic_mapping.items():
            if line.startswith(f"{env_var}=") and topic_name in topics:
                updated_lines.append(f"{env_var}={topics[topic_name]}\n")
                updated = True
                break
        
        if not updated:
            updated_lines.append(line)
    
    # Write back
    with open(env_file, 'w') as f:
        f.writelines(updated_lines)
    
    print("✅ .env file updated with topic IDs")

async def run_demo_validation():
    """Run demo to validate setup"""
    print("\n🎪 Running Demo Validation")
    print("-" * 30)
    
    # Import demo script
    try:
        from demo_script import HackathonDemo, TrustMeshSDK
        
        # Initialize SDK
        sdk = TrustMeshSDK(
            account_id=os.getenv("HEDERA_ACCOUNT_ID"),
            private_key=os.getenv("HEDERA_PRIVATE_KEY"),
            network=os.getenv("HEDERA_NETWORK", "testnet")
        )
        
        demo = HackathonDemo(sdk)
        
        print("🎓 Running Campus Scenario...")
        campus_result = await demo.run_campus_scenario()
        
        print("🏢 Running Business Scenario...")
        business_result = await demo.run_business_scenario()
        
        # Save demo results
        results = {
            "campus": campus_result,
            "business": business_result,
            "setup_validation": "success"
        }
        
        with open("setup_validation.json", 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print("\n✅ Demo validation completed successfully!")
        print("💾 Results saved to setup_validation.json")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo validation failed: {e}")
        return False

def start_api_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting API Server")
    print("-" * 30)
    
    print("💡 Starting TrustMesh API server at http://localhost:8000")
    print("💡 API Documentation: http://localhost:8000/docs")
    print("💡 Interactive Demo: http://localhost:8000")
    print("💡 Press Ctrl+C to stop")
    
    os.chdir("python-sdk")
    subprocess.run([sys.executable, "trustmesh_api.py"])

def print_success_message():
    """Print success message with next steps"""
    print("\n🎉 TrustMesh Hackathon Setup Complete!")
    print("=" * 50)
    print()
    print("✅ Environment configured")
    print("✅ Dependencies installed") 
    print("✅ HCS topics created")
    print("✅ Demo validation passed")
    print()
    print("🚀 Next Steps:")
    print("   1. Run the demo: python demo_script.py --scenario full")
    print("   2. Start API server: python setup.py --server")
    print("   3. Open browser: http://localhost:8000")
    print()
    print("🏆 You're ready for the hackathon!")

async def main():
    """Main setup orchestrator"""
    parser = argparse.ArgumentParser(description='TrustMesh Hackathon Setup')
    parser.add_argument('--init', action='store_true', help='Initialize environment only')
    parser.add_argument('--create-topics', action='store_true', help='Create HCS topics only')
    parser.add_argument('--demo', action='store_true', help='Run demo validation only')
    parser.add_argument('--server', action='store_true', help='Start API server')
    parser.add_argument('--all', action='store_true', help='Full setup (default)')
    
    args = parser.parse_args()
    
    # Default to full setup if no specific action
    if not any([args.init, args.create_topics, args.demo, args.server]):
        args.all = True
    
    print("🌟 TrustMesh Hackathon Setup")
    print("Built for Hedera Africa Hackathon 2025")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return False
    
    success = True
    
    if args.init or args.all:
        # Environment setup
        if not setup_environment():
            success = False
        
        # Install dependencies
        if success and not install_dependencies():
            success = False
    
    if args.create_topics or args.all:
        if success:
            # Load environment variables
            from dotenv import load_dotenv
            load_dotenv()
            
            # Create HCS topics
            if not await create_hcs_topics():
                success = False
    
    if args.demo or args.all:
        if success:
            # Load environment variables
            from dotenv import load_dotenv
            load_dotenv()
            
            # Run demo validation
            if not await run_demo_validation():
                success = False
    
    if args.server:
        # Start API server
        start_api_server()
        return True
    
    if success and args.all:
        print_success_message()
    elif not success:
        print("\n❌ Setup failed. Please check the errors above.")
        return False
    
    return True

if __name__ == "__main__":
    asyncio.run(main())
