"use client";

import { useState, useEffect } from "react";
import { Magic } from "magic-sdk";
import { ArrowLeftIcon, CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  details?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [magic, setMagic] = useState<Magic | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  useEffect(() => {
    const m = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!);
    setMagic(m);
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch("/api/events/list");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    }
    setIsLoading(false);
  };

  const handleRSVP = async (eventId: string) => {
    if (!magic) return;
    
    setRsvpLoading(eventId);
    try {
      const token = await magic.user.getIdToken();
      const response = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        alert("RSVP confirmed! Your attendance has been recorded on the blockchain.");
      }
    } catch (error) {
      console.error("Failed to RSVP:", error);
      alert("Failed to RSVP. Please try again.");
    }
    setRsvpLoading(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-6">
      <div className="max-w-sm mx-auto">
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/home" className="p-2 -ml-2 rounded-lg hover:bg-white/50">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-4">Local Events</h1>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No upcoming events</h3>
            <p className="text-gray-600 text-sm">
              Check back soon for town halls, community meetings, and other local events.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-3">
                  {event.title}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{formatDate(event.startsAt)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                </div>

                {event.details && (
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                    {event.details}
                  </p>
                )}

                <button
                  onClick={() => handleRSVP(event.id)}
                  disabled={rsvpLoading === event.id}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {rsvpLoading === event.id ? "Confirming RSVP..." : "RSVP to Attend"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-100 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-800">
            <strong>Your Voice Matters:</strong> RSVPs are recorded on the Hedera blockchain 
            to ensure transparent participation tracking for local government events.
          </p>
        </div>
      </div>
    </div>
  );
}