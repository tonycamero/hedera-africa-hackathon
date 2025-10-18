"use client";

import { useState, useEffect } from "react";
import { Magic } from "magic-sdk";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function VolunteerPage() {
  const [roles, setRoles] = useState({
    door: false,
    phone: false,
    ride: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [magic, setMagic] = useState<Magic | null>(null);

  useEffect(() => {
    const m = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!);
    setMagic(m);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magic) return;

    setIsLoading(true);
    try {
      const token = await magic.user.getIdToken();
      const response = await fetch("/api/volunteer/save", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(roles)
      });

      if (response.ok) {
        alert("Thank you for volunteering! Your commitment has been recorded on the blockchain.");
        setTimeout(() => {
          window.location.href = "/home";
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to save volunteer info:", error);
      alert("Failed to save your volunteer information. Please try again.");
    }
    setIsLoading(false);
  };

  const toggleRole = (role: keyof typeof roles) => {
    setRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const hasSelectedRoles = Object.values(roles).some(Boolean);

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-6">
      <div className="max-w-sm mx-auto">
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/home" className="p-2 -ml-2 rounded-lg hover:bg-white/50">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-4">Volunteer</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Intro */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Help Your Community
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose the volunteer roles you're interested in. Your selections 
              will help local organizers match you with meaningful opportunities.
            </p>
          </div>

          {/* Volunteer Roles */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Available Roles</h3>
            
            <div className="space-y-4">
              
              {/* Door-to-Door */}
              <div 
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  roles.door 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => toggleRole('door')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Door-to-Door Outreach</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Visit neighborhoods to share information and gather community input
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    roles.door ? "bg-blue-500 border-blue-500" : "border-gray-300"
                  }`}>
                    {roles.door && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone Banking */}
              <div 
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  roles.phone 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => toggleRole('phone')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Phone Banking</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Make calls to residents about upcoming events and initiatives
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    roles.phone ? "bg-blue-500 border-blue-500" : "border-gray-300"
                  }`}>
                    {roles.phone && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Ride Assistance */}
              <div 
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  roles.ride 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => toggleRole('ride')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Transportation Assistance</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Help community members get to important meetings and events
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    roles.ride ? "bg-blue-500 border-blue-500" : "border-gray-300"
                  }`}>
                    {roles.ride && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-xs text-purple-800">
              <strong>Privacy:</strong> Your volunteer preferences are recorded anonymously 
              on the Hedera blockchain. Personal contact information stays private and secure.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!hasSelectedRoles || isLoading}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors text-lg"
          >
            {isLoading ? "Saving..." : "Submit Volunteer Interest"}
          </button>

          {!hasSelectedRoles && (
            <p className="text-center text-sm text-gray-500">
              Please select at least one volunteer role to continue
            </p>
          )}
        </form>
      </div>
    </div>
  );
}