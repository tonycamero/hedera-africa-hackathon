// lib/services/DirectHCSRecognitionService.ts
import { MIRROR_REST, TOPIC } from '@/lib/env';

// Server-side compatible cache using file system or memory
interface CacheStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// File-based cache for server-side (with fallback to memory)
class FileCache implements CacheStorage {
  private memoryFallback = new Map<string, string>();
  private cacheDir = typeof process !== 'undefined' ? process.cwd() + '/.trustmesh-cache' : null;
  
  constructor() {
    // Ensure cache directory exists (only on server)
    if (this.cacheDir && typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        if (!fs.existsSync(this.cacheDir)) {
          fs.mkdirSync(this.cacheDir, { recursive: true });
        }
      } catch (error) {
        console.warn('[FileCache] Failed to create cache dir, using memory fallback:', error);
        this.cacheDir = null;
      }
    }
  }
  
  getItem(key: string): string | null {
    if (this.cacheDir && typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const filePath = `${this.cacheDir}/${key}.json`;
        if (fs.existsSync(filePath)) {
          return fs.readFileSync(filePath, 'utf8');
        }
      } catch (error) {
        console.warn(`[FileCache] Failed to read ${key}:`, error);
      }
    }
    return this.memoryFallback.get(key) || null;
  }
  
  setItem(key: string, value: string): void {
    if (this.cacheDir && typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const filePath = `${this.cacheDir}/${key}.json`;
        fs.writeFileSync(filePath, value, 'utf8');
        return;
      } catch (error) {
        console.warn(`[FileCache] Failed to write ${key}:`, error);
      }
    }
    this.memoryFallback.set(key, value);
  }
  
  removeItem(key: string): void {
    if (this.cacheDir && typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const filePath = `${this.cacheDir}/${key}.json`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`[FileCache] Failed to remove ${key}:`, error);
      }
    }
    this.memoryFallback.delete(key);
  }
}

// Create a single instance to maintain cache across requests
let fileCache: FileCache | null = null;

// Use localStorage in browser, file cache on server
const getStorage = (): CacheStorage => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  
  // Reuse same instance for server-side persistence
  if (!fileCache) {
    fileCache = new FileCache();
  }
  return fileCache;
};

export interface RecognitionDefinition {
  id: string;
  slug?: string;
  name: string;
  description: string;
  icon?: string;
  category?: 'social' | 'academic' | 'professional';
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  _hrl: string;
  _ts: string;
}

export interface RecognitionInstance {
  id: string;
  owner: string;
  definitionId: string;
  definitionSlug?: string;
  issuer: string;
  note?: string;
  _hrl: string;
  _ts: string;
}

export interface RecognitionSendEvent {
  id: string;
  type: 'RECOGNITION_MINT';
  from: string;
  to: string;
  definitionId: string;
  definitionName?: string;
  note?: string;
  timestamp: string;
}

/**
 * Direct HCS Recognition Service
 * Fetches recognition data directly from Mirror Node API
 * Consistent with the approach used in Circle and Contacts pages
 */
interface CachedRecognitionData {
  definitions: [string, RecognitionDefinition][];
  instances: RecognitionInstance[];
  events: RecognitionSendEvent[];
  lastFetch: number;
  topicId: string;
}

export class DirectHCSRecognitionService {
  private definitions: Map<string, RecognitionDefinition> = new Map();
  private instances: RecognitionInstance[] = [];
  private events: RecognitionSendEvent[] = [];
  private initialized = false;
  private readonly CACHE_KEY = 'recognition_data';
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private errorCache = new Map<string, { error: Error; ts: number }>();
  private readonly ERROR_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[DirectHCSRecognition] Initializing with direct HCS approach...');
    
    try {
      // Check error cache first
      const cachedError = this.errorCache.get('fetch_recognition');
      if (cachedError && Date.now() - cachedError.ts < this.ERROR_CACHE_TTL) {
        throw cachedError.error;
      }

      // Try to load from cache first
      const cached = this.loadFromCache();
      if (cached && this.isCacheValid(cached)) {
        this.loadFromCachedData(cached);
        this.initialized = true;
        console.log('[DirectHCSRecognition] Loaded from cache:', {
          definitions: this.definitions.size,
          instances: this.instances.length,
          events: this.events.length,
          cacheAge: (Date.now() - cached.lastFetch) / 1000 + 's'
        });
        return;
      }

      // Fetch fresh data from Mirror Node
      await this.fetchRecognitionData();
      this.saveToCache();
      this.initialized = true;
      
      // Clear error cache on success
      this.errorCache.delete('fetch_recognition');
      
      console.log('[DirectHCSRecognition] Initialized with fresh HCS data:', {
        definitions: this.definitions.size,
        instances: this.instances.length,
        events: this.events.length
      });
      
    } catch (error) {
      console.error('[DirectHCSRecognition] Initialization failed:', error);
      
      // Cache the error
      this.errorCache.set('fetch_recognition', { error: error as Error, ts: Date.now() });
      
      // Try to use stale cache as fallback
      const staleCache = this.loadFromCache();
      if (staleCache) {
        this.loadFromCachedData(staleCache);
        this.initialized = true;
        console.warn('[DirectHCSRecognition] Using stale cache as fallback:', {
          definitions: this.definitions.size,
          instances: this.instances.length,
          events: this.events.length,
          cacheAge: (Date.now() - staleCache.lastFetch) / 1000 + 's'
        });
        return;
      }
      
      throw error;
    }
  }

  private async fetchRecognitionData(): Promise<void> {
    const recognitionTopic = TOPIC.recognition || '0.0.6895261';
    const url = `${MIRROR_REST}/topics/${encodeURIComponent(recognitionTopic)}/messages?limit=100&order=asc`;
    
    console.log('[DirectHCSRecognition] Fetching from:', url);
    
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch recognition data: ${response.status}`);
    }
    
    const data = await response.json();
    const messages = data.messages || [];
    
    console.log('[DirectHCSRecognition] Processing', messages.length, 'raw messages');
    
    // Process messages
    for (const msg of messages) {
      try {
        const decoded = Buffer.from(msg.message, 'base64').toString('utf8');
        const msgData = JSON.parse(decoded);
        
        if (msgData.type === 'recognition_definition_created' && msgData.data) {
          this.processDefinition(msgData.data, msg.consensus_timestamp);
        } else if (msgData.type === 'RECOGNITION_MINT') {
          this.processInstance(msgData, msg.consensus_timestamp);
        } else if (msgData.type === 'recognition_mint') {
          this.processEvent(msgData, msg.consensus_timestamp);
        }
        
      } catch (error) {
        console.warn('[DirectHCSRecognition] Failed to process message:', error);
      }
    }
    
    console.log('[DirectHCSRecognition] Processing complete:', {
      definitions: this.definitions.size,
      instances: this.instances.length,
      events: this.events.length
    });
  }

  private processDefinition(data: any, timestamp: string): void {
    const definition: RecognitionDefinition = {
      id: data.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      icon: data.icon,
      category: this.inferCategory(data.name, data.description),
      rarity: this.inferRarity(data.name),
      _hrl: `def/${data.id}`,
      _ts: timestamp
    };
    
    this.definitions.set(data.id, definition);
    if (data.slug) {
      this.definitions.set(data.slug, definition);
    }
  }

  private processInstance(data: any, timestamp: string): void {
    if (!data.owner || !data.definitionId) return;
    
    const instance: RecognitionInstance = {
      id: data.id || `inst_${data.owner}_${data.definitionId}_${Date.now()}`,
      owner: data.owner,
      definitionId: data.definitionId,
      definitionSlug: data.definitionSlug,
      issuer: data.issuer || 'system',
      note: data.note,
      _hrl: `inst/${data.owner}/${data.definitionId}`,
      _ts: timestamp
    };
    
    this.instances.push(instance);
  }

  private processEvent(data: any, timestamp: string): void {
    if (!data.from || !data.to || !data.definitionId) return;
    
    const event: RecognitionSendEvent = {
      id: data.id || `event_${data.from}_${data.to}_${Date.now()}`,
      type: 'RECOGNITION_MINT',
      from: data.from,
      to: data.to,
      definitionId: data.definitionId,
      definitionName: data.definitionName,
      note: data.note,
      timestamp
    };
    
    this.events.push(event);
  }

  private inferCategory(name: string, description: string): 'social' | 'academic' | 'professional' {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.includes('prof') || text.includes('academic') || text.includes('study') || text.includes('note') || text.includes('exam')) {
      return 'academic';
    }
    if (text.includes('work') || text.includes('professional') || text.includes('code') || text.includes('powerpoint') || text.includes('meeting')) {
      return 'professional';
    }
    return 'social';
  }

  private inferRarity(name: string): 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' {
    const rarityMap: { [key: string]: any } = {
      'skibidi': 'Epic',
      'chad': 'Legendary', 
      'savage': 'Rare',
      'goat': 'Legendary',
      'rizz': 'Rare'
    };
    
    return rarityMap[name.toLowerCase()] || 'Common';
  }

  // Public API
  getAllDefinitions(): RecognitionDefinition[] {
    return Array.from(this.definitions.values())
      .filter((def, index, arr) => 
        arr.findIndex(d => d.id === def.id) === index
      ); // Dedupe by ID
  }

  getDefinition(idOrSlug: string): RecognitionDefinition | null {
    return this.definitions.get(idOrSlug) || null;
  }

  getUserInstances(owner: string): RecognitionInstance[] {
    return this.instances.filter(inst => inst.owner === owner);
  }

  getAllInstances(): RecognitionInstance[] {
    return [...this.instances];
  }

  getRecognitionEvents(): RecognitionSendEvent[] {
    return [...this.events];
  }

  getDefinitionsByCategory(category: 'social' | 'academic' | 'professional'): RecognitionDefinition[] {
    return this.getAllDefinitions().filter(def => def.category === category);
  }

  // For sending recognition (simulated for demo)
  async sendRecognition(from: string, to: string, definitionId: string, note?: string): Promise<RecognitionSendEvent> {
    const definition = this.getDefinition(definitionId);
    if (!definition) {
      throw new Error(`Definition not found: ${definitionId}`);
    }

    // Create instance for recipient
    const instance: RecognitionInstance = {
      id: `inst_${to}_${definitionId}_${Date.now()}`,
      owner: to,
      definitionId,
      definitionSlug: definition.slug,
      issuer: from,
      note,
      _hrl: `inst/${to}/${definitionId}`,
      _ts: new Date().toISOString()
    };

    // Create send event
    const event: RecognitionSendEvent = {
      id: `event_${from}_${to}_${Date.now()}`,
      type: 'RECOGNITION_MINT',
      from,
      to,
      definitionId,
      definitionName: definition.name,
      note,
      timestamp: new Date().toISOString()
    };

    // Add to local cache (in real app, this would be sent to HCS)
    this.instances.push(instance);
    this.events.push(event);

    console.log('[DirectHCSRecognition] Sent recognition:', {
      from,
      to,
      definition: definition.name,
      note
    });

    return event;
  }

  isReady(): boolean {
    return this.initialized;
  }

  // Cache management methods
  private saveToCache(): void {
    const recognitionTopic = TOPIC.recognition || '0.0.6895261';
    const cacheData: CachedRecognitionData = {
      definitions: Array.from(this.definitions.entries()),
      instances: [...this.instances],
      events: [...this.events],
      lastFetch: Date.now(),
      topicId: recognitionTopic
    };
    
    try {
      const storage = getStorage();
      storage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('[DirectHCSRecognition] Saved to cache:', {
        definitions: cacheData.definitions.length,
        instances: cacheData.instances.length,
        events: cacheData.events.length,
        storage: typeof window !== 'undefined' ? 'localStorage' : 'memory'
      });
    } catch (error) {
      console.warn('[DirectHCSRecognition] Failed to save cache:', error);
    }
  }

  private loadFromCache(): CachedRecognitionData | null {
    try {
      const storage = getStorage();
      const cached = storage.getItem(this.CACHE_KEY);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached) as CachedRecognitionData;
      console.log('[DirectHCSRecognition] Loaded from cache:', {
        definitions: parsed.definitions.length,
        instances: parsed.instances.length,
        events: parsed.events.length,
        age: (Date.now() - parsed.lastFetch) / 1000 + 's',
        storage: typeof window !== 'undefined' ? 'localStorage' : 'memory'
      });
      return parsed;
    } catch (error) {
      console.warn('[DirectHCSRecognition] Failed to load cache:', error);
      return null;
    }
  }

  private isCacheValid(cached: CachedRecognitionData): boolean {
    const recognitionTopic = TOPIC.recognition || '0.0.6895261';
    const age = Date.now() - cached.lastFetch;
    const topicMatches = cached.topicId === recognitionTopic;
    return age < this.CACHE_TTL && topicMatches;
  }

  private loadFromCachedData(cached: CachedRecognitionData): void {
    this.definitions = new Map(cached.definitions);
    this.instances = [...cached.instances];
    this.events = [...cached.events];
  }

  getDebugInfo() {
    const cached = this.loadFromCache();
    const errors = Array.from(this.errorCache.entries());
    
    return {
      initialized: this.initialized,
      definitionsCount: this.definitions.size,
      instancesCount: this.instances.length,
      eventsCount: this.events.length,
      cache: {
        hasCache: !!cached,
        cacheAge: cached ? (Date.now() - cached.lastFetch) / 1000 : null,
        cacheValid: cached ? this.isCacheValid(cached) : false,
        topicId: cached?.topicId
      },
      errors: errors.map(([key, { error, ts }]) => ({
        key,
        message: error.message,
        age: (Date.now() - ts) / 1000,
        canRetry: Date.now() - ts > this.ERROR_CACHE_TTL
      })),
      sampleDefinitions: this.getAllDefinitions().slice(0, 3).map(d => ({
        id: d.id,
        name: d.name,
        category: d.category
      })),
      dataSource: this.getDataSourceInfo()
    };
  }

  // Helper method to identify data source
  private getDataSourceInfo(): { source: string; freshness: string } {
    const cached = this.loadFromCache();
    if (!cached) return { source: 'none', freshness: 'no-data' };
    
    const age = Date.now() - cached.lastFetch;
    const isValid = this.isCacheValid(cached);
    
    if (isValid) {
      return { source: 'hcs-cached', freshness: `${Math.round(age / 1000)}s-old` };
    } else {
      return { source: 'hcs-stale', freshness: `${Math.round(age / 1000)}s-stale` };
    }
  }

  // Clear cache and errors (for testing/debugging)
  clearCache(): void {
    this.errorCache.clear();
    this.initialized = false;
    this.definitions.clear();
    this.instances = [];
    this.events = [];
    try {
      const storage = getStorage();
      storage.removeItem(this.CACHE_KEY);
    } catch {}
    console.log('[DirectHCSRecognition] Cache and state cleared');
  }
}

export const directHCSRecognitionService = new DirectHCSRecognitionService();