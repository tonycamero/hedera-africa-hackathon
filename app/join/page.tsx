"use client";

import { useState, useEffect } from "react";
import { Magic } from "magic-sdk";
import { useRouter, useSearchParams } from "next/navigation";

const wards = [
  { id: "W-1", name: "Ward 1 - Downtown" },
  { id: "W-2", name: "Ward 2 - Eastside" },
  { id: "W-3", name: "Ward 3 - Westside" },
  { id: "W-4", name: "Ward 4 - Northside" }
];

export default function JoinPage() {
  const [phone, setPhone] = useState("");
  const [ward, setWard] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [magic, setMagic] = useState<Magic | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteRef = searchParams.get("ref");

  useEffect(() => {
    const m = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!);
    setMagic(m);
    
    // Check if already logged in
    m.user.isLoggedIn().then(setIsAuthenticated);
  }, []);

  const handleLogin = async () => {
    if (!magic || !phone) return;
    
    setIsLoading(true);
    try {
      await magic.auth.loginWithSMS({ phoneNumber: phone });
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
          phone,
          ward,
          smsOptIn: true
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-blue-50 px-4 py-8">
        <div className="max-w-sm mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Fairfield Voice
              </h1>
              <p className="text-gray-600">
                {inviteRef ? "You've been invited to join!" : "Make your voice heard in local government"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={!phone || isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {isLoading ? "Sending..." : "Send Login Code"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Select Your Ward
            </h1>
            <p className="text-gray-600">
              Choose your neighborhood to connect with local issues
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {wards.map((w) => (
              <label key={w.id} className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="ward"
                  value={w.id}
                  checked={ward === w.id}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-3 font-medium text-gray-900">{w.name}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleComplete}
            disabled={!ward || isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {isLoading ? "Setting up..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}