// lib/services/HCS2RegistryClient.ts
"use client";

// Using fallback mode until HCS-2 SDK dependencies are resolved
// import { HCS2BrowserClient, HCS2RegistryType } from "@hashgraphonline/standards-sdk";
import { hederaClient } from '@/packages/hedera/HederaClient'

export type FlexRegistryKeys =
  | "topic/feed"
  | "topic/contacts"
  | "topic/trust"
  | "topic/recognition"
  | "topic/profile"
  | "topic/system";

export type FlexEntry = {
  key: FlexRegistryKeys;
  value: {
    topicId: string;
    network: "testnet" | "mainnet";
    version?: number;
    memo?: string;
    owner?: string;
  };
  uid?: string; // hcs-2 entry uid when indexed
};

export type TrustMeshTopics = {
  feed?: string
  contacts?: string
  trust?: string
  recognition?: string
  profiles?: string
  system?: string
}

export class HCS2RegistryClient {
  private client: any; // HCS2BrowserClient placeholder
  private registryId: string
  private cachedTopics: TrustMeshTopics | null = null

  constructor(params?: { registryId?: string; network?: "testnet" | "mainnet"; signer?: any }) {
    const network = params?.network ?? (process.env.NEXT_PUBLIC_HEDERA_NETWORK as "testnet" | "mainnet");
    // this.client = new HCS2BrowserClient({ network, signer: params?.signer }); // read-only works without signer
    this.registryId = params?.registryId ?? (process.env.NEXT_PUBLIC_FLEX_REGISTRY_ID || "");
    console.log('[HCS2Registry] Initialized in fallback mode - network:', network, 'registryId:', this.registryId);
  }

  getRegistryId() {
    return this.registryId;
  }

  async ensureRegistry(): Promise<string> {
    if (this.registryId) return this.registryId;
    
    // Fallback mode: simulate registry creation
    console.log('[HCS2Registry] Simulating registry creation (fallback mode)');
    this.registryId = 'fallback-registry-0.0.simulation';
    return this.registryId;
  }

  async getEntry(key: FlexRegistryKeys): Promise<FlexEntry | null> {
    if (!this.registryId) return null;
    
    // Fallback mode: return verified topics
    const verifiedTopics = {
      "topic/feed": { topicId: "0.0.6896005", network: "testnet" as const, version: 1 },
      "topic/contacts": { topicId: "0.0.6896005", network: "testnet" as const, version: 1 },
      "topic/trust": { topicId: "0.0.6896005", network: "testnet" as const, version: 1 },
      "topic/recognition": { topicId: "0.0.6895261", network: "testnet" as const, version: 1 },
      "topic/profile": { topicId: "0.0.6896008", network: "testnet" as const, version: 1 },
      "topic/system": { topicId: "0.0.6896008", network: "testnet" as const, version: 1 }
    };
    
    const value = verifiedTopics[key];
    if (!value) return null;
    
    return { key, value, uid: `uid-${key}` };
  }

  async setEntry(key: FlexRegistryKeys, value: FlexEntry["value"], uid?: string) {
    if (!this.registryId) throw new Error("Registry not initialized");
    console.log(`[HCS2Registry] Would ${uid ? 'update' : 'register'} ${key} = ${value.topicId} (fallback mode)`);
    return { success: true, uid: uid || `uid-${key}` };
  }

  async listAll(): Promise<FlexEntry[]> {
    if (!this.registryId) return [];
    
    // Return all verified topics
    const entries: FlexEntry[] = [
      { key: "topic/feed", value: { topicId: "0.0.6896005", network: "testnet", version: 1 }, uid: "uid-topic/feed" },
      { key: "topic/contacts", value: { topicId: "0.0.6896005", network: "testnet", version: 1 }, uid: "uid-topic/contacts" },
      { key: "topic/trust", value: { topicId: "0.0.6896005", network: "testnet", version: 1 }, uid: "uid-topic/trust" },
      { key: "topic/recognition", value: { topicId: "0.0.6895261", network: "testnet", version: 1 }, uid: "uid-topic/recognition" },
      { key: "topic/profile", value: { topicId: "0.0.6896008", network: "testnet", version: 1 }, uid: "uid-topic/profile" },
      { key: "topic/system", value: { topicId: "0.0.6896008", network: "testnet", version: 1 }, uid: "uid-topic/system" }
    ];
    
    return entries;
  }

  // Legacy compatibility methods
  async getOrCreateRegistry(): Promise<string> {
    return this.ensureRegistry();
  }

  async registerTopics(topics: TrustMeshTopics): Promise<void> {
    if (!this.registryTopicId) {
      await this.getOrCreateRegistry()
    }

    console.log('[HCS2Registry] Registering topics in registry (fallback mode)...')
    
    // In fallback mode, just log the topics that would be registered
    Object.entries(topics).forEach(([type, topicId]) => {
      if (topicId) {
        console.log(`[HCS2Registry] Would register ${type} topic: ${topicId}`)
      }
    })
    
    console.log('[HCS2Registry] Topic registration simulation complete')
  }

  async resolveTopics(): Promise<TrustMeshTopics> {
    if (this.cachedTopics) {
      return this.cachedTopics
    }

    await this.ensureRegistry();
    
    console.log('[HCS2Registry] Resolving topics from registry (Flex mode)...')

    // Use new Flex pattern - resolve from entries
    const [feed, contacts, trust, recognition, profile, system] = await Promise.all([
      this.getEntry("topic/feed"),
      this.getEntry("topic/contacts"),
      this.getEntry("topic/trust"),
      this.getEntry("topic/recognition"),
      this.getEntry("topic/profile"),
      this.getEntry("topic/system"),
    ]);

    const topics: TrustMeshTopics = {
      feed: feed?.value?.topicId,
      contacts: contacts?.value?.topicId,
      trust: trust?.value?.topicId,
      recognition: recognition?.value?.topicId,
      profiles: profile?.value?.topicId,
      system: system?.value?.topicId
    };
    
    this.cachedTopics = topics;
    console.log('[HCS2Registry] Resolved topics (Flex):', topics);
    return topics;
  }

  private async registerDiscoveredTopics(): Promise<void> {
    const discoveredTopics = this.getDiscoveredTopics()
    await this.registerTopics(discoveredTopics)
  }

  private getDiscoveredTopics(): TrustMeshTopics {
    // Return the topics we verified from your HCS transactions
    return {
      feed: '0.0.6896005',        // contacts + trust
      contacts: '0.0.6896005',    // shared with feed
      trust: '0.0.6896005',       // shared with feed
      recognition: '0.0.6895261', // recognition definitions
      system: '0.0.6896008'       // system messages
    }
  }

  async updateTopic(type: keyof TrustMeshTopics, newTopicId: string): Promise<void> {
    if (!this.registryTopicId) {
      await this.getOrCreateRegistry()
    }

    console.log(`[HCS2Registry] Would update ${type} topic to ${newTopicId} (fallback mode)`)
    
    // Clear cache to force re-resolution
    this.cachedTopics = null
    
    console.log(`[HCS2Registry] Topic update simulation complete for ${type}`)
  }

  getRegistryTopicId(): string | null {
    return this.registryId
  }
}

// Singleton instances
export const hcs2Registry = new HCS2RegistryClient(); // Legacy compatibility
export const flexRegistry = new HCS2RegistryClient(); // New Flex branding
