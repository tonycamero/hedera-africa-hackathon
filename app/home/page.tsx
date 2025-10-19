"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { QrCodeIcon, UserGroupIcon, CalendarIcon, HeartIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function HomePage() {
  const [progress, setProgress] = useState<{
    accepted: number;
    unlocked3: boolean;
    unlocked9: boolean;
  } | null>(null);
  const [magic, setMagic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<{displayName?: string, directoryOptIn?: boolean}>({});
  const [user, setUser] = useState<{id?: string, email?: string, ward?: string} | null>(null);

  useEffect(() => {
    const initMagic = async () => {
      setDebugInfo("Starting Magic initialization...");
      
      const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
      setDebugInfo(prev => prev + `\nMagic key: ${key ? 'SET' : 'MISSING'}`);
      
      if (!key) {
        setDebugInfo(prev => prev + "\nERROR: No Magic key found!");
        setIsLoading(false);
        return;
      }
      
      try {
        const { Magic } = await import("magic-sdk");
        setDebugInfo(prev => prev + "\nMagic SDK imported successfully");
        
        const m = new Magic(key);
        setMagic(m);
        setDebugInfo(prev => prev + "\nMagic instance created");
        
        await loadProgress(m);
        await loadProfile(m);
        await loadUserData(m);
      } catch (error) {
        setDebugInfo(prev => prev + `\nError initializing Magic: ${error.message}`);
        setIsLoading(false);
      }
    };
    
    initMagic();
  }, []);
  
  const loadProfile = async (magicInstance = magic) => {
    if (!magicInstance) return;
    try {
      const token = await magicInstance.user.getIdToken();
      const response = await fetch("/api/contacts/optin", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };
  
  const loadUserData = async (magicInstance = magic) => {
    if (!magicInstance) return;
    try {
      const token = await magicInstance.user.getIdToken();
      const response = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setDebugInfo(prev => prev + `\nUser loaded: ward=${data.user?.ward}`);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  };
  
  const updateProfile = async (data: {displayName?: string, directoryOptIn?: boolean}) => {
    if (!magic) return;
    try {
      const token = await magic.user.getIdToken();
      const response = await fetch("/api/contacts/optin", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        setShowProfile(false);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const loadProgress = async (magicInstance = magic) => {
    if (!magicInstance) {
      setDebugInfo(prev => prev + "\nSkipping progress load - no magic instance");
      return;
    };
    
    try {
      setDebugInfo(prev => prev + "\nChecking login status...");
      const isLoggedIn = await magicInstance.user.isLoggedIn();
      setDebugInfo(prev => prev + `\nLogin status: ${isLoggedIn}`);
      
      if (!isLoggedIn) {
        setDebugInfo(prev => prev + "\nRedirecting to /join...");
        window.location.href = "/join";
        return;
      }

      setDebugInfo(prev => prev + "\nGetting ID token...");
      const token = await magicInstance.user.getIdToken();
      setDebugInfo(prev => prev + "\nToken received, fetching progress...");
      
      const response = await fetch("/api/progress", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        setDebugInfo(prev => prev + `\nProgress loaded: ${JSON.stringify(data)}`);
      } else {
        setDebugInfo(prev => prev + `\nAPI error: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
      setDebugInfo(prev => prev + `\nError: ${error.message}`);
    }
    setIsLoading(false);
  };

  const showInviteQR = async () => {
    if (!magic) return;
    
    try {
      // First create a credited invite
      const token = await magic.user.getIdToken();
      const inviteResponse = await fetch("/api/invite/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      
      if (!inviteResponse.ok) {
        throw new Error("Failed to create invite");
      }
      
      const { url: inviteUrl } = await inviteResponse.json();
      
      // Generate QR code with the credited invite URL
      const qrDataUrl = await QRCode.toDataURL(inviteUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        }
      });
      
      setQrCodeUrl(qrDataUrl);
      setInviteUrl(inviteUrl); // Store the URL for display
      setShowQR(true);
      
      // Refresh progress after creating invite
      setTimeout(loadProgress, 1000);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to create invite. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="fairfield-page">
        <div className="fairfield-container">
          <div className="fairfield-card text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
            <p className="fairfield-body mb-4">Loading...</p>
            {debugInfo && (
              <div className="fairfield-card mt-4">
                <strong className="fairfield-heading text-lg">Debug Info:</strong>
                <pre className="fairfield-caption text-sm mt-2 whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getCircleStatus = () => {
    if (!progress) return "Ready to build our community";
    if (progress.accepted >= 9) return "Strong network established 🏙️";
    if (progress.accepted >= 3) return "Building community support 🤝";
    if (progress.accepted >= 1) return "Great start connecting neighbors";
    return "Invite neighbors who believe in a better Fairfield";
  };

  const getUnlockMessage = () => {
    if (!progress) return "";
    if (progress.accepted >= 9) return "Full supporter access activated!";
    if (progress.accepted >= 3) return "Supporter tools now available!";
    return `${3 - progress.accepted} more neighbors needed to unlock supporter tools`;
  };

  return (
    <div className="fairfield-page min-h-screen" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
      <div className="fairfield-container">
        
        {/* Header */}
        <div className="fairfield-card fairfield-card-glass text-center">
          <h1 className="fairfield-display text-4xl mb-4 text-[var(--fairfield-text-primary)]">Fairfield Voice</h1>
          <p className="fairfield-body text-lg text-[var(--fairfield-text-secondary)]">Join the campaign for a stronger Fairfield.</p>
          {user?.ward && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg backdrop-blur-sm">
              <span className="fairfield-caption text-sm font-bold text-blue-700">
                Ward: {user.ward.replace('W-', '')} - {user.ward === 'W-1' ? 'Downtown' : user.ward === 'W-2' ? 'Eastside' : user.ward === 'W-3' ? 'Westside' : 'Northside'}
              </span>
            </div>
          )}
        </div>

        {/* Circle of Trust Progress */}
        <div className="fairfield-card fairfield-card-accent">
          <div className="text-center mb-6">
            <h2 className="fairfield-heading text-2xl mb-3 text-[var(--fairfield-text-primary)]">Your Circle of Trust</h2>
            <p className="fairfield-body text-lg font-bold text-[var(--fairfield-text-accent)]">{getCircleStatus()}</p>
          </div>
          
          <div className="fairfield-progress-ring mb-6">
            <svg viewBox="0 0 36 36">
              <path
                className="fairfield-progress-bg"
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
              />
              <path
                className="fairfield-progress-fill"
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                strokeDasharray={`${Math.min((progress?.accepted || 0) / 9 * 100, 100)}, 100`}
              />
            </svg>
            <div className="fairfield-progress-text">
              {progress?.accepted || 0}/9
            </div>
          </div>
          
          <p className="fairfield-body text-center mb-6">
            {getUnlockMessage()}
          </p>
          
          <button
            onClick={showInviteQR}
            className="fairfield-btn fairfield-btn-primary w-full"
          >
            <QrCodeIcon className="fairfield-icon" />
            <span>Invite Neighbors</span>
          </button>
        </div>

        {/* Find Neighbors Button */}
        <div className="fairfield-card">
          <div className="text-center">
            <h3 className="fairfield-heading text-lg mb-2 text-[var(--fairfield-text-primary)]">Find More Neighbors</h3>
            <p className="fairfield-body text-sm mb-4 text-[var(--fairfield-text-tertiary)]">
              Browse the directory to connect with neighbors who've opted in
            </p>
            <Link href="/contacts" className="fairfield-btn fairfield-btn-primary">
              <UserGroupIcon className="fairfield-icon" />
              Find Neighbors
            </Link>
          </div>
        </div>
        
        {/* Profile Settings */}
        <div className="fairfield-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="fairfield-heading text-lg">Directory Profile</h3>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="fairfield-btn fairfield-btn-secondary text-sm px-3 py-1"
            >
              {showProfile ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {showProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block fairfield-caption text-sm mb-2">Display Name</label>
                <input
                  type="text"
                  value={profile.displayName || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="How neighbors will see you (e.g., Alex C.)"
                  className="w-full px-4 py-3 border-4 border-black rounded-xl bg-white fairfield-body"
                  maxLength={50}
                />
              </div>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={profile.directoryOptIn || false}
                  onChange={(e) => setProfile(prev => ({ ...prev, directoryOptIn: e.target.checked }))}
                  className="w-5 h-5 border-2 border-black rounded"
                />
                <div>
                  <span className="fairfield-caption font-medium">List me in the campaign directory</span>
                  <p className="fairfield-caption text-xs">
                    Let neighbors in your ward find and connect with you
                  </p>
                </div>
              </label>
              
              <div className="flex gap-3">
                <button
                  onClick={() => updateProfile(profile)}
                  className="fairfield-btn fairfield-btn-primary flex-1"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowProfile(false)}
                  className="fairfield-btn fairfield-btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="fairfield-body text-sm mb-2">
                <strong>Display Name:</strong> {profile.displayName || 'Not set'}
              </p>
              <p className="fairfield-body text-sm">
                <strong>Directory Listing:</strong> {profile.directoryOptIn ? 'Visible to neighbors' : 'Private'}
              </p>
            </div>
          )}
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="fairfield-card max-w-sm w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="fairfield-heading text-xl">Invite Neighbors</h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="p-2 fairfield-btn fairfield-btn-secondary rounded-full"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-4 border-black mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-auto" />
                </div>
                
                <p className="fairfield-body text-sm mb-3">
                  Show this QR code to neighbors to invite them to join Fairfield Voice
                </p>
                
                <div className="fairfield-card">
                  <p className="fairfield-caption text-xs break-all">
                    Invite URL: {inviteUrl || `${window.location.origin}/join`}
                  </p>
                </div>
                
                <button
                  onClick={() => navigator.clipboard.writeText(inviteUrl || `${window.location.origin}/join`)}
                  className="fairfield-btn fairfield-btn-secondary mt-3 w-full"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="space-y-4">
          
          {/* Support Card */}
          <Link href={progress?.unlocked3 ? "/support" : "#"} className="block">
            <div className={`fairfield-card ${
              progress?.unlocked3 
                ? "fairfield-card-interactive" 
                : "fairfield-card-disabled"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`fairfield-icon-container ${
                  progress?.unlocked3 ? "fairfield-icon-green" : "fairfield-icon-gray"
                }`}>
                  <HeartIcon className="fairfield-icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="fairfield-heading text-xl mb-2">Add Your Name</h3>
                  <p className="fairfield-body">Join the list of local supporters publicly backing the campaign</p>
                </div>
              </div>
              {!progress?.unlocked3 && (
                <div className="fairfield-status fairfield-status-locked mt-4">
                  Available after 3 accepted invites
                </div>
              )}
            </div>
          </Link>

          {/* Events Card */}
          <Link href={progress?.unlocked3 ? "/events" : "#"} className="block">
            <div className={`fairfield-card ${
              progress?.unlocked3 
                ? "fairfield-card-interactive" 
                : "fairfield-card-disabled"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`fairfield-icon-container ${
                  progress?.unlocked3 ? "fairfield-icon-blue" : "fairfield-icon-gray"
                }`}>
                  <CalendarIcon className="fairfield-icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="fairfield-heading text-xl mb-2">Meet the Candidate</h3>
                  <p className="fairfield-body">RSVP to town halls and community meetups</p>
                </div>
              </div>
              {!progress?.unlocked3 && (
                <div className="fairfield-status fairfield-status-locked mt-4">
                  Available after 3 accepted invites
                </div>
              )}
            </div>
          </Link>

          {/* Volunteer Card */}
          <Link href={progress?.unlocked3 ? "/volunteer" : "#"} className="block">
            <div className={`fairfield-card ${
              progress?.unlocked3 
                ? "fairfield-card-interactive" 
                : "fairfield-card-disabled"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`fairfield-icon-container ${
                  progress?.unlocked3 ? "fairfield-icon-purple" : "fairfield-icon-gray"
                }`}>
                  <UserGroupIcon className="fairfield-icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="fairfield-heading text-xl mb-2">Get Involved</h3>
                  <p className="fairfield-body">Sign up to canvass, phone bank, or host a neighborhood meeting</p>
                </div>
              </div>
              {!progress?.unlocked3 && (
                <div className="fairfield-status fairfield-status-locked mt-4">
                  Available after 3 accepted invites
                </div>
              )}
            </div>
          </Link>

          {/* Community Leader Badge (9+) */}
          {progress?.unlocked9 && (
            <div className="fairfield-card fairfield-card-leader">
              <div className="text-center">
                <h3 className="fairfield-heading text-2xl mb-2">🏙️ Community Leader</h3>
                <p className="fairfield-body">Advanced supporter tools available</p>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Footer */}
        <div className="fairfield-footer">
          <p className="fairfield-footer-primary text-sm">
            Paid for by Friends of [Candidate Name]
          </p>
          <p className="fairfield-footer-secondary text-xs">
            Building trust through technology • Fairfield, CA
          </p>
        </div>
      </div>
    </div>
  );
}
