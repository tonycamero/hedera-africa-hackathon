// lib/services/HCS2RegistryClient.ts
"use client";

// Using fallback mode until HCS-2 SDK dependencies are resolved
// import { HCS2BrowserClient, HCS2RegistryType } from "@hashgraphonline/standards-sdk";
import { hederaClient } from '@/packages/hedera/HederaClient'
import { TOPIC, HEDERA_NETWORK, REGISTRY_ID } from '@/lib/env'

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
    const network = params?.network ?? HEDERA_NETWORK;
    // this.client = new HCS2BrowserClient({ network, signer: params?.signer }); // read-only works without signer
    this.registryId = params?.registryId ?? REGISTRY_ID;
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
    
    // Use same environment variables as server-side registry
    const verifiedTopics = {
      "topic/feed": { topicId: TOPIC.recognition || "0.0.6895261", network: "testnet" as const, version: 1 },
      "topic/contacts": { topicId: TOPIC.contacts || "0.0.6896005", network: "testnet" as const, version: 1 },
      "topic/trust": { topicId: TOPIC.trust || "0.0.6896005", network: "testnet" as const, version: 1 },
      "topic/recognition": { topicId: TOPIC.recognition || "0.0.6895261", network: "testnet" as const, version: 1 },
      "topic/profile": { topicId: TOPIC.profile || "0.0.6896008", network: "testnet" as const, version: 1 },
      "topic/system": { topicId: TOPIC.profile || "0.0.6896008", network: "testnet" as const, version: 1 }
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
    
    // Return all verified topics (TEMP: feed → recognition)
    const entries: FlexEntry[] = [
      { key: "topic/feed", value: { topicId: "0.0.6895261", network: "testnet", version: 1 }, uid: "uid-topic/feed" }, // TEMP
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
    if (!this.registryId) {
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

    console.log('[HCS2Registry] Fetching topics from server-side registry...')

    try {
      // Fetch topics from server-side registry API
      const response = await fetch('/api/registry/topics')
      const result = await response.json()
      
      if (result.ok && result.topics) {
        this.cachedTopics = {
          feed: result.topics.feed,
          contacts: result.topics.contacts,
          trust: result.topics.trust,
          recognition: result.topics.recognition,
          profiles: result.topics.profile,
          system: result.topics.system
        }
        
        console.log('[HCS2Registry] Resolved topics from server registry:', this.cachedTopics)
        return this.cachedTopics
      } else {
        throw new Error(result.error || 'Failed to fetch topics from server')
      }
    } catch (error) {
      console.warn('[HCS2Registry] Failed to fetch from server, using fallback:', error)
      
      // Fallback to hardcoded topics if server fetch fails
      const fallbackTopics: TrustMeshTopics = {
        feed: TOPIC.recognition || "0.0.6895261",
        contacts: TOPIC.contacts || "0.0.6896005",
        trust: TOPIC.trust || "0.0.6896005",
        recognition: TOPIC.recognition || "0.0.6895261",
        profiles: TOPIC.profile || "0.0.6896008",
        system: TOPIC.profile || "0.0.6896008"
      }
      
      this.cachedTopics = fallbackTopics
      console.log('[HCS2Registry] Using fallback topics:', this.cachedTopics)
      return this.cachedTopics
    }
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
    if (!this.registryId) {
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

// Fallback topics for production safety  
export function getFallbackTopics(): TrustMeshTopics {
  return process.env.NEXT_PUBLIC_ENABLE_FALLBACK === "1" || !process.env.NEXT_PUBLIC_TRUSTMESH_REGISTRY_ID
    ? {
        feed: '0.0.6895261',        // TEMP: point feed to recognition so activity shows
        contacts: '0.0.6896005',    // shared with feed
        trust: '0.0.6896005',       // shared with feed
        recognition: '0.0.6903900', // recognition definitions and instances
        profiles: '0.0.6896008',    // profiles/system
        system: '0.0.6896008'       // system messages
      }
    : {};
}

// Singleton instances
export const hcs2Registry = new HCS2RegistryClient(); // Legacy compatibility
export const flexRegistry = new HCS2RegistryClient(); // New Flex branding
