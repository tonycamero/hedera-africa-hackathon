"use client";

import { useState, useEffect } from "react";
import { Magic } from "magic-sdk";
import Link from "next/link";
import { ArrowLeftIcon, UserGroupIcon, MagnifyingGlassIcon, UserPlusIcon, InboxIcon } from "@heroicons/react/24/outline";

interface Contact {
  issuer: string;
  displayName: string | null;
  ward: string | null;
  since?: number;
}

interface DirectoryPerson {
  issuer: string;
  displayName: string;
  ward: string | null;
}

interface ContactRequest {
  nonce: string;
  inviter: {
    issuer: string;
    displayName: string | null;
    ward: string | null;
  };
  timestamp: number;
  ward: string | null;
}

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<'circle' | 'directory' | 'requests'>('circle');
  const [magic, setMagic] = useState<Magic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // My Circle data
  const [myContacts, setMyContacts] = useState<Contact[]>([]);
  
  // Directory data
  const [directoryPeople, setDirectoryPeople] = useState<DirectoryPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  
  // Requests data
  const [pendingRequests, setPendingRequests] = useState<ContactRequest[]>([]);
  
  // Loading states
  const [requestingContact, setRequestingContact] = useState<string | null>(null);
  const [confirmingRequest, setConfirmingRequest] = useState<string | null>(null);

  const wards = [
    { id: "", name: "All Wards" },
    { id: "W-1", name: "Ward 1 - Downtown" },
    { id: "W-2", name: "Ward 2 - Eastside" },
    { id: "W-3", name: "Ward 3 - Westside" },
    { id: "W-4", name: "Ward 4 - Northside" }
  ];

  useEffect(() => {
    const m = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!);
    setMagic(m);
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'directory') {
      loadDirectory();
    } else if (activeTab === 'requests') {
      loadRequests();
    }
  }, [activeTab, searchQuery, selectedWard]);

  const loadInitialData = async () => {
    await loadMyContacts();
    setIsLoading(false);
  };

  const loadMyContacts = async () => {
    try {
      if (!magic) return;
      
      const token = await magic.user.getIdToken();
      const response = await fetch("/api/contacts/mine", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
  };

  const loadDirectory = async () => {
    try {
      if (!magic) return;
      
      const token = await magic.user.getIdToken();
      const params = new URLSearchParams();
      if (selectedWard) params.append('ward', selectedWard);
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      
      const response = await fetch(`/api/contacts/directory?${params}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDirectoryPeople(data.people || []);
      }
    } catch (error) {
      console.error("Failed to load directory:", error);
    }
  };

  const loadRequests = async () => {
    try {
      if (!magic) return;
      
      const token = await magic.user.getIdToken();
      const response = await fetch("/api/contacts/inbox", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  };

  const requestContact = async (targetIssuer: string) => {
    if (!magic) return;
    
    setRequestingContact(targetIssuer);
    try {
      const token = await magic.user.getIdToken();
      const response = await fetch("/api/contacts/request", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetIssuer })
      });
      
      if (response.ok) {
        alert("Contact request sent!");
        loadDirectory(); // Refresh to remove from available list
      } else {
        alert("Failed to send request. Please try again.");
      }
    } catch (error) {
      console.error("Failed to request contact:", error);
      alert("Failed to send request. Please try again.");
    }
    setRequestingContact(null);
  };

  const confirmRequest = async (inviterIssuer: string) => {
    if (!magic) return;
    
    setConfirmingRequest(inviterIssuer);
    try {
      const token = await magic.user.getIdToken();
      const response = await fetch("/api/contacts/confirm", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inviterIssuer })
      });
      
      if (response.ok) {
        alert("Contact confirmed! They've been added to your Circle of Trust.");
        loadRequests(); // Refresh requests
        loadMyContacts(); // Refresh my contacts
      } else {
        alert("Failed to confirm request. Please try again.");
      }
    } catch (error) {
      console.error("Failed to confirm request:", error);
      alert("Failed to confirm request. Please try again.");
    }
    setConfirmingRequest(null);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="fairfield-page">
        <div className="fairfield-container">
          <div className="fairfield-card text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="fairfield-body">Loading contacts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fairfield-page">
      <div className="fairfield-container">
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/home" className="p-2 -ml-2 rounded-lg hover:bg-white/50">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="fairfield-heading text-2xl ml-4">Find Neighbors</h1>
        </div>

        {/* Tab Navigation */}
        <div className="fairfield-card mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('circle')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'circle'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserGroupIcon className="w-4 h-4 inline mr-2" />
              My Circle ({myContacts.length})
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'directory'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MagnifyingGlassIcon className="w-4 h-4 inline mr-2" />
              Directory
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'requests'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <InboxIcon className="w-4 h-4 inline mr-2" />
              Requests ({pendingRequests.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'circle' && (
          <div className="space-y-4">
            {myContacts.length === 0 ? (
              <div className="fairfield-card text-center">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="fairfield-heading text-lg mb-2">No contacts yet</h3>
                <p className="fairfield-body text-sm mb-4">
                  Start building your Circle of Trust by finding neighbors in the Directory.
                </p>
                <button
                  onClick={() => setActiveTab('directory')}
                  className="fairfield-btn fairfield-btn-primary"
                >
                  <MagnifyingGlassIcon className="fairfield-icon" />
                  Find Neighbors
                </button>
              </div>
            ) : (
              <>
                {myContacts.map((contact) => (
                  <div key={contact.issuer} className="fairfield-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="fairfield-heading text-lg">
                          {contact.displayName || "Anonymous Neighbor"}
                        </h4>
                        <p className="fairfield-caption text-sm">
                          {contact.ward || "Ward Unknown"}
                          {contact.since && (
                            <span className="text-gray-500"> • Connected {formatTimestamp(contact.since)}</span>
                          )}
                        </p>
                      </div>
                      <div className="fairfield-icon-container fairfield-icon-green">
                        <UserGroupIcon className="fairfield-icon" />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="fairfield-card bg-blue-50">
                  <div className="text-center">
                    <h4 className="fairfield-heading text-base mb-2">Invite More Neighbors</h4>
                    <p className="fairfield-caption text-sm mb-4">
                      Use QR codes for face-to-face invites or find people in the directory
                    </p>
                    <div className="flex gap-3">
                      <Link href="/home" className="fairfield-btn fairfield-btn-secondary flex-1">
                        Show QR Code
                      </Link>
                      <button
                        onClick={() => setActiveTab('directory')}
                        className="fairfield-btn fairfield-btn-primary flex-1"
                      >
                        Browse Directory
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="space-y-4">
            {/* Search Controls */}
            <div className="fairfield-card">
              <div className="space-y-4">
                <div>
                  <label className="block fairfield-caption text-sm mb-2">Search by name</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search neighbors..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block fairfield-caption text-sm mb-2">Filter by ward</label>
                  <select
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {wards.map((ward) => (
                      <option key={ward.id} value={ward.id}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Directory Results */}
            <div className="space-y-3">
              {directoryPeople.length === 0 ? (
                <div className="fairfield-card text-center">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="fairfield-heading text-lg mb-2">No neighbors found</h4>
                  <p className="fairfield-caption text-sm">
                    Try adjusting your search or check back later as more people join the directory.
                  </p>
                </div>
              ) : (
                directoryPeople.map((person) => (
                  <div key={person.issuer} className="fairfield-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="fairfield-heading text-lg">{person.displayName}</h4>
                        <p className="fairfield-caption text-sm">{person.ward || "Ward Unknown"}</p>
                      </div>
                      <button
                        onClick={() => requestContact(person.issuer)}
                        disabled={requestingContact === person.issuer}
                        className="fairfield-btn fairfield-btn-primary"
                      >
                        {requestingContact === person.issuer ? (
                          "Sending..."
                        ) : (
                          <>
                            <UserPlusIcon className="fairfield-icon" />
                            Connect
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="fairfield-card text-center">
                <InboxIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="fairfield-heading text-lg mb-2">No pending requests</h4>
                <p className="fairfield-caption text-sm">
                  When neighbors send you connection requests, they'll appear here.
                </p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.nonce} className="fairfield-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="fairfield-heading text-lg mb-1">
                        {request.inviter.displayName || "Anonymous Neighbor"}
                      </h4>
                      <p className="fairfield-caption text-sm text-gray-600 mb-2">
                        {request.inviter.ward || "Ward Unknown"} • {formatTimestamp(request.timestamp)}
                      </p>
                      <p className="fairfield-body text-sm">
                        Wants to connect and join your Circle of Trust
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => confirmRequest(request.inviter.issuer)}
                        disabled={confirmingRequest === request.inviter.issuer}
                        className="fairfield-btn fairfield-btn-primary text-sm px-3 py-2"
                      >
                        {confirmingRequest === request.inviter.issuer ? "Accepting..." : "Accept"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}