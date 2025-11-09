"use client";

import { useEffect, useState } from "react";
import { signalsStore, type BondedContact } from "@/lib/stores/signalsStore";
import { getBondedContactsFromHCS, getTrustLevelsPerContact } from "@/lib/services/HCSDataUtils";
import { getSessionId } from "@/lib/session";
import { Users, Heart } from "lucide-react";

export default function TrustGraphPage() {
  const [contacts, setContacts] = useState<BondedContact[]>([]);
  const [trustLevels, setTrustLevels] = useState<Map<string, { allocatedTo: number; receivedFrom: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = getSessionId() || "tm-alex-chen";
    const allEvents = signalsStore.getAll();
    const bondedContacts = getBondedContactsFromHCS(allEvents, sessionId);
    const trustData = getTrustLevelsPerContact(allEvents, sessionId);

    setContacts(bondedContacts);
    setTrustLevels(trustData);
    setLoading(false);
  }, []);

  const innerCircle = contacts.filter(c => {
    const trust = trustLevels.get(c.peerId || c.id);
    return trust && trust.allocatedTo > 0;
  });

  const otherContacts = contacts.filter(c => {
    const trust = trustLevels.get(c.peerId || c.id);
    return !trust || trust.allocatedTo === 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-genz-text">Loading trust graph...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-pri-500 mb-2">Trust Graph</h1>
          <p className="text-genz-text-dim">
            Your Circle of 9 and recognition network
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-panel rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-pri-400" />
              <div className="text-sm text-genz-text-dim">Inner Circle</div>
            </div>
            <div className="text-2xl font-bold text-pri-400">{innerCircle.length}/9</div>
          </div>

          <div className="bg-panel rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-sec-400" />
              <div className="text-sm text-genz-text-dim">Total Contacts</div>
            </div>
            <div className="text-2xl font-bold text-sec-400">{contacts.length}</div>
          </div>

          <div className="bg-panel rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-boost-400" />
              <div className="text-sm text-genz-text-dim">Network Size</div>
            </div>
            <div className="text-2xl font-bold text-boost-400">{contacts.length}</div>
          </div>
        </div>

        {/* Inner Circle */}
        {innerCircle.length > 0 && (
          <div className="bg-panel rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-genz-text mb-4">Inner Circle (Trust Allocated)</h2>
            <div className="space-y-3">
              {innerCircle.map(contact => {
                const trust = trustLevels.get(contact.peerId || contact.id);
                const displayName = contact.handle || `User ${contact.peerId?.slice(-6)}`;

                return (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div>
                      <div className="font-medium text-genz-text">{displayName}</div>
                      <div className="text-sm text-genz-text-dim">Trust: {trust?.allocatedTo || 0} tokens</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-pri-400">Received: {trust?.receivedFrom || 0}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Contacts */}
        {otherContacts.length > 0 && (
          <div className="bg-panel rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-genz-text mb-4">Network Contacts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherContacts.map(contact => {
                const trust = trustLevels.get(contact.peerId || contact.id);
                const displayName = contact.handle || `User ${contact.peerId?.slice(-6)}`;

                return (
                  <div key={contact.id} className="p-3 bg-black/20 rounded-lg">
                    <div className="font-medium text-genz-text">{displayName}</div>
                    <div className="text-sm text-genz-text-dim">
                      {trust?.receivedFrom ? `${trust.receivedFrom} props received` : "No interactions yet"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {contacts.length === 0 && (
          <div className="bg-panel rounded-xl p-12 border border-white/10 text-center">
            <Users className="w-16 h-16 text-genz-text-dim mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-genz-text mb-2">No contacts yet</h3>
            <p className="text-genz-text-dim">
              Add friends and start building your trust network
            </p>
          </div>
        )}

        {/* Explainer */}
        <div className="bg-panel rounded-xl p-6 border border-white/10">
          <h3 className="font-semibold text-genz-text mb-3">About Circle of 9</h3>
          <p className="text-sm text-genz-text-dim leading-relaxed">
            Your Inner Circle represents your closest trusted relationships. You can allocate up to 9 trust tokens (25 each) to people you trust deeply. This bounded trust model creates meaningful relationships without infinite social graph sprawl.
          </p>
          <p className="text-sm text-genz-text-dim leading-relaxed mt-3">
            All trust allocations are recorded immutably on Hedera HCS, creating a transparent and verifiable reputation network.
          </p>
        </div>
      </div>
    </div>
  );
}
