"use client";

import { useState, useEffect } from "react";
import { Magic } from "magic-sdk";
import Link from "next/link";
import { QrCodeIcon, UserGroupIcon, CalendarIcon, HeartIcon } from "@heroicons/react/24/outline";

export default function HomePage() {
  const [progress, setProgress] = useState<{
    accepted: number;
    unlocked3: boolean;
    unlocked9: boolean;
  } | null>(null);
  const [magic, setMagic] = useState<Magic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const m = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!);
    setMagic(m);
    
    loadProgress();
  }, []);

  const loadProgress = async () => {
    if (!magic) return;
    
    try {
      const isLoggedIn = await magic.user.isLoggedIn();
      if (!isLoggedIn) {
        window.location.href = "/join";
        return;
      }

      const token = await magic.user.getIdToken();
      const response = await fetch("/api/progress", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
    setIsLoading(false);
  };

  const createInvite = async () => {
    if (!magic) return;
    
    try {
      const token = await magic.user.getIdToken();
      const response = await fetch("/api/invite/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const { url } = await response.json();
        if (navigator.share) {
          await navigator.share({
            title: "Join Fairfield Voice",
            text: "I'd like to invite you to join our local government engagement platform!",
            url
          });
        } else {
          await navigator.clipboard.writeText(url);
          alert("Invite link copied to clipboard!");
        }
        
        // Refresh progress
        setTimeout(loadProgress, 1000);
      }
    } catch (error) {
      console.error("Failed to create invite:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getCircleStatus = () => {
    if (!progress) return "Getting started";
    if (progress.accepted >= 9) return "Inner Circle Complete! 🎉";
    if (progress.accepted >= 3) return "Building momentum 🚀";
    if (progress.accepted >= 1) return "Great start! 👍";
    return "Ready to grow 🌱";
  };

  const getUnlockMessage = () => {
    if (!progress) return "";
    if (progress.accepted >= 9) return "All features unlocked!";
    if (progress.accepted >= 3) return "Core features unlocked!";
    return `${3 - progress.accepted} more invites to unlock features`;
  };

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-6">
      <div className="max-w-sm mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Fairfield Voice</h1>
          <p className="text-gray-600 text-sm">Your civic engagement hub</p>
        </div>

        {/* Inner Circle Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Inner Circle</h2>
            <p className="text-sm text-gray-600">{getCircleStatus()}</p>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray={`${Math.min((progress?.accepted || 0) / 9 * 100, 100)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">
                  {progress?.accepted || 0}/9
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-600 mb-4">
            {getUnlockMessage()}
          </p>
          
          <button
            onClick={createInvite}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <QrCodeIcon className="w-5 h-5" />
            <span>Create Invite</span>
          </button>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          
          {/* Support Card */}
          <Link href={progress?.unlocked3 ? "/support" : "#"}>
            <div className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${
              progress?.unlocked3 
                ? "hover:shadow-xl cursor-pointer" 
                : "opacity-60 cursor-not-allowed"
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${
                  progress?.unlocked3 ? "bg-green-100" : "bg-gray-100"
                }`}>
                  <HeartIcon className={`w-6 h-6 ${
                    progress?.unlocked3 ? "text-green-600" : "text-gray-400"
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Show Support</h3>
                  <p className="text-sm text-gray-600">Express support for local initiatives</p>
                </div>
              </div>
              {!progress?.unlocked3 && (
                <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  🔒 Unlocks at 3 accepted invites
                </div>
              )}
            </div>
          </Link>

          {/* Events Card */}
          <Link href={progress?.unlocked3 ? "/events" : "#"}>
            <div className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${
              progress?.unlocked3 
                ? "hover:shadow-xl cursor-pointer" 
                : "opacity-60 cursor-not-allowed"
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${
                  progress?.unlocked3 ? "bg-blue-100" : "bg-gray-100"
                }`}>
                  <CalendarIcon className={`w-6 h-6 ${
                    progress?.unlocked3 ? "text-blue-600" : "text-gray-400"
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Local Events</h3>
                  <p className="text-sm text-gray-600">Attend town halls and meetings</p>
                </div>
              </div>
              {!progress?.unlocked3 && (
                <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  🔒 Unlocks at 3 accepted invites
                </div>
              )}
            </div>
          </Link>

          {/* Volunteer Card */}
          <Link href={progress?.unlocked3 ? "/volunteer" : "#"}>
            <div className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${
              progress?.unlocked3 
                ? "hover:shadow-xl cursor-pointer" 
                : "opacity-60 cursor-not-allowed"
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${
                  progress?.unlocked3 ? "bg-purple-100" : "bg-gray-100"
                }`}>
                  <UserGroupIcon className={`w-6 h-6 ${
                    progress?.unlocked3 ? "text-purple-600" : "text-gray-400"
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Volunteer</h3>
                  <p className="text-sm text-gray-600">Help with campaigns and outreach</p>
                </div>
              </div>
              {!progress?.unlocked3 && (
                <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  🔒 Unlocks at 3 accepted invites
                </div>
              )}
            </div>
          </Link>

          {/* Extra Features for Inner Circle (9+) */}
          {progress?.unlocked9 && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">🏆 Inner Circle Exclusive</h3>
                <p className="text-sm opacity-90">Premium features unlocked!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}