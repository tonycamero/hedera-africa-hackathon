"use client";

import { useState, useEffect } from "react";
import { Magic } from "magic-sdk";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SupportPage() {
  const [supports, setSupports] = useState(false);
  const [contactPref, setContactPref] = useState("");
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
      const response = await fetch("/api/support/save", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          supports,
          contactPref
        })
      });

      if (response.ok) {
        alert("Thank you for your support! Your voice has been recorded on the blockchain.");
        setTimeout(() => {
          window.location.href = "/home";
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to save support:", error);
      alert("Failed to save your response. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-6">
      <div className="max-w-sm mx-auto">
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/home" className="p-2 -ml-2 rounded-lg hover:bg-white/50">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-4">Show Support</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Support Question */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Local Government Support
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Do you support increased funding for local infrastructure improvements, 
              including road repairs, park maintenance, and community facilities?
            </p>
            
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-500 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                <input
                  type="radio"
                  name="support"
                  value="yes"
                  checked={supports === true}
                  onChange={() => setSupports(true)}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-3 font-medium text-gray-900">Yes, I support this initiative</span>
              </label>
              
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                <input
                  type="radio"
                  name="support"
                  value="no"
                  checked={supports === false}
                  onChange={() => setSupports(false)}
                  className="w-4 h-4 text-red-600"
                />
                <span className="ml-3 font-medium text-gray-900">No, I do not support this</span>
              </label>
            </div>
          </div>

          {/* Contact Preference */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Stay Informed</h3>
            <p className="text-gray-600 text-sm mb-4">
              How would you like to receive updates about local government activities?
            </p>
            
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="contact"
                  value="email"
                  checked={contactPref === "email"}
                  onChange={(e) => setContactPref(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-3 text-gray-900">Email notifications</span>
              </label>
              
              <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="contact"
                  value="none"
                  checked={contactPref === "none"}
                  onChange={(e) => setContactPref(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-3 text-gray-900">No notifications</span>
              </label>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs text-yellow-800">
              <strong>Privacy:</strong> Your support position will be recorded anonymously 
              on the Hedera blockchain. Your email address stays private and secure.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors text-lg"
          >
            {isLoading ? "Recording your voice..." : "Submit Support"}
          </button>
        </form>
      </div>
    </div>
  );
}