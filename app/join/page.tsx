"use client";

import { useState, useEffect, Suspense } from "react";
import { Magic } from "magic-sdk";
import { useRouter, useSearchParams } from "next/navigation";

// Get Magic publishable key
const MAGIC_PK = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;

const wards = [
  { id: "W-1", name: "Ward 1 - Downtown" },
  { id: "W-2", name: "Ward 2 - Eastside" },
  { id: "W-3", name: "Ward 3 - Westside" },
  { id: "W-4", name: "Ward 4 - Northside" }
];

function JoinPageContent() {
  const [email, setEmail] = useState("");
  const [ward, setWard] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);
  const [magic, setMagic] = useState<Magic | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteRef = searchParams.get("ref");

  useEffect(() => {
    if (!MAGIC_PK) {
      console.error('[Magic] Missing NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY');
      return; // leave UI to show friendly message below
    }
    
    const m = new Magic(MAGIC_PK);
    setMagic(m);
    
    // Check if already logged in
    m.user.isLoggedIn().then(async (isLoggedIn) => {
      setIsAuthenticated(isLoggedIn);
      
      if (isLoggedIn) {
        // Check if user has already completed setup
        try {
          const token = await m.user.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const { user } = await response.json();
            if (user?.hasCompletedSetup) {
              // User already completed setup, redirect to home
              router.push('/home');
              return;
            }
            // Pre-fill email if available
            if (user?.email) {
              setEmail(user.email);
            }
            setHasCompletedSetup(false);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!magic || !email) return;
    
    setIsLoading(true);
    try {
      await magic.auth.loginWithMagicLink({ email });
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
    setIsLoading(false);
  };

  const handleComplete = async () => {
    if (!magic || !ward) return;
    
    setIsLoading(true);
    try {
      const token = await magic.user.getIdToken();
      
      // Upsert user with ward and phone
      const response = await fetch("/api/auth/upsert", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          ward,
          emailOptIn: true
        })
      });

      if (!response.ok) throw new Error("Failed to save user");

      // If there's an invite ref, accept it
      if (inviteRef) {
        await fetch("/api/invite/accept", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ slug: inviteRef })
        });
      }

      // Redirect to home
      router.push("/home");
    } catch (error) {
      console.error("Setup failed:", error);
      alert("Setup failed. Please try again.");
    }
    setIsLoading(false);
  };

  // Show configuration error if Magic key is missing
  if (!MAGIC_PK) {
    return (
      <div className="min-h-screen theme-fairfield-voice" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
        <div className="flex items-center justify-center p-6 min-h-screen">
          <div className="max-w-md w-full fairfield-card backdrop-blur-md">
            <h2 className="fairfield-heading text-xl mb-2 text-red-600">Configuration Required</h2>
            <p className="fairfield-body text-sm mb-4">
              The Magic authentication service isn't configured. Please contact an administrator to add the
              <code className="mx-1 px-1 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY</code>
              environment variable.
            </p>
            <p className="fairfield-caption text-xs text-[var(--fairfield-text-muted)]">
              This is required for secure email-based authentication.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen theme-fairfield-voice" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
        <div className="px-4 py-8 min-h-screen flex items-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="fairfield-card fairfield-card-glass">
              <div className="text-center mb-8">
                <h1 className="fairfield-display text-2xl mb-2">
                  Welcome to Fairfield Voice
                </h1>
                <p className="fairfield-body text-[var(--fairfield-text-secondary)]">
                  {inviteRef ? "You've been invited to join!" : "Make your voice heard in local government"}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block fairfield-caption text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-[var(--fairfield-glass-border)] bg-[var(--fairfield-glass)] backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-[var(--fairfield-accent)] focus:border-[var(--fairfield-accent)] text-lg transition-all"
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={!email || isLoading}
                  className="fairfield-btn fairfield-btn-primary w-full"
                >
                  {isLoading ? "Sending..." : "Send Magic Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-fairfield-voice" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
      <div className="px-4 py-8 min-h-screen flex items-center">
        <div className="max-w-sm mx-auto w-full">
          <div className="fairfield-card fairfield-card-accent">
            <div className="text-center mb-8">
              <h1 className="fairfield-display text-2xl mb-2">
                Select Your Ward
              </h1>
              <p className="fairfield-body text-[var(--fairfield-text-secondary)]">
                Choose your neighborhood to connect with local issues
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {wards.map((w) => (
                <label key={w.id} className="flex items-center p-4 border border-[var(--fairfield-glass-border)] bg-[var(--fairfield-glass)] backdrop-blur-sm rounded-xl cursor-pointer hover:border-[var(--fairfield-accent)] hover:bg-[var(--fairfield-card-hover)] has-[:checked]:border-[var(--fairfield-accent)] has-[:checked]:bg-gradient-to-r has-[:checked]:from-blue-500/10 has-[:checked]:to-blue-600/5 transition-all duration-300">
                  <input
                    type="radio"
                    name="ward"
                    value={w.id}
                    checked={ward === w.id}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-4 h-4 text-[var(--fairfield-accent)] focus:ring-[var(--fairfield-accent)]"
                  />
                  <span className="ml-3 fairfield-body font-medium">{w.name}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={!ward || isLoading}
              className="fairfield-btn fairfield-btn-primary w-full"
            >
              {isLoading ? "Setting up..." : "Complete Setup"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-blue-50 flex items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <JoinPageContent />
    </Suspense>
  );
}
